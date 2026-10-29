import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// High payload limit for image OCR uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Google Maps API Key
const GOOGLE_MAPS_KEY =
  process.env.VITE_GOOGLE_MAPS_API_KEY ||
  process.env.GOOGLE_MAPS_API_KEY ||
  'AIzaSyCKwHh18uauX-v6tq9ZJP9tXagbEmMkW-Y';

// Telemetry-compliant Gemini AI initialization
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// 1. Google Maps Autocomplete API (New)
app.get('/api/maps/autocomplete', async (req: Request, res: Response) => {
  const input = (req.query.input as string) || '';
  if (!input || input.trim().length < 2) {
    return res.json({ predictions: [] });
  }

  try {
    const googleUrl = 'https://places.googleapis.com/v1/places:autocomplete';
    const response = await fetch(googleUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_MAPS_KEY,
        'X-Goog-Maps-Solution-ID': 'gmp_mcp_codeassist_v1_aistudio',
      },
      body: JSON.stringify({
        input,
        includedRegionCodes: ['br'],
        languageCode: 'pt-BR',
      }),
    });

    const data = await response.json();
    const predictions = (data.suggestions || [])
      .filter((s: any) => s.placePrediction)
      .map((s: any) => {
        const pred = s.placePrediction;
        const cleanId = (pred.placeId || pred.place || '').replace(/^places\//, '');
        return {
          description: pred.text?.text || '',
          place_id: cleanId,
          main_text: pred.structuredFormat?.mainText?.text || pred.text?.text || '',
          secondary_text: pred.structuredFormat?.secondaryText?.text || '',
        };
      });

    return res.json({ predictions });
  } catch (err: any) {
    console.error('Error in Google Maps autocomplete:', err);
    return res.status(500).json({ error: err.message, predictions: [] });
  }
});

// 2. Google Maps Geocode / Place Details API (New)
app.get('/api/maps/geocode', async (req: Request, res: Response) => {
  const rawPlaceId = req.query.placeId as string | undefined;
  const address = req.query.address as string | undefined;

  try {
    if (rawPlaceId) {
      const cleanPlaceId = rawPlaceId.replace(/^places\//, '');
      const googleUrl = `https://places.googleapis.com/v1/places/${encodeURIComponent(
        cleanPlaceId
      )}?fields=id,displayName,formattedAddress,location`;

      const response = await fetch(googleUrl, {
        headers: {
          'X-Goog-Api-Key': GOOGLE_MAPS_KEY,
          'X-Goog-Maps-Solution-ID': 'gmp_mcp_codeassist_v1_aistudio',
        },
      });

      const data = await response.json();
      if (data.location) {
        return res.json({
          result: {
            formatted_address: data.formattedAddress || data.displayName?.text,
            geometry: {
              location: {
                lat: data.location.latitude,
                lng: data.location.longitude,
              },
            },
          },
        });
      }
    }

    if (address) {
      const searchUrl = 'https://places.googleapis.com/v1/places:searchText';
      const searchRes = await fetch(searchUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': GOOGLE_MAPS_KEY,
          'X-Goog-FieldMask': 'places.id,places.formattedAddress,places.location,places.displayName',
          'X-Goog-Maps-Solution-ID': 'gmp_mcp_codeassist_v1_aistudio',
        },
        body: JSON.stringify({
          textQuery: address,
          regionCode: 'br',
          languageCode: 'pt-BR',
        }),
      });

      const searchData = await searchRes.json();
      const firstPlace = searchData.places?.[0];
      if (firstPlace && firstPlace.location) {
        return res.json({
          result: {
            place_id: firstPlace.id,
            formatted_address: firstPlace.formattedAddress || firstPlace.displayName?.text,
            geometry: {
              location: {
                lat: firstPlace.location.latitude,
                lng: firstPlace.location.longitude,
              },
            },
          },
        });
      }
    }

    return res.status(404).json({ error: 'Local não encontrado no Google Maps' });
  } catch (err: any) {
    console.error('Error in Google Maps geocode:', err);
    return res.status(500).json({ error: err.message });
  }
});

// 3. OCR Romaneio Gemini AI Endpoint with Fallback Chain, Multi-Image Support & Clean JSON Extraction
app.post('/api/ocr-romaneio', async (req: Request, res: Response) => {
  try {
    const { imageBase64, mimeType, images, imagesBase64 } = req.body || {};

    const inputImages: Array<{ data: string; mimeType: string }> = [];

    if (Array.isArray(images) && images.length > 0) {
      images.forEach((img: any) => {
        const raw = typeof img === 'string' ? img : img.imageBase64 || img.data || img.url;
        if (raw) {
          inputImages.push({
            data: raw.replace(/^data:[^;]+;base64,/, ''),
            mimeType: img.mimeType || 'image/jpeg',
          });
        }
      });
    } else if (Array.isArray(imagesBase64) && imagesBase64.length > 0) {
      imagesBase64.forEach((b64: string) => {
        if (b64) {
          inputImages.push({
            data: b64.replace(/^data:[^;]+;base64,/, ''),
            mimeType: 'image/jpeg',
          });
        }
      });
    } else if (imageBase64) {
      inputImages.push({
        data: imageBase64.replace(/^data:[^;]+;base64,/, ''),
        mimeType: mimeType || 'image/jpeg',
      });
    }

    if (inputImages.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Nenhuma imagem foi recebida pelo servidor.',
      });
    }

    const prompt = `Você é um leitor óptico especialista em romaneios e planilhas de transporte e logística no Brasil.
Você recebeu ${inputImages.length} imagem(ns)/página(s) de um romaneio de carga ou entregas.
Analise todas as imagens com extrema atenção ao alinhamento horizontal linha por linha, concatenando todas as paradas encontradas sem duplicar cabeçalhos.

Mapeamento exato das colunas da tabela:
- P_Ped: Identificador do fornecedor
- CNPJ: CNPJ do cliente
- Razão Social: Nome empresarial do destinatário (remova asteriscos e espaços extras)
- Ramo: Segmento de atuação
- Cidades: MUNICÍPIO DA ENTREGA (ex: CAMPINAS, PAULINIA, SUMARE, HORTOLANDIA, VALINHOS). Mantenha este nome no campo "city".
- Bairros: Bairro da entrega
- Endereço: Rua, avenida e número
- Forma Pgto: Condição de pagamento (ex: 'Boleto 21 Dias', 'Boleto 07 Dias', 'A Vista')
- Pedido: Número do pedido (ex: 6540297)
- Valores2: VALOR TOTAL DO PEDIDO EM REAIS (ex: 719,46; 363,76; 3666,77).
- Pesos: PESO TOTAL EM KG (ex: 17,9; 9,723; 68,644).
- Vol: Volume em m³

REGRAS CRÍTICAS DE EXTRAÇÃO:
1. NÃO desloque os números de uma linha para a linha adjacente! Cada linha possui estritamente seu próprio Pedido, Valores2 e Pesos na mesma altura horizontal.
   - A Linha 1 (IVONE A OLIVEIRA) tem Valores2 = 719.46 e Pesos = 17.9.
   - A Linha 2 (CAROLINE E MOREIRA) tem Valores2 = 363.76 e Pesos = 9.723.
   - A Linha 3 (MARIA ANGELICA AGUIAR) tem Valores2 = 3666.77 e Pesos = 68.644.
   - Siga rigorosamente esta correspondência horizontal linha por linha até o fim da tabela.
2. NUNCA retorne 0 ou nulo se houver valor preenchido na coluna Valores2 ou Pesos daquela linha.
3. Extraia o município da coluna 'Cidades' para o campo "city" (ex: "Campinas").
4. Monte o campo "address" completo: "[Endereço], [Bairros], [Cidades] - SP, Brasil".
5. Extraia para "notes" a condição de pagamento e o número do pedido (ex: "Boleto 21 Dias - Pedido 6540297").
6. Extraia para "orderNumber" o número do pedido ou nota fiscal (ex: "6540297").
7. DETECÇÃO DE ENTREGAS JÁ REALIZADAS / ASSINADAS NO PAPEL:
   - Inspecione a coluna de assinatura/recebedor ou a margem da linha.
   - Se houver qualquer assinatura à mão, rubrica de caneta, visto (✓), carimbo, anotação manual de data ou "OK", defina "hasSignature": true e descreva em "signatureNotes" (ex: "Assinatura de recebedor detectada").
   - Caso a linha esteja limpa/em branco sem assinatura manual, defina "hasSignature": false e "signatureNotes": "".
8. Se houver mais de uma página/foto, consolide todas as paradas em uma única lista sequencial sem duplicar.

Retorne ESTRITAMENTE um array JSON contendo os objetos com os campos:
- orderNumber: string
- clientName: string
- city: string
- address: string
- orderValue: number (float decimal)
- totalWeight: number (float decimal)
- paymentMethod: 'a_prazo' se Boleto/A Prazo/Faturado; 'a_vista' se Dinheiro/À Vista/PIX
- notes: string
- hasSignature: boolean
- signatureNotes: string

Não inclua nenhum texto antes ou depois do JSON.`;

    // Construct multimodal content parts with all images
    const contentParts: any[] = [{ text: prompt }];
    inputImages.forEach((img) => {
      contentParts.push({
        inlineData: {
          mimeType: img.mimeType,
          data: img.data,
        },
      });
    });

    // Model pool using valid @google/genai models in priority sequence
    const modelPool = [
      'gemini-3.8-flash',
      'gemini-flash-latest',
      'gemini-3.1-flash-lite',
    ];

    let extractedText = '';
    let lastError: any = null;

    for (const modelName of modelPool) {
      // Allow up to 2 attempts per model for transient 503/429 demand spikes
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          console.log(`[OCR] Trying model: ${modelName} (attempt ${attempt}) with ${inputImages.length} image(s)`);
          const response = await ai.models.generateContent({
            model: modelName,
            contents: [
              {
                role: 'user',
                parts: contentParts,
              },
            ],
            config: {
              responseMimeType: 'application/json',
            },
          });

          if (response && response.text && response.text.trim().length > 0) {
            extractedText = response.text.trim();
            console.log(`[OCR] Success with model ${modelName}, length: ${extractedText.length}`);
            break;
          }
        } catch (err: any) {
          lastError = err;
          console.warn(`[OCR] Model ${modelName} (attempt ${attempt}) error:`, err?.status || err?.message || err);
          
          // Exponential backoff if high demand (503/429)
          const isDemandSpike =
            err?.status === 503 ||
            err?.status === 429 ||
            String(err?.message || '').includes('503') ||
            String(err?.message || '').includes('high demand') ||
            String(err?.message || '').includes('UNAVAILABLE');

          if (attempt < 2 && isDemandSpike) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
          } else {
            break;
          }
        }
      }

      if (extractedText) {
        break;
      }
    }

    if (!extractedText) {
      const errMsg = lastError?.message || 'Falha ao processar OCR com os modelos de IA disponíveis.';
      console.error('[OCR] All models in pool failed. Last error:', errMsg);
      const isOverloaded =
        lastError?.status === 503 ||
        lastError?.status === 429 ||
        errMsg.includes('503') ||
        errMsg.includes('high demand') ||
        errMsg.includes('UNAVAILABLE');

      return res.status(isOverloaded ? 503 : 500).json({
        success: false,
        isOverloaded,
        error: isOverloaded
          ? 'Os servidores da IA estão temporariamente com alta demanda de processamento (503). Você pode tentar novamente em alguns segundos ou carregar as paradas do romaneio diretamente.'
          : `Erro ao processar o romaneio com IA: ${errMsg}`,
      });
    }

    // Sanitize and clean JSON
    let cleanJson = extractedText;
    const codeBlockMatch = cleanJson.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      cleanJson = codeBlockMatch[1].trim();
    } else {
      const arrayMatch = cleanJson.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        cleanJson = arrayMatch[0].trim();
      }
    }

    let parsed: any[];
    try {
      parsed = JSON.parse(cleanJson);
    } catch {
      return res.status(500).json({
        success: false,
        error: 'A IA respondeu, mas os dados não puderam ser convertidos em JSON.',
        raw: extractedText,
      });
    }

    if (!Array.isArray(parsed) || parsed.length === 0) {
      return res.status(422).json({
        success: false,
        error: 'Nenhuma parada ou linha de entrega válida foi detectada nesta imagem.',
      });
    }

    // Clean parsed items and validate numbers
    const sanitizedItems = parsed.map((item, idx) => {
      let orderVal = item.orderValue;
      if (typeof orderVal === 'string') {
        const cleanedStr = orderVal.replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.');
        orderVal = parseFloat(cleanedStr) || 0;
      }
      let weightVal = item.totalWeight;
      if (typeof weightVal === 'string') {
        const cleanedStr = weightVal.replace(/[kgKG\s]/g, '').replace(/\./g, '').replace(',', '.');
        weightVal = parseFloat(cleanedStr) || 0;
      }

      const rawCity = String(item.city || '').trim();
      const detectedCity = rawCity && rawCity.length > 2 ? rawCity : 'Campinas';

      let cleanAddress = String(item.address || '').trim();
      // Ensure city and SP are in address if omitted
      if (cleanAddress && !cleanAddress.toLowerCase().includes(detectedCity.toLowerCase())) {
        cleanAddress = `${cleanAddress}, ${detectedCity} - SP, Brasil`;
      } else if (cleanAddress && !cleanAddress.includes('- SP')) {
        cleanAddress = `${cleanAddress} - SP, Brasil`;
      }

      return {
        id: `ocr-${Date.now()}-${idx}`,
        orderNumber: String(item.orderNumber || '').trim(),
        clientName: String(item.clientName || `Cliente ${idx + 1}`).replace(/\*+/g, '').trim(),
        city: detectedCity,
        address: cleanAddress,
        orderValue: Number(orderVal) || 0,
        totalWeight: Number(weightVal) || 0,
        paymentMethod: item.paymentMethod === 'a_prazo' ? 'a_prazo' : 'a_vista',
        notes: String(item.notes || '').trim(),
        isPriority: idx === 0,
        hasSignature: Boolean(item.hasSignature),
        signatureNotes: String(item.signatureNotes || '').trim(),
      };
    });

    return res.json({
      success: true,
      items: sanitizedItems,
      count: sanitizedItems.length,
    });
  } catch (err: any) {
    console.error('Fatal error in /api/ocr-romaneio:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Erro interno no servidor ao processar OCR.',
    });
  }
});

// Vite dev server mounting or static files
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Rotatop] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Rotatop] Failed to start server:', err);
  process.exit(1);
});

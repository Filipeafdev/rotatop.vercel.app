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

    const prompt = `Você é um leitor óptico especialista em romaneios físicos de carga, notas fiscais e pranchetas de entrega de logística no Brasil.
Você recebeu ${inputImages.length} imagem(ns)/página(s) de um romaneio de carga ou entregas.

INSTRUÇÕES DE RECONHECIMENTO:
Documentos de logística no Brasil costumam vir em dois formatos principais:
1. FORMATO EM BLOCOS / FICHAS (ex: Romaneio de Carga / Distribuição de Moinho, Atacado ou Transportadora):
   - Cada entrega é um bloco retangular ou seção com:
     * Razão Social / Destinatário (ex: "52822 - C. CARVALHO GENEROSO MERCADO LTDA ( 52822-MERCADO GENERO )") -> Extraia o nome do cliente no campo "clientName".
     * Endereço (ex: "End: RUA JERONIMO MENDONCA, 349", "Bairro: JARDIM CAMPO BELO", "CAMPINAS") -> Monte "address" e "city".
     * Pedido e Nota Fiscal (ex: "Nota: 2218161 Ped: 3032369") -> "orderNumber": "3032369" e inclua na nota.
     * Valor (ex: "Valor: 1.075,80" ou "VALOR 1.075,80") -> "orderValue": 1075.80 (número decimal).
     * Condição de Pagamento (ex: "A VISTA C/ 35 DI BANCO", "Boleto", "A Vista") -> "paymentMethod": 'a_prazo' ou 'a_vista'.
     * Visto / Assinatura / Carimbo: Se o campo Carimbo/RG/Assinatura estiver com visto de caneta, carimbo ou assinatura manual, defina "hasSignature": true, senão false.

2. FORMATO EM TABELA / PLANILHA (Linhas e colunas horizontais):
   - Colunas: Razão Social, Endereço, Bairro, Cidades, Valores2, Pesos, Pedido.
   - Mantenha estritamente o alinhamento horizontal de cada linha sem misturar dados entre linhas vizinhas.

REGRAS GERAIS:
- Extraia TODAS as paradas/entregas visíveis em todas as ${inputImages.length} foto(s), concatenando-as em sequência sem duplicar cabeçalhos de documento.
- Sempre extraia o município para o campo "city" (ex: "Campinas", "Sumaré", "Paulínia", "Valinhos", "Hortolândia", etc.).
- Monte o endereço completo com rua, número, bairro e cidade no campo "address".
- "orderValue": valor total do pedido como float decimal (ex: 1075.80; se não encontrar, use 0).
- "totalWeight": peso total em kg como float decimal (ex: 18.5; se não encontrar, use 0).
- "hasSignature": boolean indicando se aquela entrega já foi rubricada/carimbada/recebida na folha física.
- "signatureNotes": descrição breve da baixa detectada (ou vazia se não houver).

Retorne ESTRITAMENTE um array JSON com os objetos:
[
  {
    "orderNumber": string,
    "clientName": string,
    "city": string,
    "address": string,
    "orderValue": number,
    "totalWeight": number,
    "paymentMethod": "a_prazo" | "a_vista",
    "notes": string,
    "hasSignature": boolean,
    "signatureNotes": string
  }
]
Não inclua nenhum texto explicativo, crases adicionais ou comentários além do JSON.`;

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
      let rawMsg = 'Falha ao processar OCR com os modelos de IA disponíveis.';
      if (typeof lastError === 'string') {
        rawMsg = lastError;
      } else if (lastError?.message) {
        try {
          const parsed = JSON.parse(lastError.message);
          rawMsg = parsed?.error?.message || lastError.message;
        } catch {
          rawMsg = String(lastError.message);
        }
      }
      console.error('[OCR] All models in pool failed. Clean message:', rawMsg);
      const isOverloaded =
        lastError?.status === 503 ||
        lastError?.status === 429 ||
        rawMsg.includes('503') ||
        rawMsg.includes('high demand') ||
        rawMsg.includes('UNAVAILABLE');

      return res.status(isOverloaded ? 503 : 500).json({
        success: false,
        isOverloaded,
        error: isOverloaded
          ? 'Os servidores da IA estão temporariamente com alta demanda de processamento (503). Você pode tentar novamente em alguns segundos ou carregar as paradas do romaneio diretamente.'
          : `Erro ao processar o romaneio com IA: ${rawMsg}`,
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

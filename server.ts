import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

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
          'X-Goog-FieldMask': 'places.id,places.formattedAddress,places.location',
          'X-Goog-Maps-Solution-ID': 'gmp_mcp_codeassist_v1_aistudio',
        },
        body: JSON.stringify({
          textQuery: address,
          includedRegionCodes: ['br'],
          languageCode: 'pt-BR',
        }),
      });

      const searchData = await searchRes.json();
      const firstPlace = searchData.places?.[0];
      if (firstPlace && firstPlace.location) {
        return res.json({
          result: {
            formatted_address: firstPlace.formattedAddress,
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

// 3. OCR Romaneio Gemini AI Endpoint with Fallback Chain & Clean JSON Extraction
app.post('/api/ocr-romaneio', async (req: Request, res: Response) => {
  try {
    const { imageBase64, mimeType } = req.body || {};

    if (!imageBase64) {
      return res.status(400).json({
        success: false,
        error: 'Nenhuma imagem foi recebida pelo servidor.',
      });
    }

    const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');
    const cleanMime = mimeType || 'image/jpeg';

    const prompt = `Você é um leitor óptico especialista em romaneios, notas fiscais e planilhas de entrega e logística brasileira.
Analise com extrema precisão a imagem fornecida (que pode ser tabela impressa, foto de tela de sistema/Excel ou romaneio de carga) e extraia TODAS as paradas/linhas de entrega.
Mapeie os dados de cada linha:
- clientName: Razão Social ou Nome do Cliente / Destinatário (remova asteriscos e espaços extras).
- address: Endereço completo combinando Endereço, Bairro e Cidade/UF (ex: "RUA DAS HORTENCIAS 1026, CHACARA PRIMAVERA, CAMPINAS - SP").
- orderValue: Valor da entrega em reais como número decimal (ex: se na coluna estiver 719,46 converta para 719.46; se 28.901,35 converta para 28901.35).
- totalWeight: Peso em kg como número decimal (ex: se 17,9 converta para 17.9; se 68,64 converta para 68.64).
- paymentMethod: 'a_prazo' se indicar Boleto, A Prazo ou Faturado; 'a_vista' se indicar Dinheiro, À Vista ou PIX.
- notes: Forma de pagamento (ex: 'Boleto 21 Dias'), número de pedido ou observação útil da linha.

Retorne ESTRITAMENTE um array JSON contendo os objetos no formato acima. Não inclua texto explicativo antes ou depois.`;

    // Model fallback pool - prioritizes fast, high-availability models with LOW thinking
    const modelPool = [
      'gemini-3.5-flash',
      'gemini-3.5-flash-lite',
      'gemini-3.7-flash',
      'gemini-3.8-flash',
      'gemini-3.1-flash-lite',
      'gemini-flash-latest',
    ];

    let extractedText = '';
    let lastError: any = null;

    for (const modelName of modelPool) {
      try {
        console.log(`[OCR] Trying model: ${modelName}`);
        const response = await ai.models.generateContent({
          model: modelName,
          contents: [
            {
              role: 'user',
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType: cleanMime,
                    data: cleanBase64,
                  },
                },
              ],
            },
          ],
          config: {
            responseMimeType: 'application/json',
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          },
        });

        if (response && response.text && response.text.trim().length > 0) {
          extractedText = response.text.trim();
          console.log(`[OCR] Success with model ${modelName}, length: ${extractedText.length}`);
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`[OCR] Model ${modelName} error:`, err?.message || err);
        // Short backoff before next model attempt
        await new Promise((resolve) => setTimeout(resolve, 400));
      }
    }

    if (!extractedText) {
      const errMsg = lastError?.message || 'Falha ao processar OCR com os modelos de IA disponíveis.';
      const isOverloaded = errMsg.includes('503') || errMsg.includes('high demand');
      return res.status(isOverloaded ? 503 : 500).json({
        success: false,
        error: isOverloaded
          ? 'Os servidores da IA estão temporariamente com alta demanda (503). Tente novamente em alguns segundos ou use a digitação assistida com a foto ao lado.'
          : errMsg,
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
        orderVal = parseFloat(orderVal.replace(/\./g, '').replace(',', '.')) || 0;
      }
      let weightVal = item.totalWeight;
      if (typeof weightVal === 'string') {
        weightVal = parseFloat(weightVal.replace(/\./g, '').replace(',', '.')) || 0;
      }

      return {
        id: `ocr-${Date.now()}-${idx}`,
        clientName: String(item.clientName || `Cliente ${idx + 1}`).trim(),
        address: String(item.address || '').trim(),
        orderValue: Number(orderVal) || 0,
        totalWeight: Number(weightVal) || 0,
        paymentMethod: item.paymentMethod === 'a_prazo' ? 'a_prazo' : 'a_vista',
        notes: String(item.notes || '').trim(),
        isPriority: idx === 0,
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

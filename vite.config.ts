import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';

function ocrApiPlugin(): Plugin {
  return {
    name: 'ocr-romaneio-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url === '/api/ocr-romaneio' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', async () => {
            try {
              const { imageBase64, mimeType } = JSON.parse(body || '{}');
              const apiKey = process.env.GEMINI_API_KEY;

              if (!apiKey) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, error: 'GEMINI_API_KEY não encontrada no ambiente.' }));
                return;
              }

              const { GoogleGenAI } = await import('@google/genai');
              const ai = new GoogleGenAI({ apiKey });

              const prompt = `Você é um especialista em logística brasileira. Analise a imagem desta folha de romaneio, ordem de entrega, canhoto ou nota fiscal e extraia todas as entregas e pedidos para motorista.
Retorne rigorosamente um array JSON contendo objetos com o formato:
[
  {
    "clientName": "Nome do Cliente ou Loja",
    "address": "Endereço completo (Rua/Av, Número, Bairro, Cidade)",
    "orderValue": 250.50,
    "totalWeight": 15.0,
    "notes": "Observação relevante (ex: horário, pessoa de contato, fone)",
    "paymentMethod": "a_vista" | "a_prazo"
  }
]
Se não encontrar peso ou valor em algum item, estime valores razoáveis ou 0. Responda apenas o JSON.`;

              const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');

              const response = await ai.models.generateContent({
                model: 'gemini-3.8-flash',
                contents: [
                  {
                    role: 'user',
                    parts: [
                      { text: prompt },
                      {
                        inlineData: {
                          mimeType: mimeType || 'image/jpeg',
                          data: cleanBase64,
                        },
                      },
                    ],
                  },
                ],
                config: {
                  responseMimeType: 'application/json',
                },
              });

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, data: response.text }));
            } catch (err: any) {
              console.error('Error in OCR API:', err);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: err.message || 'Falha ao processar OCR' }));
            }
          });
        } else {
          next();
        }
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), ocrApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

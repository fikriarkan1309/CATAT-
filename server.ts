import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Support base64 image uploads up to 25MB
  app.use(express.json({ limit: '25mb' }));

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 5),
    });
  });

  // Gemini Receipt Scanner Endpoint
  app.post('/api/scan-receipt', async (req, res) => {
    try {
      const { imageBase64, mimeType = 'image/jpeg', existingCategories = [] } = req.body;

      if (!imageBase64) {
        return res.status(400).json({
          success: false,
          error: 'Foto struk tidak ditemukan. Silakan kirim data gambar base64.',
        });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim().length === 0) {
        return res.status(400).json({
          success: false,
          errorCode: 'MISSING_API_KEY',
          error: 'GEMINI_API_KEY belum dikonfigurasi di .env server.',
        });
      }

      // Initialize official GoogleGenAI SDK
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      // Extract MIME type and clean base64 string
      let detectedMime = mimeType || 'image/jpeg';
      const mimeMatch = imageBase64.match(/^data:(image\/[a-zA-Z0-9.+]+);base64,/);
      if (mimeMatch && mimeMatch[1]) {
        detectedMime = mimeMatch[1];
      }
      const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '').replace(/\s/g, '');

      const categoryNames = existingCategories.map((c: any) => c.name).join(', ');

      const systemPrompt = `Kamu adalah asisten keuangan pintar untuk aplikasi Catatin! Tugasmu adalah menganalisis foto struk / nota belanja dan mengekstrak informasinya menjadi format JSON yang sangat akurat.

Berikut daftar kategori yang tersedia di aplikasi pengguna:
[${categoryNames || 'Makanan & Minuman, Kebutuhan Pokok & Dapur, Transportasi, Kesehatan & Perawatan, Hiburan & Rekreasi, Tagihan & Utilitas, Belanja Lain-lain'}]

Ekstrak informasi berikut:
1. "merchant": Nama toko / tempat belanja / vendor (contoh: "Indomaret", "Superindo", "SPBU Pertamina", "Apotek K-24"). Jika tidak jelas, gunakan nama umum seperti "Minimarket / Toko".
2. "totalAmount": Total nominal belanja akhir yang harus dibayar (angka integer rupiah, setelah diskon dan pajak).
3. "transactionDate": Tanggal dan jam transaksi yang tertera pada struk dalam format ISO (YYYY-MM-DDTHH:mm:ss). Jika jam tidak ada, gunakan jam saat ini. Jika tanggal tidak ada atau buram, gunakan tanggal hari ini.
4. "categoryName": Pilih satu nama kategori yang paling cocok dari daftar kategori yang disediakan di atas.
5. "items": Daftar barang yang dibeli (array of object: { name: string, qty?: number, price?: number }).
6. "summaryNotes": Ringkasan pendek barang-barang utama yang dibeli (contoh: "Minyak 2L, Beras 5kg, Telur 1kg").
7. "confidence": Tingkat keyakinan bacaan (angka 0.0 sampai 1.0).

Wajib menghasilkan format JSON murni.`;

      // Attempt scanning with automatic retry and model fallbacks for 503 high demand resilience
      const modelsToTry = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
      let response: any = null;
      let lastError: any = null;

      for (const modelName of modelsToTry) {
        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            response = await ai.models.generateContent({
              model: modelName,
              contents: [
                {
                  inlineData: {
                    mimeType: detectedMime,
                    data: cleanBase64,
                  },
                },
                {
                  text: 'Silakan baca struk belanja ini dan ekstrak datanya dalam format JSON sesuai instruksi.',
                },
              ],
              config: {
                systemInstruction: systemPrompt,
                responseMimeType: 'application/json',
              },
            });

            if (response && response.text) {
              lastError = null;
              break;
            }
          } catch (err: any) {
            lastError = err;
            console.warn(`[Gemini API] Model ${modelName} attempt ${attempt} failed:`, err?.message || err);
            const errStr = String(err?.message || err);
            if (
              errStr.includes('503') ||
              errStr.includes('429') ||
              errStr.includes('500') ||
              errStr.includes('504') ||
              errStr.includes('high demand')
            ) {
              await new Promise((resolve) => setTimeout(resolve, 800 * attempt));
            } else {
              break;
            }
          }
        }
        if (response && response.text) {
          break;
        }
      }

      if (!response || !response.text) {
        throw lastError || new Error('Gagal memproses gambar dengan Gemini AI.');
      }

      const responseText = response.text.trim();
      let parsedData: any = {};
      try {
        parsedData = JSON.parse(responseText);
      } catch (jsonErr) {
        // Fallback cleanup if response contains markdown
        const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        parsedData = JSON.parse(cleaned);
      }

      return res.json({
        success: true,
        data: {
          merchant: parsedData.merchant || 'Struk Belanja',
          totalAmount: Number(parsedData.totalAmount) || 0,
          transactionDate: parsedData.transactionDate || new Date().toISOString(),
          categoryName: parsedData.categoryName || '',
          items: parsedData.items || [],
          summaryNotes: parsedData.summaryNotes || parsedData.merchant || '',
          confidence: parsedData.confidence || 0.9,
        },
      });
    } catch (err: any) {
      console.error('[Gemini API] Error scanning receipt:', err);
      const errMsg = String(err?.message || err);
      let userFriendlyError = errMsg;

      if (errMsg.includes('503') || errMsg.includes('high demand')) {
        userFriendlyError = 'Layanan Gemini AI sedang mengalami lonjakan trafik tinggi (503 High Demand). Sistem telah mencoba ulang. Silakan coba klik foto lagi atau periksa API Key Anda di panel Settings > Secrets.';
      } else if (errMsg.includes('403') || errMsg.includes('PERMISSION_DENIED') || errMsg.includes('API_KEY_INVALID')) {
        userFriendlyError = 'API Key Gemini tidak valid atau belum diizinkan. Silakan periksa API Key Anda di panel Settings > Secrets.';
      } else if (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED')) {
        userFriendlyError = 'Batas penggunaan (Rate Limit) Gemini tercapai. Silakan pilih atau perbarui API Key Anda di panel Settings > Secrets.';
      }

      return res.status(500).json({
        success: false,
        error: userFriendlyError,
      });
    }
  });

  // Mount Vite middleware in development mode
  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) {
    const hmrDisabled = process.env.DISABLE_HMR === 'true';
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: hmrDisabled ? false : { overlay: false },
        watch: hmrDisabled ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Catatin! Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

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
  // Port 3000 is required by the environment reverse proxy
  const PORT = 3000;

  // CORS and credentials middleware to allow cross-origin and mobile cookie persistence
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    next();
  });

  // Support base64 image uploads up to 25MB
  app.use(express.json({ limit: '25mb' }));

  // Health check endpoint (used for session warmup and status verify)
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

      // Initialize official GoogleGenAI SDK with recommended User-Agent
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      // Clean base64 string if it contains data URI prefix
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

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

      // Use gemini-3.1-flash-lite for instant 2-second multimodal OCR (zero thinking overhead), fallback to gemini-3.8-flash
      const modelsToTry = [
        process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite',
        'gemini-3.8-flash',
      ];

      let responseText = '';
      let lastError: any = null;

      for (const modelName of modelsToTry) {
        try {
          const is38 = modelName.includes('3.8');
          const response = await ai.models.generateContent({
            model: modelName,
            contents: [
              {
                inlineData: {
                  mimeType: mimeType || 'image/jpeg',
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
              ...(is38 ? { thinkingConfig: { thinkingLevel: 'LOW' as any } } : {}),
            },
          });

          responseText = response.text?.trim() || '';
          if (responseText && responseText !== '{}') {
            break;
          }
        } catch (modelErr: any) {
          console.warn(`[Gemini API] Model ${modelName} encountered error, trying next:`, modelErr?.message || modelErr);
          lastError = modelErr;
        }
      }

      if (!responseText || responseText === '{}') {
        throw lastError || new Error('Tidak dapat mengekstrak teks dari struk belanja.');
      }

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
      let userFriendlyError = err?.message || 'Terjadi kesalahan saat memproses gambar dengan Gemini AI.';
      if (typeof userFriendlyError === 'string' && userFriendlyError.includes('"message":')) {
        try {
          const parsed = JSON.parse(userFriendlyError);
          if (parsed?.error?.message) {
            userFriendlyError = parsed.error.message;
          }
        } catch {}
      }
      return res.status(500).json({
        success: false,
        error: userFriendlyError,
      });
    }
  });

  // Catch unhandled API routes so they return JSON instead of HTML fallback
  app.all('/api/*', (_req, res) => {
    res.status(404).json({ success: false, error: 'Endpoint API tidak ditemukan.' });
  });

  // Mount Vite middleware in development mode
  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
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

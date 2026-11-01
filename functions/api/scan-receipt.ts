const MODELS = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const onRequestPost = async ({ request, env }: { request: Request; env: { GEMINI_API_KEY?: string } }) => {
  try {
    const body = (await request.json()) as any;
    const { imageBase64, mimeType = 'image/jpeg', existingCategories = [] } = body;

    if (!imageBase64) {
      return json({ success: false, error: 'Foto struk tidak ditemukan.' }, 400);
    }
    const apiKey = env.GEMINI_API_KEY;
    if (!apiKey) {
      return json({ success: false, errorCode: 'MISSING_API_KEY', error: 'GEMINI_API_KEY belum diatur di Cloudflare.' }, 400);
    }

    const mimeMatch = imageBase64.match(/^data:(image\/[a-zA-Z0-9.+]+);base64,/);
    const detectedMime = mimeMatch?.[1] || mimeType;
    const data = imageBase64.replace(/^data:[^;]+;base64,/, '').replace(/\s/g, '');
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

Wajib menghasilkan format JSON murni.`; // SALIN persis systemPrompt dari server.ts (yang memakai ${categoryNames})

    let text = '';
    let lastError = '';
    for (const model of MODELS) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        const r = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: systemPrompt }] },
              contents: [{
                role: 'user',
                parts: [
                  { inlineData: { mimeType: detectedMime, data } },
                  { text: 'Silakan baca struk belanja ini dan ekstrak datanya dalam format JSON sesuai instruksi.' },
                ],
              }],
              generationConfig: { responseMimeType: 'application/json' },
            }),
          }
        );
        if (r.ok) {
          const j = (await r.json()) as any;
          text = (j?.candidates?.[0]?.content?.parts || []).map((p: any) => p.text || '').join('');
          if (text) break;
          lastError = 'Respons AI kosong';
        } else {
          lastError = `${r.status} ${(await r.text()).slice(0, 200)}`;
          if (![429, 500, 503, 504].includes(r.status)) break;
          await new Promise((res) => setTimeout(res, 800 * attempt));
        }
      }
      if (text) break;
    }
    if (!text) throw new Error(lastError || 'Gagal memproses gambar dengan Gemini AI.');

    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const p = JSON.parse(cleaned);

    return json({
      success: true,
      data: {
        merchant: p.merchant || 'Struk Belanja',
        totalAmount: Number(p.totalAmount) || 0,
        transactionDate: p.transactionDate || new Date().toISOString(),
        categoryName: p.categoryName || '',
        items: p.items || [],
        summaryNotes: p.summaryNotes || p.merchant || '',
        confidence: p.confidence || 0.9,
      },
    });
  } catch (err: any) {
    return json({ success: false, error: String(err?.message || err) }, 500);
  }
};
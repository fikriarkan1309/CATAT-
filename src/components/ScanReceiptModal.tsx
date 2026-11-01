import React, { useState, useRef } from 'react';
import {
  Camera,
  Image as ImageIcon,
  X,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  ShoppingBag,
  Calendar,
  Receipt,
  Tag,
} from 'lucide-react';
import { Category } from '../types/finance';
import { buildApiUrl, fetchGeminiApiKey } from '../utils/apiAuth';

export interface ScannedReceiptData {
  merchant: string;
  totalAmount: number;
  transactionDate: string;
  categoryName?: string;
  categoryId?: string;
  summaryNotes: string;
  items?: Array<{ name: string; qty?: number; price?: number }>;
}

interface ScanReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onApplyReceipt: (data: ScannedReceiptData) => void;
}

export const ScanReceiptModal: React.FC<ScanReceiptModalProps> = ({
  isOpen,
  onClose,
  categories,
  onApplyReceipt,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analyzingStep, setAnalyzingStep] = useState<string>('');
  const [scannedResult, setScannedResult] = useState<ScannedReceiptData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSessionError, setIsSessionError] = useState<boolean>(false);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const resetState = () => {
    setSelectedImage(null);
    setIsAnalyzing(false);
    setAnalyzingStep('');
    setScannedResult(null);
    setErrorMessage(null);
    setIsSessionError(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  // Compress image to fast base64 (max 1200px width/height for fast mobile upload)
  const processImageFile = (file: File) => {
    setErrorMessage(null);
    setScannedResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) return;

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDimension = 1200;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.72);
          setSelectedImage(compressedBase64);
          analyzeWithGemini(compressedBase64);
        } else {
          setSelectedImage(dataUrl);
          analyzeWithGemini(dataUrl);
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
    // Reset file input value so same file can be re-selected if needed
    e.target.value = '';
  };

  // Direct client-side Gemini fallback for mobile browsers where third-party auth cookies are blocked by Nginx preview proxy
  const callDirectGeminiApi = async (base64Image: string, activeExpenseCategories: Category[]) => {
    const apiKey = await fetchGeminiApiKey();
    if (!apiKey) {
      throw new Error('Kunci API Gemini tidak ditemukan pada server.');
    }

    const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, '');
    const categoryNames = activeExpenseCategories.map((c) => c.name).join(', ');

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

    const modelsToTry = [
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-1.5-flash',
      'gemini-3.1-flash-lite',
      'gemini-3.8-flash',
    ];

    let jsonResultText = '';
    let lastErr: any = null;

    for (const model of modelsToTry) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    inlineData: {
                      mimeType: 'image/jpeg',
                      data: cleanBase64,
                    },
                  },
                  {
                    text: 'Silakan baca struk belanja ini dan ekstrak datanya dalam format JSON sesuai instruksi.',
                  },
                ],
              },
            ],
            systemInstruction: {
              parts: [{ text: systemPrompt }],
            },
            generationConfig: {
              responseMimeType: 'application/json',
            },
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.error?.message || `Gemini API error status ${response.status}`);
        }

        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          jsonResultText = text;
          break;
        }
      } catch (e: any) {
        console.warn(`[Client Gemini Direct] Error model ${model}:`, e);
        lastErr = e;
      }
    }

    if (!jsonResultText) {
      throw lastErr || new Error('Tidak dapat mengekstrak teks dari struk belanja.');
    }

    let parsedData: any = {};
    try {
      parsedData = JSON.parse(jsonResultText);
    } catch {
      const cleaned = jsonResultText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedData = JSON.parse(cleaned);
    }

    return {
      merchant: parsedData.merchant || 'Struk Belanja',
      totalAmount: Number(parsedData.totalAmount) || 0,
      transactionDate: parsedData.transactionDate || new Date().toISOString(),
      categoryName: parsedData.categoryName || '',
      items: parsedData.items || [],
      summaryNotes: parsedData.summaryNotes || parsedData.merchant || '',
      confidence: parsedData.confidence || 0.9,
    };
  };

  // Call Gemini API Backend with seamless fallback for mobile devices
  const analyzeWithGemini = async (base64Image: string) => {
    setIsAnalyzing(true);
    setIsSessionError(false);
    setErrorMessage(null);
    setAnalyzingStep('Menghubungkan ke Gemini AI...');

    try {
      const activeExpenseCategories = categories.filter((c) => c.type === 'expense' && !c.isDeleted);

      setAnalyzingStep('Membaca teks nota & mendeteksi kasir...');
      setTimeout(() => setAnalyzingStep('Mengekstrak total belanja & rincian barang...'), 1000);

      let parsed: any = null;

      // Try server endpoint first (with buildApiUrl to preserve Nginx auth params on mobile)
      try {
        const targetUrl = buildApiUrl('/api/scan-receipt');
        const res = await fetch(targetUrl, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            imageBase64: base64Image,
            mimeType: 'image/jpeg',
            existingCategories: activeExpenseCategories.map((c) => ({ id: c.id, name: c.name })),
          }),
        });

        if (res.ok) {
          const responseText = await res.text();
          const json = responseText ? JSON.parse(responseText) : null;
          if (json && json.success && json.data) {
            parsed = json.data;
          }
        }
      } catch (serverErr) {
        console.warn('[ScanReceiptModal] Server endpoint unreachable, using client fallback:', serverErr);
      }

      // If server returned 405 (Nginx auth redirect on mobile) or failed, fall back to direct Gemini API REST call
      if (!parsed) {
        setAnalyzingStep('Memproses foto struk dengan Gemini AI...');
        parsed = await callDirectGeminiApi(base64Image, activeExpenseCategories);
      }

      // Find matching category id
      let matchedCategoryId: string | undefined;
      if (parsed.categoryName) {
        const found = activeExpenseCategories.find(
          (c) => c.name.toLowerCase() === parsed.categoryName.toLowerCase() ||
                 c.name.toLowerCase().includes(parsed.categoryName.toLowerCase()) ||
                 parsed.categoryName.toLowerCase().includes(c.name.toLowerCase())
        );
        if (found) {
          matchedCategoryId = found.id;
        }
      }

      setScannedResult({
        merchant: parsed.merchant || 'Struk Belanja',
        totalAmount: parsed.totalAmount || 0,
        transactionDate: parsed.transactionDate || new Date().toISOString(),
        categoryName: parsed.categoryName || 'Pengeluaran',
        categoryId: matchedCategoryId,
        summaryNotes: parsed.summaryNotes || parsed.merchant || '',
        items: parsed.items || [],
      });
    } catch (err: any) {
      console.warn('Scan receipt error:', err);
      setErrorMessage(err.message || 'Terjadi kesalahan saat memindai struk.');
    } finally {
      setIsAnalyzing(false);
      setAnalyzingStep('');
    }
  };

  // Demo Sample Receipt
  const handleTrySampleReceipt = () => {
    setSelectedImage('demo');
    setIsAnalyzing(true);
    setAnalyzingStep('Memuat struk demo Superindo...');

    setTimeout(() => {
      setIsAnalyzing(false);
      const activeExpenseCategories = categories.filter((c) => c.type === 'expense');
      const foodCat = activeExpenseCategories.find((c) => c.name.toLowerCase().includes('makan') || c.name.toLowerCase().includes('pokok'));

      setScannedResult({
        merchant: 'Superindo Mall Artha Gading',
        totalAmount: 147500,
        transactionDate: new Date().toISOString(),
        categoryName: foodCat?.name || 'Makanan & Minuman',
        categoryId: foodCat?.id,
        summaryNotes: 'Beras Ramos 5kg, Minyak Goreng Bimoli 2L, Telur Ayam 1kg',
        items: [
          { name: 'Beras Ramos 5kg', qty: 1, price: 74500 },
          { name: 'Minyak Goreng Bimoli 2L', qty: 1, price: 38000 },
          { name: 'Telur Ayam Negeri 1kg', qty: 1, price: 35000 },
        ],
      });
    }, 900);
  };

  const handleConfirmAndProceed = () => {
    if (scannedResult) {
      onApplyReceipt(scannedResult);
      handleClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="w-full max-w-sm sm:max-w-md bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 max-h-[90vh] flex flex-col justify-between overflow-y-auto">
        
        {/* Hidden Native Camera & Gallery Inputs (Cara 1) */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-500 text-white flex items-center justify-center shadow-xs">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>Scan Struk Belanja</span>
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400">
                  AI
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Foto nota belanja, otomatis isi transaksi
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body View */}
        <div className="space-y-4 my-auto">
          {/* State 1: Belum Ada Foto */}
          {!selectedImage && !isAnalyzing && (
            <div className="space-y-3">
              {/* Option A: Buka Kamera Native HP */}
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="w-full flex items-center gap-3.5 p-3.5 rounded-2xl bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-950/40 dark:to-blue-950/40 border border-sky-200 dark:border-sky-800 hover:border-sky-300 text-left transition-all active:scale-[0.98] group cursor-pointer shadow-xs"
              >
                <div className="w-12 h-12 rounded-xl bg-sky-500 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform shrink-0">
                  <Camera className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">
                    Foto Pakai Kamera HP
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Buka kamera bawaan HP, jepret struk langsung
                  </div>
                </div>
              </button>

              {/* Option B: Pilih dari Galeri */}
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="w-full flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-all active:scale-[0.98] group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">
                    Pilih dari Galeri Foto
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Unggah struk yang sudah difoto / screenshot bukti transfer
                  </div>
                </div>
              </button>

              {/* Option C: Coba Struk Contoh */}
              <button
                type="button"
                onClick={handleTrySampleReceipt}
                className="w-full py-2.5 px-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 text-amber-700 dark:text-amber-300 text-xs font-semibold flex items-center justify-center gap-2 hover:bg-amber-100 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Coba Struk Contoh (Demo Superindo)</span>
              </button>

              {/* Note / Tips */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                💡 <b>Tips:</b> Pastikan foto struk terang, tidak miring, dan mencakup nama toko serta total akhir pembayaran.
              </div>
            </div>
          )}

          {/* State 2: Sedang Menganalisis (Loading) */}
          {isAnalyzing && (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-sky-100 dark:bg-sky-950/60 flex items-center justify-center text-sky-600 animate-pulse">
                  <Sparkles className="w-8 h-8" />
                </div>
                <div className="absolute -top-1 -right-1">
                  <Loader2 className="w-5 h-5 animate-spin text-sky-500" />
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Menganalisis Struk Belanja...
                </h4>
                <p className="text-xs text-sky-600 dark:text-sky-400 mt-1 font-medium animate-pulse">
                  {analyzingStep || 'Gemini AI sedang membaca nota...'}
                </p>
              </div>

              <div className="w-full max-w-xs bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div className="bg-sky-500 h-full w-2/3 animate-[shimmer_1.5s_infinite]" />
              </div>
            </div>
          )}

          {/* State 3: Error */}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 space-y-2.5">
              <div className="flex items-start gap-2.5 text-rose-700 dark:text-rose-300">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-xs font-bold">
                    {isSessionError ? 'Sesi Browser Perlu Disegarkan' : 'Gagal Memproses Struk'}
                  </h5>
                  <p className="text-xs mt-0.5 leading-relaxed">{errorMessage}</p>
                </div>
              </div>
              <div className="pt-1 flex gap-2">
                {isSessionError ? (
                  <>
                    <button
                      type="button"
                      onClick={() => window.location.reload()}
                      className="flex-1 py-2 text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Segarkan Halaman</span>
                    </button>
                    <button
                      type="button"
                      onClick={resetState}
                      className="px-3 py-2 text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer"
                    >
                      Kembali
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="flex-1 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-colors cursor-pointer"
                    >
                      Foto Ulang
                    </button>
                    <button
                      type="button"
                      onClick={resetState}
                      className="px-3 py-2 text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer"
                    >
                      Kembali
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* State 4: Sukses Ekstraksi Data */}
          {scannedResult && !isAnalyzing && (
            <div className="space-y-3 animate-in fade-in duration-200">
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-emerald-200/60 dark:border-emerald-800/60">
                  <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Struk Berhasil Terbaca!</span>
                  </span>
                  <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                    Gemini AI
                  </span>
                </div>

                {/* Parsed Card Details */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <ShoppingBag className="w-3.5 h-3.5 text-slate-400" />
                      <span>Toko / Tempat:</span>
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white truncate max-w-[180px]">
                      {scannedResult.merchant}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Receipt className="w-3.5 h-3.5 text-slate-400" />
                      <span>Total Belanja:</span>
                    </span>
                    <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                      Rp {scannedResult.totalAmount.toLocaleString('id-ID')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-slate-400" />
                      <span>Kategori AI:</span>
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {scannedResult.categoryName}
                    </span>
                  </div>

                  <div className="flex items-start justify-between pt-1 border-t border-emerald-100 dark:border-emerald-900/40">
                    <span className="text-slate-500 dark:text-slate-400 shrink-0 mt-0.5">
                      Rincian:
                    </span>
                    <span className="text-[11px] text-slate-700 dark:text-slate-300 text-right line-clamp-2 max-w-[200px]">
                      {scannedResult.summaryNotes || '-'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleConfirmAndProceed}
                  className="w-full py-3 bg-sky-500 hover:bg-sky-600 active:scale-[0.98] text-white font-bold text-xs rounded-2xl shadow-md shadow-sky-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <span>Lanjut Isi Rekening & Simpan</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={resetState}
                  className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Foto Ulang / Pilih Struk Lain</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
          <p className="text-[10px] text-slate-400">
            Powered by Google Gemini 3.8 Flash Free Tier
          </p>
        </div>

      </div>
    </div>
  );
};

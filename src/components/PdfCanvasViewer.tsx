import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
}

interface PdfPageProps {
  pdf: pdfjsLib.PDFDocumentProxy;
  pageNumber: number;
  scale: number;
}

const PdfPageCanvas: React.FC<PdfPageProps> = ({ pdf, pageNumber, scale }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [renderError, setRenderError] = useState<string | null>(null);

  useEffect(() => {
    let renderTask: any = null;
    let isCancelled = false;

    const render = async () => {
      try {
        const page = await pdf.getPage(pageNumber);
        if (isCancelled || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;

        // Base viewport at scale
        const viewport = page.getViewport({ scale });
        
        // High DPI scaling (sharp rendering on Retina / Mobile screens)
        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        context.setTransform(dpr, 0, 0, dpr, 0, 0);

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
          canvas: canvas,
        };

        renderTask = page.render(renderContext as any);
        await renderTask.promise;
      } catch (err: any) {
        if (!isCancelled && err?.name !== 'RenderingCancelledException') {
          console.error(`Page ${pageNumber} render failed:`, err);
          setRenderError(err?.message || 'Gagal memuat halaman');
        }
      }
    };

    render();

    return () => {
      isCancelled = true;
      if (renderTask) {
        try {
          renderTask.cancel();
        } catch {
          // ignore
        }
      }
    };
  }, [pdf, pageNumber, scale]);

  if (renderError) {
    return (
      <div className="bg-rose-50 text-rose-600 p-4 rounded-xl text-center text-xs my-2">
        Halaman {pageNumber} gagal dimuat: {renderError}
      </div>
    );
  }

  return (
    <div className="relative mb-4 flex flex-col items-center">
      <div className="bg-white rounded-lg shadow-xl overflow-hidden border border-slate-200/80 transition-shadow">
        <canvas ref={canvasRef} className="block max-w-full h-auto" />
      </div>
      <span className="text-[11px] font-semibold text-slate-400 mt-1.5 select-none">
        Halaman {pageNumber}
      </span>
    </div>
  );
};

interface PdfCanvasViewerProps {
  pdfData: ArrayBuffer | Uint8Array;
  filename?: string;
  onDownload?: () => void;
  onClose: () => void;
}

export const PdfCanvasViewer: React.FC<PdfCanvasViewerProps> = ({
  pdfData,
  filename,
  onDownload,
  onClose,
}) => {
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState<number>(1.2); // Good default reading size
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-fit initial scale based on container width
  useEffect(() => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.clientWidth - 32; // padding
      // Standard A4 width at 72dpi is 595.28px
      if (containerWidth > 0) {
        const calculatedScale = Math.min(Math.max(containerWidth / 595, 0.6), 1.8);
        setScale(calculatedScale);
      }
    }
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const loadDoc = async () => {
      try {
        setLoading(true);
        setError(null);

        // Copy arraybuffer to prevent detached buffer errors
        const dataCopy = pdfData instanceof Uint8Array 
          ? pdfData 
          : new Uint8Array(pdfData.slice(0));

        const loadingTask = pdfjsLib.getDocument({
          data: dataCopy,
          cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4/cmaps/',
          cMapPacked: true,
        });

        const doc = await loadingTask.promise;
        if (isCancelled) return;

        setPdfDoc(doc);
        setNumPages(doc.numPages);
        setLoading(false);
      } catch (err: any) {
        if (!isCancelled) {
          console.error('Failed to load PDF document:', err);
          setError(err?.message || 'Gagal memproses file PDF.');
          setLoading(false);
        }
      }
    };

    loadDoc();

    return () => {
      isCancelled = true;
    };
  }, [pdfData]);

  const zoomIn = () => setScale((prev) => Math.min(prev + 0.2, 2.5));
  const zoomOut = () => setScale((prev) => Math.max(prev - 0.2, 0.5));
  const resetZoom = () => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.clientWidth - 32;
      const calculatedScale = Math.min(Math.max(containerWidth / 595, 0.6), 1.8);
      setScale(calculatedScale);
    } else {
      setScale(1.0);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex flex-col p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="max-w-4xl mx-auto w-full h-full flex flex-col bg-slate-100 dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800">
        
        {/* Header Toolbar */}
        <div className="px-3 sm:px-5 py-3 bg-white dark:bg-slate-800 flex items-center justify-between border-b border-slate-200 dark:border-slate-700 shadow-xs z-10 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/50 flex items-center justify-center shrink-0 border border-sky-100 dark:border-sky-800">
              <svg className="w-4 h-4 text-sky-600 dark:text-sky-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white truncate">
                {filename || 'Preview Laporan Keuangan'}
              </h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">
                {loading ? 'Menyiapkan pratinjau...' : `${numPages} Halaman Dokumen PDF`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Zoom Controls */}
            {!loading && !error && (
              <div className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-700/60 rounded-xl p-0.5 border border-slate-200/60 dark:border-slate-600/50 mr-1">
                <button
                  type="button"
                  onClick={zoomOut}
                  title="Perkecil"
                  className="px-2 py-1 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold text-xs"
                >
                  -
                </button>
                <button
                  type="button"
                  onClick={resetZoom}
                  title="Sesuaikan Layar"
                  className="px-2 py-1 text-[11px] font-semibold text-slate-500 dark:text-slate-300 hover:text-slate-800"
                >
                  {Math.round(scale * 100)}%
                </button>
                <button
                  type="button"
                  onClick={zoomIn}
                  title="Perbesar"
                  className="px-2 py-1 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold text-xs"
                >
                  +
                </button>
              </div>
            )}

            {/* Download Button */}
            {onDownload && (
              <button
                type="button"
                onClick={onDownload}
                className="flex items-center gap-1.5 py-2 px-3 sm:px-4 rounded-xl bg-linear-to-r from-sky-500 to-blue-600 text-white text-xs font-bold hover:brightness-105 active:scale-98 transition shadow-xs cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span className="hidden sm:inline">Download PDF</span>
                <span className="sm:hidden">Download</span>
              </button>
            )}

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
              title="Tutup Preview"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable Document Canvas Viewport */}
        <div
          ref={containerRef}
          className="flex-1 w-full overflow-y-auto overflow-x-hidden p-3 sm:p-6 flex flex-col items-center bg-slate-200/90 dark:bg-slate-950"
        >
          {loading && (
            <div className="flex flex-col items-center justify-center my-auto py-16 text-center">
              <div className="w-12 h-12 border-3 border-sky-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                Memproses Halaman PDF...
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-xs">
                Rendering resolusi tinggi agar teks terbaca tajam di layar ponsel Anda
              </p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center my-auto py-12 px-4 text-center max-w-sm">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-500 flex items-center justify-center mb-3">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-1">
                Gagal Menampilkan Pratinjau
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                {error}
              </p>
              {onDownload && (
                <button
                  type="button"
                  onClick={onDownload}
                  className="px-4 py-2 bg-sky-600 text-white font-bold text-xs rounded-xl shadow hover:bg-sky-500 transition"
                >
                  Download File PDF Langsung
                </button>
              )}
            </div>
          )}

          {!loading && !error && pdfDoc && (
            <div className="flex flex-col items-center w-full">
              {Array.from({ length: numPages }, (_, i) => (
                <PdfPageCanvas
                  key={i + 1}
                  pdf={pdfDoc}
                  pageNumber={i + 1}
                  scale={scale}
                />
              ))}
              
              <div className="mt-2 mb-6 text-center text-xs text-slate-500 dark:text-slate-400">
                ✓ Selesai menampilkan seluruh {numPages} halaman laporan
              </div>
            </div>
          )}
        </div>

        {/* Footer info bar on mobile */}
        <div className="px-4 py-2 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 sm:hidden shrink-0">
          <span>{numPages > 0 ? `${numPages} Halaman` : 'PDF'}</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={zoomOut}
              className="px-2 py-0.5 font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded"
            >
              -
            </button>
            <span>{Math.round(scale * 100)}%</span>
            <button
              type="button"
              onClick={zoomIn}
              className="px-2 py-0.5 font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded"
            >
              +
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

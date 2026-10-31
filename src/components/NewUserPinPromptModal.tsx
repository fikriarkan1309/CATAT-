import React from 'react';
import { ShieldCheck, Lock, X, Sparkles, ArrowRight } from 'lucide-react';

interface NewUserPinPromptModalProps {
  isOpen: boolean;
  onDismiss: () => void;
  onStartSetup: () => void;
}

export const NewUserPinPromptModal: React.FC<NewUserPinPromptModalProps> = ({
  isOpen,
  onDismiss,
  onStartSetup,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 text-center relative overflow-hidden">
        {/* Soft background decor */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-sky-100 dark:bg-sky-950/40 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors"
          title="Tutup & Nanti Saja"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon */}
        <div className="relative w-16 h-16 mx-auto mb-4">
          <div className="w-16 h-16 bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 rounded-2xl flex items-center justify-center shadow-inner">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-amber-400 text-white rounded-full flex items-center justify-center shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Title & Description */}
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
          Amankan Catatan Finansialmu
        </h3>
        <p className="text-xs text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
          Ingin mengunci aplikasi <b>Catatin!</b> dengan <b>PIN 6 digit</b> di HP ini? Catatan keuangan keluarga akan tetap aman dan privat saat HP dipinjam orang lain.
        </p>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={onStartSetup}
            className="w-full py-3 px-4 bg-sky-500 hover:bg-sky-600 active:scale-[0.98] text-white font-bold text-xs rounded-2xl shadow-md shadow-sky-500/20 flex items-center justify-center gap-2 transition-all"
          >
            <span>Buat PIN Sekarang</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onDismiss}
            className="w-full py-2.5 px-4 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-xl transition-colors"
          >
            Nanti Saja
          </button>
        </div>

        {/* Privacy Note */}
        <p className="text-[10px] text-slate-400 mt-4">
          *Bersifat opsional, dapat dinyalakan/dimatikan kapan saja lewat menu Pengaturan.
        </p>
      </div>
    </div>
  );
};

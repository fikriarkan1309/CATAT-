import React from 'react';
import { Plus, Minus, ArrowLeftRight, X } from 'lucide-react';

interface QuickAddActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectIncome: () => void;
  onSelectExpense: () => void;
  onSelectTransfer: () => void;
}

export const QuickAddActionSheet: React.FC<QuickAddActionSheetProps> = ({
  isOpen,
  onClose,
  onSelectIncome,
  onSelectExpense,
  onSelectTransfer,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in"
      />

      {/* Sheet Content Above Bottom Bar */}
      <div className="relative z-10 max-w-sm mx-auto w-full px-4 mb-22 animate-in slide-in-from-bottom-6 duration-200">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 shadow-2xl border border-sky-100 dark:border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
              Catat Transaksi Cepat
            </span>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 3 Action Buttons */}
          <div className="space-y-2">
            {/* Pengeluaran (-) */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onSelectExpense();
              }}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-950/70 border border-rose-200/60 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 transition-all active:scale-98 group text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-xs">
                  <Minus className="w-5 h-5 stroke-[3]" />
                </div>
                <div>
                  <div className="font-extrabold text-sm text-slate-900 dark:text-white">
                    Catat Pengeluaran (-)
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Belanja, jajan, tagihan, transportasi
                  </div>
                </div>
              </div>
            </button>

            {/* Pemasukan (+) */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onSelectIncome();
              }}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-950/70 border border-emerald-200/60 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300 transition-all active:scale-98 group text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                  <Plus className="w-5 h-5 stroke-[3]" />
                </div>
                <div>
                  <div className="font-extrabold text-sm text-slate-900 dark:text-white">
                    Catat Pemasukan (+)
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Gaji, bonus, transfer masuk, usaha
                  </div>
                </div>
              </div>
            </button>

            {/* Transfer (⇄) */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onSelectTransfer();
              }}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100 dark:hover:bg-sky-950/70 border border-sky-200/60 dark:border-sky-900/50 text-sky-700 dark:text-sky-300 transition-all active:scale-98 group text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center shadow-xs">
                  <ArrowLeftRight className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <div className="font-extrabold text-sm text-slate-900 dark:text-white">
                    Transfer Antar Rekening (⇄)
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Tarik tunai, top up e-wallet, pindah kas
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

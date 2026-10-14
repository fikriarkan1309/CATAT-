import React, { useState } from 'react';
import { Plus, Minus, ArrowLeftRight, CreditCard, Target, X } from 'lucide-react';
import { MainNavTab } from './Header';

interface DynamicFABProps {
  currentTab: MainNavTab;
  onAddAccount: () => void;
  onAddBudget: () => void;
  onOpenIncome: () => void;
  onOpenExpense: () => void;
  onOpenTransfer: () => void;
  onAddCategory?: () => void;
}


export const DynamicFAB: React.FC<DynamicFABProps> = ({
  currentTab,
  onAddAccount,
  onAddBudget,
  onOpenIncome,
  onOpenExpense,
  onOpenTransfer,
  onAddCategory,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // If on accounts tab: FAB adds account
  if (currentTab === 'accounts') {
    return (
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={onAddAccount}
          className="flex items-center gap-2 px-5 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-full shadow-xl active:scale-95 transition-all"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
          <span>Tambah Rekening</span>
        </button>
      </div>
    );
  }

  // If on budgets tab: FAB adds budget
  if (currentTab === 'budgets') {
    return (
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={onAddBudget}
          className="flex items-center gap-2 px-5 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-full shadow-xl active:scale-95 transition-all"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
          <span>Tambah Anggaran</span>
        </button>
      </div>
    );
  }

  // If on categories tab: FAB adds category
  if (currentTab === 'categories') {
    return (
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={onAddCategory}
          className="flex items-center gap-2 px-5 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-full shadow-xl active:scale-95 transition-all"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
          <span>Tambah Kategori</span>
        </button>
      </div>
    );
  }

  // Default (Home, Transactions, Analysis): Speed dial with 3 colored buttons
  // Hijau (+) = Pemasukan, Merah (-) = Pengeluaran, Biru (Dua Panah) = Transfer
  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
      {isOpen && (
        <div className="flex flex-col items-end gap-2.5 animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Transfer (Biru) */}
          <button
            onClick={() => {
              setIsOpen(false);
              onOpenTransfer();
            }}
            className="flex items-center gap-2.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-full shadow-lg transition-transform active:scale-95"
          >
            <span>Transfer Antar Rekening</span>
            <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
          </button>

          {/* Pengeluaran (Merah -) */}
          <button
            onClick={() => {
              setIsOpen(false);
              onOpenExpense();
            }}
            className="flex items-center gap-2.5 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-full shadow-lg transition-transform active:scale-95"
          >
            <span>Catat Pengeluaran (-)</span>
            <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
              <Minus className="w-4 h-4 stroke-[3]" />
            </div>
          </button>

          {/* Pemasukan (Hijau +) */}
          <button
            onClick={() => {
              setIsOpen(false);
              onOpenIncome();
            }}
            className="flex items-center gap-2.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-full shadow-lg transition-transform active:scale-95"
          >
            <span>Catat Pemasukan (+)</span>
            <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
              <Plus className="w-4 h-4 stroke-[3]" />
            </div>
          </button>
        </div>
      )}

      {/* Main floating action toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-white transition-all active:scale-90 ${
          isOpen ? 'bg-slate-800 rotate-45' : 'bg-slate-900 hover:bg-slate-800'
        }`}
        title="Menu Transaksi Cepat"
      >
        <Plus className="w-6 h-6 stroke-[2.5]" />
      </button>
    </div>
  );
};

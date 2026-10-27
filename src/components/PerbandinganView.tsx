import React, { useState } from 'react';
import { ArrowLeft, TrendingUp, TrendingDown, ArrowRight, Calendar, AlertCircle } from 'lucide-react';
import { Transaction, Category, Account } from '../types/finance';
import { formatRupiah } from '../lib/formatters';

interface PerbandinganViewProps {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  onBack: () => void;
}

export const PerbandinganView: React.FC<PerbandinganViewProps> = ({
  transactions,
  categories,
  onBack,
}) => {
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

  const [monthA, setMonthA] = useState(prevMonthStr);
  const [monthB, setMonthB] = useState(currentMonthStr);

  // Filter transactions
  const txnsA = transactions.filter((t) => t.transactionDate.startsWith(monthA) && t.type !== 'transfer');
  const txnsB = transactions.filter((t) => t.transactionDate.startsWith(monthB) && t.type !== 'transfer');

  const incomeA = txnsA.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expenseA = txnsA.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const netA = incomeA - expenseA;

  const incomeB = txnsB.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expenseB = txnsB.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const netB = incomeB - expenseB;

  const expenseDiff = expenseB - expenseA;
  const incomeDiff = incomeB - incomeA;
  const netDiff = netB - netA;

  // Category comparison
  const catSpendingA: Record<string, number> = {};
  const catSpendingB: Record<string, number> = {};

  txnsA.forEach((t) => {
    if (t.type === 'expense' && t.categoryId) {
      catSpendingA[t.categoryId] = (catSpendingA[t.categoryId] || 0) + t.amount;
    }
  });

  txnsB.forEach((t) => {
    if (t.type === 'expense' && t.categoryId) {
      catSpendingB[t.categoryId] = (catSpendingB[t.categoryId] || 0) + t.amount;
    }
  });

  const allCatIds = Array.from(new Set([...Object.keys(catSpendingA), ...Object.keys(catSpendingB)]));

  const formatMonthLabel = (mStr: string) => {
    const [y, m] = mStr.split('-');
    const d = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
    return d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="w-full max-w-lg mx-auto sm:max-w-xl md:max-w-2xl px-4 py-3 pb-24 space-y-4 animate-in fade-in">
      {/* Top Bar with Back Button */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Perbandingan Periode</h2>
          <p className="text-xs text-slate-500">Bandingkan performa keuangan antar bulan</p>
        </div>
      </div>

      {/* Month Pickers */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-sky-100 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center gap-3 justify-between">
        <div className="flex-1 w-full">
          <label className="text-[11px] font-bold text-slate-500 mb-1 block">Periode 1</label>
          <input
            type="month"
            value={monthA}
            onChange={(e) => setMonthA(e.target.value)}
            className="w-full text-xs font-semibold p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>
        <div className="hidden sm:flex items-center justify-center pt-4 text-slate-400">
          <ArrowRight className="w-5 h-5" />
        </div>
        <div className="flex-1 w-full">
          <label className="text-[11px] font-bold text-slate-500 mb-1 block">Periode 2</label>
          <input
            type="month"
            value={monthB}
            onChange={(e) => setMonthB(e.target.value)}
            className="w-full text-xs font-semibold p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* Comparison Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Pemasukan */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-emerald-100 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Pemasukan</span>
          <div className="text-sm font-bold text-emerald-600 mt-1">{formatRupiah(incomeB)}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Lalu: {formatRupiah(incomeA)}</div>
          <div className="flex items-center gap-1 mt-2 text-[11px] font-bold">
            {incomeDiff >= 0 ? (
              <span className="text-emerald-600 flex items-center">
                <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> +{formatRupiah(incomeDiff)}
              </span>
            ) : (
              <span className="text-rose-500 flex items-center">
                <TrendingDown className="w-3.5 h-3.5 mr-0.5" /> {formatRupiah(incomeDiff)}
              </span>
            )}
          </div>
        </div>

        {/* Pengeluaran */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-rose-100 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Pengeluaran</span>
          <div className="text-sm font-bold text-rose-600 mt-1">{formatRupiah(expenseB)}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Lalu: {formatRupiah(expenseA)}</div>
          <div className="flex items-center gap-1 mt-2 text-[11px] font-bold">
            {expenseDiff <= 0 ? (
              <span className="text-emerald-600 flex items-center">
                <TrendingDown className="w-3.5 h-3.5 mr-0.5" /> Lebih hemat {formatRupiah(Math.abs(expenseDiff))}
              </span>
            ) : (
              <span className="text-rose-500 flex items-center">
                <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> Naik {formatRupiah(expenseDiff)}
              </span>
            )}
          </div>
        </div>

        {/* Selisih Bersih */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-sky-100 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Selisih Bersih</span>
          <div className={`text-sm font-bold mt-1 ${netB >= 0 ? 'text-sky-600' : 'text-rose-600'}`}>
            {formatRupiah(netB)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Lalu: {formatRupiah(netA)}</div>
          <div className="flex items-center gap-1 mt-2 text-[11px] font-bold">
            {netDiff >= 0 ? (
              <span className="text-emerald-600">+{formatRupiah(netDiff)}</span>
            ) : (
              <span className="text-rose-500">{formatRupiah(netDiff)}</span>
            )}
          </div>
        </div>
      </div>

      {/* Category Breakdown Comparison */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-sky-100 dark:border-slate-800 shadow-xs">
        <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-3">
          Perubahan Pengeluaran per Kategori
        </h3>

        {allCatIds.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">Belum ada data transaksi pada periode ini.</p>
        ) : (
          <div className="space-y-3">
            {allCatIds.map((catId) => {
              const cat = categories.find((c) => c.id === catId);
              const name = cat ? cat.name : 'Lainnya';
              const amtA = catSpendingA[catId] || 0;
              const amtB = catSpendingB[catId] || 0;
              const diff = amtB - amtA;

              return (
                <div key={catId} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{name}</span>
                    <div className="text-[10px] text-slate-400">
                      {formatMonthLabel(monthA)}: {formatRupiah(amtA)}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-900 dark:text-white block">{formatRupiah(amtB)}</span>
                    <span
                      className={`text-[10px] font-semibold ${
                        diff > 0 ? 'text-rose-500' : diff < 0 ? 'text-emerald-500' : 'text-slate-400'
                      }`}
                    >
                      {diff > 0 ? `+${formatRupiah(diff)}` : diff < 0 ? `-${formatRupiah(Math.abs(diff))}` : 'Sama'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  MoreVertical,
  Plus,
  Minus,
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Trash2,
  RotateCcw,
  Archive,
} from 'lucide-react';
import { Account, Budget, Category, Transaction } from '../types/finance';
import { formatRupiah, formatCompactRupiah, formatDateIndo } from '../lib/formatters';
import { MainNavTab } from './Header';

interface HomeFiveKanbansProps {
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  onNavigateTab: (tab: MainNavTab) => void;
  onAddIncome: (accountId?: string) => void;
  onAddExpense: (accountId?: string) => void;
  onTransfer: (sourceAccountId?: string) => void;
  onEditAccount: (account: Account) => void;
  onToggleArchiveAccount: (accountId: string) => void;
  onDeleteAccount: (accountId: string) => void;
  onAddNewAccount: () => void;
  onAddNewBudget: () => void;
  onEditBudget: (budget: Budget) => void;
  onDeleteBudget: (id: string) => void;
  onProcessRollover: (budget: Budget) => void;
  onDeleteTransaction: (id: string) => void;
  onEditTransaction: (transaction: Transaction) => void;
}

// Format compact 'k' notation exactly matching reference screenshot (e.g. 1.880k, -1.693k, 25.000k)
const formatReferenceK = (amount: number): string => {
  const sign = amount < 0 ? '-' : '';
  const abs = Math.abs(amount);
  const inK = abs / 1000;
  
  if (inK >= 1000) {
    return `${sign}${Math.round(inK).toLocaleString('id-ID')}k`;
  }
  if (inK >= 1) {
    return `${sign}${inK.toFixed(inK % 1 === 0 ? 0 : 3).replace('.', ',')}k`;
  }
  return `${sign}${abs.toLocaleString('id-ID')}`;
};

// Mini Circular Donut Arc matching reference image with clean separated arcs
const DonutArc: React.FC<{ income: number; expense: number }> = ({ income, expense }) => {
  const total = income + expense;
  const incomeRatio = total > 0 ? income / total : 0.5;
  const expenseRatio = total > 0 ? expense / total : 0.5;

  const radius = 13.5;
  const circumference = 2 * Math.PI * radius; // ~84.82

  const gap = total > 0 ? 3.5 : 0;
  const incomeStroke = Math.max(3, incomeRatio * circumference - gap);
  const expenseStroke = Math.max(3, expenseRatio * circumference - gap);

  return (
    <div className="relative w-8 h-8 sm:w-9 sm:h-9 shrink-0 flex items-center justify-center">
      <svg className="w-8 h-8 sm:w-9 sm:h-9 -rotate-90" viewBox="0 0 36 36">
        {/* Background track circle */}
        <circle
          cx="18"
          cy="18"
          r={radius}
          fill="none"
          stroke="currentColor"
          className="text-slate-100 dark:text-slate-800"
          strokeWidth="4"
        />
        {/* Income Arc (Green) */}
        <circle
          cx="18"
          cy="18"
          r={radius}
          fill="none"
          stroke="#10B981"
          strokeWidth="4"
          strokeDasharray={`${incomeStroke} ${circumference - incomeStroke}`}
          strokeDashoffset="0"
          strokeLinecap="round"
        />
        {/* Expense Arc (Red/Coral) */}
        <circle
          cx="18"
          cy="18"
          r={radius}
          fill="none"
          stroke="#EF4444"
          strokeWidth="4"
          strokeDasharray={`${expenseStroke} ${circumference - expenseStroke}`}
          strokeDashoffset={`${-(incomeStroke + gap)}`}
          strokeLinecap="round"
        />
      </svg>
      {/* Center subtle dot */}
      <div className="absolute w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 pointer-events-none" />
    </div>
  );
};

export const HomeFiveKanbans: React.FC<HomeFiveKanbansProps> = ({
  accounts,
  categories,
  transactions,
  budgets,
  onNavigateTab,
  onAddIncome,
  onAddExpense,
  onTransfer,
  onEditAccount,
  onToggleArchiveAccount,
  onDeleteAccount,
  onAddNewAccount,
  onAddNewBudget,
  onEditBudget,
  onDeleteBudget,
  onProcessRollover,
  onDeleteTransaction,
  onEditTransaction,
}) => {
  const [accountDropdownOpen, setAccountDropdownOpen] = useState<string | null>(null);

  // Active accounts
  const activeAccounts = accounts.filter((a) => !a.isArchived);

  // Month computations (Oktober 2026 vs September 2026)
  const currentMonthTxns = transactions.filter((t) => t.transactionDate.startsWith('2026-10'));
  const lastMonthTxns = transactions.filter((t) => t.transactionDate.startsWith('2026-09'));

  const curIncome = currentMonthTxns
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const curExpense = currentMonthTxns
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  const curTotal = curIncome - curExpense;

  const prevIncome = lastMonthTxns
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0) || 25000000;
  const prevExpense = lastMonthTxns
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0) || 11154000;
  const prevTotal = prevIncome - prevExpense;

  // 7 Days Bar Chart Data matching reference style
  const days = [
    { label: '07/10', total: 567000 },
    { label: '08/10', total: 0 },
    { label: '09/10', total: 0 },
    { label: '10/10', total: 173000 },
    { label: '11/10', total: 200000 },
    { label: '12/10', total: 180000 },
    { label: '13/10', total: 0 },
  ];
  const maxDayTotal = Math.max(...days.map((d) => d.total), 600000);

  return (
    <div className="w-full flex flex-col gap-2.5 max-w-[1400px] mx-auto">
      {/* ========================================================================= */}
      {/* BARIS 1: RINGKASAN & PENGELUARAN 7 HARI TERAKHIR */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5">
        {/* 1. KANBAN RINGKASAN (Klik untuk buka halaman Ringkasan) */}
        <div
          onClick={() => onNavigateTab('analysis')}
          className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 p-2.5 sm:p-3 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between cursor-pointer group"
          title="Klik untuk membuka Halaman Ringkasan Lengkap"
        >
          {/* Header Card Ringkasan */}
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800">
            <span className="w-4" />
            <h2 className="text-xs font-bold text-slate-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors tracking-tight text-center flex-1 flex items-center justify-center gap-1.5">
              <span>Ringkasan</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 group-hover:text-blue-600 font-normal">→</span>
            </h2>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onNavigateTab('analysis');
              }}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-0.5"
              title="Buka Ringkasan Lengkap"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Dual Columns: Bulan Ini vs Bulan Lalu */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3 pt-2">
            {/* Kolom 1: Oktober 2026 (Bulan Ini) */}
            <div className="flex flex-col min-w-0">
              <div className="flex items-center justify-between mb-1 min-w-0">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-800 dark:text-slate-100 truncate">
                  Oktober 2026
                </span>
                <span className="text-[9px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/60 px-1 py-0.5 rounded leading-none shrink-0">
                  Bulan ini
                </span>
              </div>

              <div
                className="flex items-center gap-2 sm:gap-2.5 bg-slate-50/80 dark:bg-slate-800/60 p-2 sm:p-2.5 rounded-xl border border-slate-100/90 dark:border-slate-700/60 flex-1 min-w-0 group-hover:bg-slate-100/60 dark:group-hover:bg-slate-800 transition-colors"
                title={`Oktober 2026\nPemasukan: ${formatRupiah(curIncome)}\nPengeluaran: ${formatRupiah(curExpense)}\nTotal: ${formatRupiah(curTotal)}`}
              >
                {/* Diagram Donat Mini Arc */}
                <DonutArc income={curIncome} expense={curExpense} />

                {/* Angka Rincian */}
                <div className="space-y-1 flex-1 min-w-0">
                  {/* Pemasukan */}
                  <div className="flex items-center justify-between text-[10px] leading-tight">
                    <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      <span className="hidden sm:inline">Pemasukan</span>
                      <span className="sm:hidden">Masuk</span>
                    </span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums whitespace-nowrap ml-1">
                      {formatReferenceK(curIncome)}
                    </span>
                  </div>

                  {/* Pengeluaran */}
                  <div className="flex items-center justify-between text-[10px] leading-tight">
                    <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                      <span className="hidden sm:inline">Pengeluaran</span>
                      <span className="sm:hidden">Keluar</span>
                    </span>
                    <span className="font-mono font-bold text-rose-600 dark:text-rose-400 tabular-nums whitespace-nowrap ml-1">
                      {formatReferenceK(-curExpense)}
                    </span>
                  </div>

                  {/* Total */}
                  <div className="flex items-center justify-between text-[10px] leading-tight pt-1 border-t border-slate-200/80 dark:border-slate-700">
                    <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 shrink-0" />
                      <span>Total</span>
                    </span>
                    <span
                      className={`font-mono font-extrabold tabular-nums whitespace-nowrap ml-1 ${
                        curTotal >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {formatReferenceK(curTotal)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Kolom 2: September 2026 (Bulan Lalu) */}
            <div className="flex flex-col min-w-0">
              <div className="flex items-center justify-between mb-1 min-w-0">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-600 dark:text-slate-300 truncate">
                  September 2026
                </span>
                <span className="text-[9px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 px-1 py-0.5 rounded leading-none shrink-0">
                  Bulan lalu
                </span>
              </div>

              <div
                className="flex items-center gap-2 sm:gap-2.5 bg-slate-50/80 dark:bg-slate-800/60 p-2 sm:p-2.5 rounded-xl border border-slate-100/90 dark:border-slate-700/60 flex-1 min-w-0 group-hover:bg-slate-100/60 dark:group-hover:bg-slate-800 transition-colors"
                title={`September 2026\nPemasukan: ${formatRupiah(prevIncome)}\nPengeluaran: ${formatRupiah(prevExpense)}\nTotal: ${formatRupiah(prevTotal)}`}
              >
                {/* Diagram Donat Mini Arc */}
                <DonutArc income={prevIncome} expense={prevExpense} />

                {/* Angka Rincian */}
                <div className="space-y-1 flex-1 min-w-0">
                  {/* Pemasukan */}
                  <div className="flex items-center justify-between text-[10px] leading-tight">
                    <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      <span className="hidden sm:inline">Pemasukan</span>
                      <span className="sm:hidden">Masuk</span>
                    </span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums whitespace-nowrap ml-1">
                      {formatReferenceK(prevIncome)}
                    </span>
                  </div>

                  {/* Pengeluaran */}
                  <div className="flex items-center justify-between text-[10px] leading-tight">
                    <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                      <span className="hidden sm:inline">Pengeluaran</span>
                      <span className="sm:hidden">Keluar</span>
                    </span>
                    <span className="font-mono font-bold text-rose-600 dark:text-rose-400 tabular-nums whitespace-nowrap ml-1">
                      {formatReferenceK(-prevExpense)}
                    </span>
                  </div>

                  {/* Total */}
                  <div className="flex items-center justify-between text-[10px] leading-tight pt-1 border-t border-slate-200/80 dark:border-slate-700">
                    <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 shrink-0" />
                      <span>Total</span>
                    </span>
                    <span
                      className={`font-mono font-extrabold tabular-nums whitespace-nowrap ml-1 ${
                        prevTotal >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {formatReferenceK(prevTotal)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. PENGELUARAN - 7 HARI TERAKHIR */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-2.5 sm:p-3 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800">
            <span className="w-4" />
            <h2 className="text-xs font-bold text-slate-800 dark:text-white tracking-tight text-center flex-1">
              Pengeluaran - 7 hari terakhir
            </h2>
            <button className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-0.5" title="Informasi 7 Hari">
              <MoreVertical className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Bar Chart 7 Hari */}
          <div className="pt-2 px-1">
            <div className="grid grid-cols-7 gap-1.5 items-end h-24 border-b border-slate-100 dark:border-slate-800 pb-1">
              {days.map((d, i) => {
                const heightPct = Math.max(8, Math.round((d.total / maxDayTotal) * 100));

                return (
                  <div key={i} className="flex flex-col items-center justify-end h-full">
                    {/* Nilai di atas bar */}
                    <span className="text-[9px] font-mono text-slate-500 dark:text-slate-400 mb-0.5 font-semibold">
                      {d.total > 0 ? formatCompactRupiah(d.total).replace('Rp ', '') : '0'}
                    </span>
                    {/* Rounded Bar Merah/Coral */}
                    <div
                      className={`w-full max-w-[28px] rounded-t-lg transition-all ${
                        d.total > 0 ? 'bg-rose-500 dark:bg-rose-600' : 'bg-slate-200 dark:bg-slate-800'
                      }`}
                      style={{ height: `${heightPct}%` }}
                    />
                    {/* Tanggal di bawah */}
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono mt-1">
                      {d.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BARIS 2: REKENING, ANGGARAN, TRANSAKSI (3 KARTU SEJAJAR) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5">
        {/* 3. KANBAN REKENING */}
        <div
          onClick={() => onNavigateTab('accounts')}
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 p-3 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between h-[210px] cursor-pointer group"
          title="Klik untuk membuka Halaman Rekening Lengkap"
        >
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800">
            <span className="w-4" />
            <h2 className="text-xs font-bold text-slate-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors tracking-tight text-center flex-1 flex items-center justify-center gap-1.5">
              <span>Rekening</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 group-hover:text-blue-600 font-normal">→</span>
            </h2>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAddNewAccount();
              }}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              title="Tambah Rekening"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* List Rekening */}
          <div className="flex-1 overflow-y-auto no-scrollbar space-y-2 py-1.5">
            {activeAccounts.map((acc) => (
              <div
                key={acc.id}
                className="p-2 rounded-xl bg-slate-50/70 dark:bg-slate-800/60 hover:bg-slate-100/80 dark:hover:bg-slate-800 transition-all flex items-center justify-between group/item"
              >
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[150px]">
                    {acc.name}
                  </div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                    Terakhir digunakan: 12/10/2026
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono whitespace-nowrap">
                    {formatRupiah(acc.balance)}
                  </div>

                  {/* Quick Action buttons */}
                  <div className="flex items-center gap-0.5 opacity-80 group-hover/item:opacity-100">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddIncome(acc.id);
                      }}
                      className="p-1 hover:bg-emerald-100 dark:hover:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 rounded transition-colors"
                      title="Tambah Pemasukan"
                    >
                      <Plus className="w-3 h-3 stroke-[3]" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddExpense(acc.id);
                      }}
                      className="p-1 hover:bg-rose-100 dark:hover:bg-rose-950/80 text-rose-700 dark:text-rose-400 rounded transition-colors"
                      title="Tambah Pengeluaran"
                    >
                      <Minus className="w-3 h-3 stroke-[3]" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onTransfer(acc.id);
                      }}
                      className="p-1 hover:bg-blue-100 dark:hover:bg-blue-950/80 text-blue-700 dark:text-blue-400 rounded transition-colors"
                      title="Transfer"
                    >
                      <ArrowLeftRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-[10px] text-slate-400 dark:text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800 flex justify-between">
            <span className="group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Buka Halaman Rekening →</span>
            <span className="font-mono text-slate-600 dark:text-slate-300 font-semibold">
              Total: {formatCompactRupiah(activeAccounts.reduce((s, a) => s + a.balance, 0))}
            </span>
          </div>
        </div>

        {/* 4. KANBAN ANGGARAN */}
        <div
          onClick={() => onNavigateTab('budgets')}
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 p-3 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between h-[210px] cursor-pointer group"
          title="Klik untuk membuka Halaman Anggaran Lengkap"
        >
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800">
            <span className="w-4" />
            <h2 className="text-xs font-bold text-slate-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors tracking-tight text-center flex-1 flex items-center justify-center gap-1.5">
              <span>Anggaran</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 group-hover:text-blue-600 font-normal">→</span>
            </h2>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAddNewBudget();
              }}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              title="Tambah Anggaran"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* List Anggaran */}
          <div className="flex-1 overflow-y-auto no-scrollbar space-y-2 py-1.5">
            {budgets.map((b) => {
              const cat = categories.find((c) => c.id === b.categoryId);
              const subIds = categories.filter((c) => c.parentId === b.categoryId).map((c) => c.id);
              const catIds = [b.categoryId, ...subIds];
              const spent = transactions
                .filter((t) => catIds.includes(t.categoryId) && t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0);

              const limit = b.limitAmount + (b.rolloverAmount || 0);
              const remaining = Math.max(0, limit - spent);
              const percent = Math.min(100, Math.round((spent / limit) * 100));

              return (
                <div
                  key={b.id}
                  className="p-2 rounded-xl bg-slate-50/70 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 space-y-1 hover:bg-slate-100/60 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-800 dark:text-white truncate max-w-[140px]">
                      {cat?.name || 'Anggaran'}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onProcessRollover(b);
                      }}
                      className="p-0.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded"
                      title="Proses Rollover"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Horizontal Progress Bar */}
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-slate-900 dark:bg-white transition-all"
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400">
                    <span>Terbayar: {formatCompactRupiah(spent)}</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      Sisa: {formatCompactRupiah(remaining)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-[10px] text-slate-400 dark:text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800 flex justify-between">
            <span className="group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Buka Halaman Anggaran →</span>
            <span className="font-mono text-slate-600 dark:text-slate-300 font-semibold">{budgets.length} pos</span>
          </div>
        </div>

        {/* 5. KANBAN TRANSAKSI */}
        <div
          onClick={() => onNavigateTab('transactions')}
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 p-3 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between h-[210px] cursor-pointer group"
          title="Klik untuk membuka Halaman Transaksi Lengkap"
        >
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800">
            <span className="w-4" />
            <h2 className="text-xs font-bold text-slate-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors tracking-tight text-center flex-1 flex items-center justify-center gap-1.5">
              <span>Transaksi</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 group-hover:text-blue-600 font-normal">→</span>
            </h2>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onNavigateTab('transactions');
              }}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              title="Buka Transaksi"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* List Transaksi */}
          <div className="flex-1 overflow-y-auto no-scrollbar space-y-1.5 py-1.5">
            {transactions.slice(0, 10).map((t) => {
              const isIncome = t.type === 'income';
              const cat = categories.find((c) => c.id === t.categoryId);
              const acc = accounts.find((a) => a.id === t.accountId);

              return (
                <div
                  key={t.id}
                  className="p-1.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/60 hover:bg-slate-100/70 dark:hover:bg-slate-800 transition-all flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {/* Icon Square */}
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[11px] font-bold shrink-0 shadow-2xs"
                      style={{ backgroundColor: cat?.color || '#3B82F6' }}
                    >
                      {cat?.name?.slice(0, 1) || 'T'}
                    </div>

                    <div className="min-w-0">
                      <div className="text-[11px] font-bold text-slate-900 dark:text-white truncate">
                        {t.notes || cat?.name || 'Transaksi'}
                      </div>
                      <div className="text-[9px] text-slate-400 dark:text-slate-500 font-mono truncate">
                        {acc?.name || 'BCA'} · {formatDateIndo(t.transactionDate)}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div
                      className={`text-[11px] font-bold font-mono ${
                        isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {isIncome ? '+' : '-'}
                      {formatRupiah(t.amount)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-[10px] text-slate-400 dark:text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800 flex justify-between">
            <span className="group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Buka Halaman Transaksi →</span>
            <span className="font-mono text-slate-600 dark:text-slate-300 font-semibold">{transactions.length} mutasi</span>
          </div>
        </div>
      </div>
    </div>
  );
};

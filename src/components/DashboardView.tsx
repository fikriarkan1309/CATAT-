import React, { useState, useRef, useEffect } from 'react';
import {
  MoreVertical,
  Plus,
  Minus,
  ArrowLeftRight,
  TrendingUp,
  Smartphone,
  CreditCard,
  Wallet,
  PiggyBank,
  CheckCircle2,
  Building2,
} from 'lucide-react';
import {
  Account,
  Budget,
  Category,
  Transaction,
  SharedGoal,
  RecurringBill,
  DebtItem,
} from '../types/finance';
import { formatRupiah, formatDateIndo } from '../lib/formatters';
import { AppNavTab } from './BottomNav';

interface DashboardViewProps {
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  goals: SharedGoal[];
  bills: RecurringBill[];
  debts: DebtItem[];
  onNavigateTab: (tab: AppNavTab) => void;
  onAddIncome: (accountId?: string) => void;
  onAddExpense: (accountId?: string) => void;
  onTransfer: (sourceAccountId?: string) => void;
  onEditAccount?: (account: Account) => void;
  onAddNewAccount: () => void;
}

// Compact helper for bar chart tops (e.g. 0, 121Rb, 211Rb, 360Rb)
const formatBarAmount = (amt: number): string => {
  if (amt <= 0) return '0';
  if (amt >= 1000000) {
    const jt = amt / 1000000;
    return `${jt.toFixed(jt % 1 === 0 ? 0 : 1).replace('.', ',')}Jt`;
  }
  if (amt >= 1000) {
    return `${Math.round(amt / 1000)}Rb`;
  }
  return amt.toString();
};

// Format compact 'k' notation exactly matching reference screenshot (e.g. 2.425k, -1.822k, 602,700k)
const formatReferenceK = (amount: number): string => {
  if (amount === 0) return '0';
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

// Compact target representation (e.g. 5.3Jt, 300Rb)
const formatShortTarget = (amount: number): string => {
  if (amount >= 1000000) {
    const jt = amount / 1000000;
    return `${jt.toFixed(jt % 1 === 0 ? 0 : 1).replace('.', ',')}Jt`;
  }
  if (amount >= 1000) {
    return `${Math.round(amount / 1000)}Rb`;
  }
  return `Rp ${amount.toLocaleString('id-ID')}`;
};

// Helper to calculate a harmonious gradient strictly adhering to account's theme color
const getAccountGradientStyle = (hexColor?: string, type?: string): React.CSSProperties => {
  const fallbackColor = hexColor || (
    type === 'bank' ? '#2563EB' :
    type === 'ewallet' ? '#06B6D4' :
    type === 'cash' ? '#10B981' :
    '#8B5CF6'
  );

  const normalized = fallbackColor.toLowerCase().trim();
  const knownGradients: Record<string, string> = {
    // Blue / Bank BCA & Mandiri
    '#2563eb': 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
    '#0284c7': 'linear-gradient(135deg, #38BDF8 0%, #0284C7 100%)',
    '#0369a1': 'linear-gradient(135deg, #0284C7 0%, #075985 100%)',
    // Cyan / E-Wallet GoPay, OVO, Dana
    '#06b6d4': 'linear-gradient(135deg, #22D3EE 0%, #0891B2 100%)',
    '#0891b2': 'linear-gradient(135deg, #06B6D4 0%, #0E7490 100%)',
    // Green / Emerald / Dompet Tunai Ayah
    '#10b981': 'linear-gradient(135deg, #34D399 0%, #059669 100%)',
    '#059669': 'linear-gradient(135deg, #10B981 0%, #047857 100%)',
    '#22c55e': 'linear-gradient(135deg, #4ADE80 0%, #16A34A 100%)',
    '#16a34a': 'linear-gradient(135deg, #22C55E 0%, #15803D 100%)',
    // Amber / Orange / Dompet Tunai Ibu
    '#f59e0b': 'linear-gradient(135deg, #FBBF24 0%, #D97706 100%)',
    '#d97706': 'linear-gradient(135deg, #F59E0B 0%, #B45309 100%)',
    '#f97316': 'linear-gradient(135deg, #FB923C 0%, #EA580C 100%)',
    '#ea580c': 'linear-gradient(135deg, #F97316 0%, #C2410C 100%)',
    // Purple / Violet / Investasi Bibit
    '#8b5cf6': 'linear-gradient(135deg, #A78BFA 0%, #6D28D9 100%)',
    '#7c3aed': 'linear-gradient(135deg, #8B5CF6 0%, #5B21B6 100%)',
    '#a855f7': 'linear-gradient(135deg, #C084FC 0%, #7E22CE 100%)',
    // Red / Rose
    '#dc2626': 'linear-gradient(135deg, #F87171 0%, #B91C1C 100%)',
    '#ef4444': 'linear-gradient(135deg, #F87171 0%, #DC2626 100%)',
    '#f43f5e': 'linear-gradient(135deg, #FB7185 0%, #E11D48 100%)',
    // Pink
    '#ec4899': 'linear-gradient(135deg, #F472B6 0%, #DB2777 100%)',
    // Teal
    '#14b8a6': 'linear-gradient(135deg, #2DD4BF 0%, #0F766E 100%)',
    // Slate
    '#475569': 'linear-gradient(135deg, #64748B 0%, #334155 100%)',
    '#64748b': 'linear-gradient(135deg, #94A3B8 0%, #475569 100%)',
    // Indigo
    '#6366f1': 'linear-gradient(135deg, #818CF8 0%, #4338CA 100%)',
  };

  if (knownGradients[normalized]) {
    return { background: knownGradients[normalized] };
  }

  // Dynamic procedural gradient for any custom user hex color:
  try {
    const cleanHex = fallbackColor.replace('#', '');
    const num = parseInt(cleanHex.length === 3 ? cleanHex.split('').map(c => c + c).join('') : cleanHex, 16);
    if (!isNaN(num)) {
      const r = (num >> 16) & 255;
      const g = (num >> 8) & 255;
      const b = num & 255;
      // Slightly brighter start (+22%)
      const r1 = Math.min(255, Math.round(r + (255 - r) * 0.22));
      const g1 = Math.min(255, Math.round(g + (255 - g) * 0.22));
      const b1 = Math.min(255, Math.round(b + (255 - b) * 0.22));
      // Slightly deeper end (-20%)
      const r2 = Math.max(0, Math.round(r * 0.8));
      const g2 = Math.max(0, Math.round(g * 0.8));
      const b2 = Math.max(0, Math.round(b * 0.8));
      return {
        background: `linear-gradient(135deg, rgb(${r1}, ${g1}, ${b1}) 0%, rgb(${r2}, ${g2}, ${b2}) 100%)`,
      };
    }
  } catch {
    // fallback
  }

  return { background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)' };
};

// Mini Circular Donut Arc matching reference image
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
        <circle
          cx="18"
          cy="18"
          r={radius}
          fill="none"
          stroke="currentColor"
          className="text-slate-100 dark:text-slate-800"
          strokeWidth="4"
        />
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
      <div className="absolute w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 pointer-events-none" />
    </div>
  );
};

// Helper for initial avatar letters and colors
const getAvatarStyle = (text: string, index: number) => {
  const colors = [
    'bg-[#84CC16]', // Lime green like "G"
    'bg-[#86EFAC] text-emerald-900', // Light green like "L"
    'bg-[#6366F1]', // Indigo like "D"
    'bg-[#EC4899]', // Pink
    'bg-[#06B6D4]', // Cyan
    'bg-[#F59E0B]', // Amber
  ];
  const char = (text || 'T').trim().charAt(0).toUpperCase();
  const colorClass = colors[index % colors.length];
  return { char, colorClass };
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  accounts,
  categories,
  transactions,
  budgets,
  goals,
  bills,
  debts,
  onNavigateTab,
  onAddIncome,
  onAddExpense,
  onTransfer,
  onAddNewAccount,
}) => {
  // Accounts carousel pagination state
  const [activeAccountIndex, setActiveAccountIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  const activeAccounts = accounts.filter((a) => !a.isArchived);

  const handleCarouselScroll = () => {
    if (!carouselRef.current) return;
    const { scrollLeft, clientWidth } = carouselRef.current;
    const cardWidth = 240 + 12; // width + gap
    const index = Math.round(scrollLeft / cardWidth);
    setActiveAccountIndex(Math.min(Math.max(0, index), Math.max(0, activeAccounts.length - 1)));
  };

  // 1. Calculations for Ringkasan (Bulan Ini vs Bulan Lalu)
  // Exclude transfer transactions from income and expense calculations
  const now = new Date();
  const curMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const curMonthName = now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
  const prevMonthName = prevDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  const currentMonthTxns = transactions.filter(
    (t) => t.transactionDate.startsWith(curMonthKey) && t.type !== 'transfer'
  );
  const lastMonthTxns = transactions.filter(
    (t) => t.transactionDate.startsWith(prevMonthKey) && t.type !== 'transfer'
  );

  const curIncome = currentMonthTxns
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const curExpense = currentMonthTxns
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  const curTotal = curIncome - curExpense;

  const prevIncome = lastMonthTxns
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const prevExpense = lastMonthTxns
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  const prevTotal = prevIncome - prevExpense;

  // 2. Calculations for Pengeluaran 7 Hari Terakhir
  const todayDate = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(todayDate);
    d.setDate(todayDate.getDate() - (6 - i));
    const dateString = d.toISOString().split('T')[0];
    const label = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
    const dayTransactions = transactions.filter((t) => {
      if (t.type !== 'expense') return false;
      const tDate = t.transactionDate.split('T')[0];
      return tDate === dateString;
    });
    const total = dayTransactions.reduce((acc, t) => acc + t.amount, 0);
    return { label, total, dateString };
  });

  const maxExpenseDay = Math.max(...days.map((d) => d.total), 300000);

  // 3. Recent Transactions (Top 4 latest)
  const recentTxns = transactions.slice(0, 4);

  // Category map
  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const accountMap = new Map(accounts.map((a) => [a.id, a]));

  return (
    <div className="w-full max-w-lg mx-auto sm:max-w-xl md:max-w-2xl px-3 sm:px-4 py-2 pb-24 space-y-4 animate-in fade-in bg-white dark:bg-slate-950">
      {/* ========================================================================= */}
      {/* CARD 1: RINGKASAN (HARUS SELALU ADA) */}
      {/* ========================================================================= */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-sky-100 dark:border-slate-800 overflow-hidden">
        {/* Banner Header Sky Blue */}
        <div
          onClick={() => onNavigateTab('summary')}
          className="bg-gradient-to-r from-sky-400 via-sky-400 to-sky-500 text-white px-4 py-2 flex items-center justify-between cursor-pointer select-none"
        >
          <span className="w-4" />
          <h2 className="text-sm font-bold tracking-tight text-white">Ringkasan</h2>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNavigateTab('summary');
            }}
            className="text-white/90 hover:text-white p-0.5"
            title="Buka Ringkasan Lengkap"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>

        {/* Content: 2 Kolom (Bulan ini vs Bulan lalu) */}
        <div className="p-3 sm:p-4">
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {/* Kolom Kiri: Bulan ini */}
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate capitalize">
                  {curMonthName}
                </span>
                <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/60 px-1.5 py-0.5 rounded leading-none shrink-0">
                  Bulan ini
                </span>
              </div>

              <div className="flex items-center gap-2 sm:gap-2.5">
                <DonutArc income={curIncome} expense={curExpense} />
                <div className="space-y-0.5 flex-1 min-w-0 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      <span>Masuk</span>
                    </span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {formatReferenceK(curIncome)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                      <span>Keluar</span>
                    </span>
                    <span className="font-mono font-bold text-rose-500 dark:text-rose-400 tabular-nums">
                      {formatReferenceK(-curExpense)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-0.5 border-t border-slate-100 dark:border-slate-800">
                    <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 shrink-0" />
                      <span>Total</span>
                    </span>
                    <span
                      className={`font-mono font-bold tabular-nums ${
                        curTotal >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'
                      }`}
                    >
                      {formatReferenceK(curTotal)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Kolom Kanan: Bulan lalu */}
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 truncate capitalize">
                  {prevMonthName}
                </span>
                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 px-1.5 py-0.5 rounded leading-none shrink-0">
                  Bulan lalu
                </span>
              </div>

              <div className="flex items-center gap-2 sm:gap-2.5">
                <DonutArc income={prevIncome} expense={prevExpense} />
                <div className="space-y-0.5 flex-1 min-w-0 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      <span>Masuk</span>
                    </span>
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300 tabular-nums">
                      {formatReferenceK(prevIncome)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                      <span>Keluar</span>
                    </span>
                    <span className="font-mono font-bold text-rose-500 dark:text-rose-400 tabular-nums">
                      {formatReferenceK(-prevExpense)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-0.5 border-t border-slate-100 dark:border-slate-800">
                    <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 shrink-0" />
                      <span>Total</span>
                    </span>
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300 tabular-nums">
                      {formatReferenceK(prevTotal)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* CARD 2: PENGELUARAN - 7 HARI TERAKHIR (HARUS SELALU ADA) */}
      {/* ========================================================================= */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-sky-100 dark:border-slate-800 overflow-hidden">
        <div className="bg-gradient-to-r from-sky-400 via-sky-400 to-sky-500 text-white px-4 py-2 flex items-center justify-between select-none">
          <span className="w-4" />
          <h2 className="text-sm font-bold tracking-tight text-white">Pengeluaran - 7 hari terakhir</h2>
          <MoreVertical className="w-4 h-4 text-white/90" />
        </div>

        <div className="p-3 sm:p-4 pt-4 sm:pt-6">
          <div className="flex items-end justify-between gap-1.5 sm:gap-2 h-36">
            {days.map((day, idx) => {
              const heightPercent =
                day.total > 0
                  ? Math.max(16, Math.min(100, Math.round((day.total / maxExpenseDay) * 100)))
                  : 4;

              return (
                <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full group">
                  {/* Amount label on top of bar */}
                  <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 tabular-nums mb-1 leading-none">
                    {formatBarAmount(day.total)}
                  </span>

                  {/* Vertical Capsule Bar */}
                  <div className="w-full max-w-[28px] sm:max-w-[34px] flex items-end justify-center h-24">
                    {day.total > 0 ? (
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className="w-full bg-[#F43F5E] rounded-md transition-all duration-300 shadow-xs group-hover:bg-[#E11D48]"
                      />
                    ) : (
                      <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-md" />
                    )}
                  </div>

                  {/* Date label dd/mm */}
                  <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 dark:text-slate-500 mt-2">
                    {day.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* CARD 3: REKENING CAROUSEL (DITAMPILKAN JIKA ADA REKENING) */}
      {/* ========================================================================= */}
      {activeAccounts.length > 0 && (
        <section className="space-y-2">
          {/* Scrollable Container with horizontal scroll */}
          <div
            ref={carouselRef}
            onScroll={handleCarouselScroll}
            className="flex items-stretch gap-3 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory px-0.5 pb-1"
          >
            {activeAccounts.map((acc) => {
              // Pick icon based on account type matching Rekening menu
              const isBank = acc.type === 'bank';
              const isEwallet = acc.type === 'ewallet';
              const isCash = acc.type === 'cash';

              return (
                <div
                  key={acc.id}
                  style={getAccountGradientStyle(acc.color, acc.type)}
                  className="min-w-[220px] sm:min-w-[250px] max-w-[260px] rounded-2xl p-4 text-white shadow-md flex flex-col justify-between snap-start shrink-0 select-none transition-transform hover:scale-[1.01]"
                >
                  {/* Top: Icon + Name */}
                  <div className="flex items-center gap-2 mb-2">
                    {isBank ? (
                      <Building2 className="w-5 h-5 stroke-[2.5]" />
                    ) : isEwallet ? (
                      <Smartphone className="w-5 h-5 stroke-[2.5]" />
                    ) : isCash ? (
                      <Wallet className="w-5 h-5 stroke-[2.5]" />
                    ) : (
                      <TrendingUp className="w-5 h-5 stroke-[2.5]" />
                    )}
                    <span className="font-extrabold text-sm sm:text-base tracking-tight leading-tight line-clamp-1">
                      {acc.name}
                    </span>
                  </div>

                  {/* Middle: Large Balance */}
                  <div className="my-2">
                    <span className="text-xl sm:text-2xl font-black tracking-tight font-sans">
                      Rp{acc.balance.toLocaleString('id-ID')}
                    </span>
                  </div>

                  {/* Bottom: Type Label on Left, Quick Action Buttons on Right */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs font-semibold text-white/90 capitalize">
                      {acc.type === 'investment'
                        ? 'Investasi'
                        : acc.type === 'ewallet'
                        ? 'E-Wallet'
                        : acc.type === 'bank'
                        ? 'Bank'
                        : 'Tunai'}
                    </span>

                    {/* Quick Action Pill with +, -, and Transfer (⇄) */}
                    <div className="flex items-center gap-1.5 bg-white rounded-full px-2.5 py-1 shadow-xs">
                      {/* (+) Pemasukan */}
                      <button
                        type="button"
                        onClick={() => onAddIncome(acc.id)}
                        className="text-emerald-500 hover:text-emerald-600 active:scale-90 transition-transform font-black"
                        title={`Catat Pemasukan ke ${acc.name}`}
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[3]" />
                      </button>

                      {/* (-) Pengeluaran */}
                      <button
                        type="button"
                        onClick={() => onAddExpense(acc.id)}
                        className="text-rose-500 hover:text-rose-600 active:scale-90 transition-transform font-black"
                        title={`Catat Pengeluaran dari ${acc.name}`}
                      >
                        <Minus className="w-3.5 h-3.5 stroke-[3]" />
                      </button>

                      {/* (⇄) Transfer */}
                      <button
                        type="button"
                        onClick={() => onTransfer(acc.id)}
                        className="text-sky-500 hover:text-sky-600 active:scale-90 transition-transform font-bold"
                        title={`Transfer dari ${acc.name}`}
                      >
                        <ArrowLeftRight className="w-3.5 h-3.5 stroke-[2.5]" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination dots */}
          {activeAccounts.length > 1 && (
            <div className="flex items-center justify-center gap-1.5 pt-1">
              {activeAccounts.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setActiveAccountIndex(i);
                    if (carouselRef.current) {
                      carouselRef.current.scrollTo({
                        left: i * 252,
                        behavior: 'smooth',
                      });
                    }
                  }}
                  className={`h-2 rounded-full transition-all ${
                    activeAccountIndex === i
                      ? 'w-7 bg-sky-400'
                      : 'w-2 bg-slate-300 dark:bg-slate-700'
                  }`}
                  aria-label={`Lihat rekening ${i + 1}`}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* ========================================================================= */}
      {/* CARD 4: TRANSAKSI (DITAMPILKAN JIKA ADA DATA TRANSAKSI) */}
      {/* ========================================================================= */}
      {transactions.length > 0 && (
        <section className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-sky-100 dark:border-slate-800 overflow-hidden">
          <div
            onClick={() => onNavigateTab('transactions')}
            className="bg-gradient-to-r from-sky-400 via-sky-400 to-sky-500 text-white px-4 py-2 flex items-center justify-between cursor-pointer select-none"
          >
            <span className="w-4" />
            <h2 className="text-sm font-bold tracking-tight text-white">Transaksi</h2>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onNavigateTab('transactions');
              }}
              className="text-white/90 hover:text-white p-0.5"
              title="Buka Semua Transaksi"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>

          <div className="p-3 divide-y divide-slate-100 dark:divide-slate-800">
            {recentTxns.map((t, idx) => {
              const acc = accountMap.get(t.accountId);
              const isIncome = t.type === 'income';
              const isTransfer = t.type === 'transfer';
              const toAcc = t.targetAccountId ? accountMap.get(t.targetAccountId) : undefined;

              // Display label
              let title = t.notes || (t.categoryId ? categoryMap.get(t.categoryId)?.name : undefined) || 'Transaksi';
              if (isTransfer) {
                title = 'Transfer Antar Rekening';
              }

              const { char, colorClass } = getAvatarStyle(title || 'T', idx);
              const formattedDate = t.transactionDate ? formatDateIndo(t.transactionDate) : '';

              return (
                <div
                  key={t.id}
                  onClick={() => onNavigateTab('transactions')}
                  className="py-2.5 first:pt-0.5 last:pb-0.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-xl px-1.5 transition-colors"
                >
                  {/* Left: Avatar Letter Badge */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl ${colorClass} text-white font-extrabold flex items-center justify-center shrink-0 text-sm shadow-xs`}
                    >
                      {char}
                    </div>

                    {/* Middle: Title & Account + Date */}
                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                        {title}
                      </h4>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                        {acc?.name || 'Rekening'}
                        {isTransfer && toAcc ? ` → ${toAcc.name}` : ''} · {formattedDate}
                      </p>
                    </div>
                  </div>

                  {/* Right: Amount */}
                  <div className="text-right shrink-0">
                    <span
                      className={`font-bold text-xs sm:text-sm font-mono tabular-nums ${
                        isIncome
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : isTransfer
                          ? 'text-sky-600 dark:text-sky-400'
                          : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {isIncome ? `+Rp ${t.amount.toLocaleString('id-ID')}` : `-Rp ${t.amount.toLocaleString('id-ID')}`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* CARD 5: TARGET TABUNGAN (DITAMPILKAN JIKA ADA GOALS) */}
      {/* ========================================================================= */}
      {goals.length > 0 && (
        <section className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-sky-100 dark:border-slate-800 overflow-hidden">
          <div
            onClick={() => onNavigateTab('savings')}
            className="bg-gradient-to-r from-sky-400 via-sky-400 to-sky-500 text-white px-4 py-2 flex items-center justify-between cursor-pointer select-none"
          >
            <span className="w-4" />
            <h2 className="text-sm font-bold tracking-tight text-white">Target Tabungan</h2>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onNavigateTab('savings');
              }}
              className="text-white/90 hover:text-white p-0.5"
              title="Buka Target Tabungan"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>

          <div className="p-3 sm:p-4 space-y-3.5 divide-y divide-slate-100 dark:divide-slate-800">
            {goals.slice(0, 3).map((g) => {
              const pct = Math.min(100, Math.round((g.currentAmount / (g.targetAmount || 1)) * 100));

              return (
                <div key={g.id} className="pt-2 first:pt-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                      {g.name}
                    </span>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      {pct}%
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${Math.max(2, pct)}%` }}
                      className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                    />
                  </div>

                  {/* Bottom: Terkumpul vs Target */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
                    <span>Terkumpul: Rp {g.currentAmount.toLocaleString('id-ID')}</span>
                    <span>Target: {formatShortTarget(g.targetAmount)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* CARD 6: TAGIHAN RUTIN (DITAMPILKAN JIKA ADA BILLS) */}
      {/* ========================================================================= */}
      {bills.length > 0 && (
        <section className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-sky-100 dark:border-slate-800 overflow-hidden">
          <div
            onClick={() => onNavigateTab('bills')}
            className="bg-gradient-to-r from-sky-400 via-sky-400 to-sky-500 text-white px-4 py-2 flex items-center justify-between cursor-pointer select-none"
          >
            <span className="w-4" />
            <h2 className="text-sm font-bold tracking-tight text-white">Tagihan Rutin</h2>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onNavigateTab('bills');
              }}
              className="text-white/90 hover:text-white p-0.5"
              title="Buka Tagihan Rutin"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>

          <div className="p-3 divide-y divide-slate-100 dark:divide-slate-800">
            {bills.slice(0, 3).map((bill) => (
              <div
                key={bill.id}
                onClick={() => onNavigateTab('bills')}
                className="py-2.5 first:pt-0.5 last:pb-0.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-xl px-1 transition-colors"
              >
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
                    {bill.name}
                  </h4>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                    Jatuh tempo tgl {bill.dueDay}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-xs sm:text-sm text-rose-600 dark:text-rose-400 font-mono">
                    Rp {bill.amount.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* CARD 7: HUTANG & PIUTANG (DITAMPILKAN JIKA ADA DEBTS) */}
      {/* ========================================================================= */}
      {debts.length > 0 && (
        <section className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-sky-100 dark:border-slate-800 overflow-hidden">
          <div
            onClick={() => onNavigateTab('debts')}
            className="bg-gradient-to-r from-sky-400 via-sky-400 to-sky-500 text-white px-4 py-2 flex items-center justify-between cursor-pointer select-none"
          >
            <span className="w-4" />
            <h2 className="text-sm font-bold tracking-tight text-white">Hutang & Piutang</h2>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onNavigateTab('debts');
              }}
              className="text-white/90 hover:text-white p-0.5"
              title="Buka Hutang & Piutang"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>

          <div className="p-3 divide-y divide-slate-100 dark:divide-slate-800">
            {debts.slice(0, 3).map((item) => {
              const isHutang = item.type === 'debt';
              const remaining = item.totalAmount - (item.paidAmount || 0);

              return (
                <div
                  key={item.id}
                  onClick={() => onNavigateTab('debts')}
                  className="py-2.5 first:pt-0.5 last:pb-0.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-xl px-1 transition-colors"
                >
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
                      {item.personName}
                    </h4>
                    <p
                      className={`text-[11px] font-semibold mt-0.5 ${
                        isHutang ? 'text-rose-500' : 'text-emerald-600'
                      }`}
                    >
                      {isHutang ? 'Hutang' : 'Piutang'} · {item.status === 'settled' ? 'Lunas' : 'Aktif'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white font-mono block">
                      Rp {remaining.toLocaleString('id-ID')}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      dari {formatShortTarget(item.totalAmount)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* If no accounts exist yet, show a welcoming CTA */}
      {activeAccounts.length === 0 && (
        <div className="p-6 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-sky-200 dark:border-slate-800">
          <p className="text-xs text-slate-500 mb-3">Belum ada rekening aktif untuk mulai mencatat.</p>
          <button
            type="button"
            onClick={onAddNewAccount}
            className="px-4 py-2 bg-sky-500 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-sky-600 active:scale-95 transition-all"
          >
            + Tambah Rekening Pertama
          </button>
        </div>
      )}
    </div>
  );
};

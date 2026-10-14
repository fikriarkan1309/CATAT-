import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  X,
  Layers,
} from 'lucide-react';
import { Account, Category, Transaction } from '../types/finance';
import { formatRupiah, formatDateIndo, formatRupiahDetailed } from '../lib/formatters';

interface MonthlyAnalysisViewProps {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
}

interface MonthSummaryData {
  key: string;
  label: string;
  income: number;
  expense: number;
  total: number;
}

const BASELINE_MONTHS: MonthSummaryData[] = [
  { key: '2026-10', label: 'Oktober 2026', income: 1880000, expense: 1693000, total: 187000 },
  { key: '2026-09', label: 'September 2026', income: 7478000, expense: 11154000, total: -3676000 },
  { key: '2026-08', label: 'Agustus 2026', income: 6115000, expense: 3534000, total: 2581000 },
  { key: '2026-07', label: 'Juli 2026', income: 6300000, expense: 6357000, total: -57000 },
  { key: '2026-06', label: 'Juni 2026', income: 5502500, expense: 5042500, total: 460000 },
  { key: '2026-05', label: 'Mei 2026', income: 3715000, expense: 6643000, total: -2928000 },
  { key: '2026-04', label: 'April 2026', income: 7365000, expense: 5288000, total: 2077000 },
];

const BASELINE_OCT_EXPENSE_BREAKDOWN = [
  { name: 'Berbelanja', percentage: 44, amount: 744000, color: '#EF4444' },
  { name: 'Makanan/Minuman', percentage: 23, amount: 388000, color: '#0EA5E9' },
  { name: 'Lain (Pengeluaran)', percentage: 20, amount: 331000, color: '#10B981' },
  { name: 'Transportasi', percentage: 8, amount: 137000, color: '#F59E0B' },
  { name: 'Keluarga', percentage: 5, amount: 93000, color: '#EAB308' },
];

const BASELINE_OCT_INCOME_BREAKDOWN = [
  { name: 'Pemasukan', percentage: 100, amount: 1880000, color: '#10B981' },
];

const MiniListDonut: React.FC<{ income: number; expense: number }> = ({ income, expense }) => {
  const total = income + expense;
  const incomeRatio = total > 0 ? income / total : 0.5;
  const expenseRatio = total > 0 ? expense / total : 0.5;

  const r = 16;
  const circumference = 2 * Math.PI * r;

  const gap = total > 0 ? 4 : 0;
  const incomeStroke = Math.max(4, incomeRatio * circumference - gap);
  const expenseStroke = Math.max(4, expenseRatio * circumference - gap);

  return (
    <div className="relative w-12 h-12 sm:w-14 sm:h-14 shrink-0 flex items-center justify-center">
      <svg className="w-12 h-12 sm:w-14 sm:h-14 -rotate-90" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r={r} fill="none" stroke="currentColor" className="text-slate-100 dark:text-slate-800" strokeWidth="5.5" />
        <circle
          cx="20"
          cy="20"
          r={r}
          fill="none"
          stroke="#10B981"
          strokeWidth="5.5"
          strokeDasharray={`${incomeStroke} ${circumference - incomeStroke}`}
          strokeDashoffset="0"
          strokeLinecap="round"
        />
        <circle
          cx="20"
          cy="20"
          r={r}
          fill="none"
          stroke="#EF4444"
          strokeWidth="5.5"
          strokeDasharray={`${expenseStroke} ${circumference - expenseStroke}`}
          strokeDashoffset={`${-(incomeStroke + gap)}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600 pointer-events-none" />
    </div>
  );
};

export const MonthlyAnalysisView: React.FC<MonthlyAnalysisViewProps> = ({
  transactions,
  categories,
  accounts,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'compare'>('overview');
  const [subView, setSubView] = useState<'list' | 'detail'>('list');
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>('2026-10');
  const [selectedFlowType, setSelectedFlowType] = useState<'expense' | 'income'>('expense');
  const [isChoiceModalOpen, setIsChoiceModalOpen] = useState(false);
  const [targetMonthForChoice, setTargetMonthForChoice] = useState<MonthSummaryData>(BASELINE_MONTHS[0]);
  const [hoveredSlice, setHoveredSlice] = useState<number | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');

  const [compType1, setCompType1] = useState<'expense' | 'income'>('expense');
  const [compAccount1, setCompAccount1] = useState('all');
  const [compFrom1, setCompFrom1] = useState('2026-10-01');
  const [compTo1, setCompTo1] = useState('2026-10-31');

  const [compType2, setCompType2] = useState<'expense' | 'income'>('expense');
  const [compAccount2, setCompAccount2] = useState('all');
  const [compFrom2, setCompFrom2] = useState('2026-09-01');
  const [compTo2, setCompTo2] = useState('2026-09-30');

  const dynamicMonthsMap = React.useMemo(() => {
    const map = new Map<string, { income: number; expense: number; transactions: Transaction[] }>();

    transactions.forEach((t) => {
      const ym = t.transactionDate.slice(0, 7);
      if (!map.has(ym)) {
        map.set(ym, { income: 0, expense: 0, transactions: [] });
      }
      const item = map.get(ym)!;
      item.transactions.push(t);
      if (t.type === 'income') item.income += t.amount;
      if (t.type === 'expense') item.expense += t.amount;
    });

    return map;
  }, [transactions]);

  const mergedMonthsList = React.useMemo(() => {
    const list: MonthSummaryData[] = [];
    const monthsIndo = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
    ];

    BASELINE_MONTHS.forEach((bm) => {
      const userDyn = dynamicMonthsMap.get(bm.key);
      if (userDyn) {
        list.push({
          key: bm.key,
          label: bm.label,
          income: userDyn.income,
          expense: userDyn.expense,
          total: userDyn.income - userDyn.expense,
        });
      } else {
        list.push(bm);
      }
    });

    dynamicMonthsMap.forEach((val, ym) => {
      if (!BASELINE_MONTHS.some((bm) => bm.key === ym)) {
        const [year, month] = ym.split('-');
        const monthName = monthsIndo[parseInt(month, 10) - 1] || month;
        list.push({
          key: ym,
          label: `${monthName} ${year}`,
          income: val.income,
          expense: val.expense,
          total: val.income - val.expense,
        });
      }
    });

    return list.sort((a, b) => b.key.localeCompare(a.key));
  }, [dynamicMonthsMap]);

  const currentMonthIdx = mergedMonthsList.findIndex((m) => m.key === selectedMonthKey);
  const currentMonthData = mergedMonthsList[currentMonthIdx] || mergedMonthsList[0] || BASELINE_MONTHS[0];

  const handleMonthClick = (m: MonthSummaryData) => {
    setTargetMonthForChoice(m);
    setIsChoiceModalOpen(true);
  };

  const handleSelectFlowFromModal = (type: 'expense' | 'income') => {
    setSelectedMonthKey(targetMonthForChoice.key);
    setSelectedFlowType(type);
    setIsChoiceModalOpen(false);
    setSubView('detail');
  };

  const handlePrevMonth = () => {
    if (currentMonthIdx < mergedMonthsList.length - 1) {
      setSelectedMonthKey(mergedMonthsList[currentMonthIdx + 1].key);
    }
  };

  const handleNextMonth = () => {
    if (currentMonthIdx > 0) {
      setSelectedMonthKey(mergedMonthsList[currentMonthIdx - 1].key);
    }
  };

  const getCategoryBreakdown = () => {
    const isOct = selectedMonthKey === '2026-10';
    const total = selectedFlowType === 'income' ? currentMonthData.income : currentMonthData.expense;

    const userBucket = dynamicMonthsMap.get(selectedMonthKey);
    const txns = userBucket ? userBucket.transactions : [];

    if (txns.length === 0) {
      if (isOct) {
        return selectedFlowType === 'income' ? BASELINE_OCT_INCOME_BREAKDOWN : BASELINE_OCT_EXPENSE_BREAKDOWN;
      } else {
        const targetTotal = selectedFlowType === 'income' ? currentMonthData.income : currentMonthData.expense;
        if (selectedFlowType === 'income') {
          return [{ name: 'Gaji & Pendapatan', percentage: 100, amount: targetTotal, color: '#10B981' }];
        }
        return [
          { name: 'Kebutuhan Pokok & Dapur', percentage: 50, amount: Math.round(targetTotal * 0.5), color: '#EF4444' },
          { name: 'Pendidikan & Edukasi', percentage: 25, amount: Math.round(targetTotal * 0.25), color: '#0EA5E9' },
          { name: 'Operasional & Transport', percentage: 15, amount: Math.round(targetTotal * 0.15), color: '#F59E0B' },
          { name: 'Lain-lain', percentage: 10, amount: Math.round(targetTotal * 0.1), color: '#10B981' },
        ];
      }
    }

    const parentCats = categories.filter((c) => !c.parentId && c.type === selectedFlowType);
    const result = parentCats
      .map((p) => {
        const subIds = categories.filter((c) => c.parentId === p.id).map((c) => c.id);
        const allIds = [p.id, ...subIds];
        const sum = txns.filter((t) => allIds.includes(t.categoryId)).reduce((s, t) => s + t.amount, 0);
        const percentage = total > 0 ? Math.round((sum / total) * 100) : 0;
        return {
          name: p.name,
          percentage,
          amount: sum,
          color: p.color || '#3B82F6',
        };
      })
      .filter((b) => b.amount > 0)
      .sort((a, b) => b.amount - a.amount);

    return result.length > 0
      ? result
      : [{ name: selectedFlowType === 'income' ? 'Pemasukan' : 'Pengeluaran', percentage: 100, amount: total, color: selectedFlowType === 'income' ? '#10B981' : '#EF4444' }];
  };

  const breakdownData = getCategoryBreakdown();
  const detailTotalAmount = breakdownData.reduce((s, d) => s + d.amount, 0);

  const getFilteredTotal = (
    flowType: 'expense' | 'income',
    accId: string,
    fromStr: string,
    toStr: string
  ) => {
    const fromTime = new Date(fromStr).getTime();
    const toTime = new Date(toStr + 'T23:59:59').getTime();

    const filtered = transactions.filter((t) => {
      if (t.type !== flowType) return false;
      if (accId !== 'all' && t.accountId !== accId) return false;
      const tTime = new Date(t.transactionDate).getTime();
      return tTime >= fromTime && tTime <= toTime;
    });

    const sum = filtered.reduce((acc, t) => acc + t.amount, 0);
    return { sum, count: filtered.length, transactions: filtered };
  };

  const resPeriod1 = getFilteredTotal(compType1, compAccount1, compFrom1, compTo1);
  const resPeriod2 = getFilteredTotal(compType2, compAccount2, compFrom2, compTo2);

  const diffAmount = resPeriod1.sum - resPeriod2.sum;
  const diffPercent =
    resPeriod2.sum > 0 ? Math.round(((resPeriod1.sum - resPeriod2.sum) / resPeriod2.sum) * 100) : 0;

  const filteredMonthsList = mergedMonthsList.filter((m) =>
    m.label.toLowerCase().includes(searchKeyword.toLowerCase())
  );

  const [selectedCategoryForTxnModal, setSelectedCategoryForTxnModal] = useState<{
    name: string;
    percentage: number;
    amount: number;
    color: string;
  } | null>(null);

  const getTransactionsForCategoryModal = (catName: string) => {
    const userBucket = dynamicMonthsMap.get(selectedMonthKey);
    const realTxns = (userBucket?.transactions || []).filter((t) => {
      if (t.type !== selectedFlowType) return false;
      const cat = categories.find((c) => c.id === t.categoryId);
      const parent = cat?.parentId ? categories.find((c) => c.id === cat.parentId) : null;
      return cat?.name === catName || parent?.name === catName;
    });

    if (realTxns.length > 0) {
      return realTxns.map((t) => {
        const acc = accounts.find((a) => a.id === t.accountId);
        return {
          id: t.id,
          date: formatDateIndo(t.transactionDate),
          title: t.notes || catName,
          accountName: acc?.name || 'BCA Utama',
          amount: t.amount,
        };
      });
    }

    if (catName === 'Berbelanja') {
      return [
        { id: 'bb-1', date: '08 Okt 2026', title: 'Superindo BSD - Belanja Sayur & Daging', accountName: 'BCA Utama', amount: 450000 },
        { id: 'bb-2', date: '05 Okt 2026', title: 'Tokopedia - Baju & Perlengkapan Rumah', accountName: 'BCA Utama', amount: 294000 },
      ];
    }
    if (catName === 'Makanan/Minuman') {
      return [
        { id: 'mm-1', date: '07 Okt 2026', title: 'Kopi Kenangan & Sarapan Pagi', accountName: 'GoPay Keluarga', amount: 88000 },
        { id: 'mm-2', date: '04 Okt 2026', title: 'Makan Malam Seafood Keluarga', accountName: 'BCA Utama', amount: 300000 },
      ];
    }
    if (catName === 'Transportasi') {
      return [
        { id: 'tp-1', date: '06 Okt 2026', title: 'Bensin Pertamax Shell BSD', accountName: 'BCA Utama', amount: 137000 },
      ];
    }

    return [
      { id: 'gen-1', date: '03 Okt 2026', title: `${catName} Transaksi Pokok`, accountName: 'BCA Utama', amount: Math.round(selectedCategoryForTxnModal?.amount || 150000) },
    ];
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto w-full overflow-hidden">
      {/* 0. TAB UTAMA: RINGKASAN BULANAN VS PERBANDINGAN */}
      <div className="flex items-center justify-between">
        <div className="inline-flex p-1 bg-slate-200/80 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-inner">
          <button
            type="button"
            onClick={() => {
              setActiveTab('overview');
              setSubView('list');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'overview'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Ringkasan Bulanan
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('compare')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'compare'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Perbandingan
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. TAMPILAN GAMBAR 1: DAFTAR BULAN */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && subView === 'list' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
          {/* Sub Header dengan Search */}
          <div className="p-3 sm:p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari bulan (misal: Oktober, September)..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
            </div>

            <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
              {filteredMonthsList.length} bulan tercatat
            </div>
          </div>

          {/* List of Months */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredMonthsList.map((m) => (
              <div
                key={m.key}
                onClick={() => handleMonthClick(m)}
                className="p-3.5 sm:p-4 hover:bg-slate-50/90 dark:hover:bg-slate-800/60 transition-all cursor-pointer group flex flex-col justify-between"
                title={`Klik untuk membuka pilihan Pemasukan atau Pengeluaran bulan ${m.label}`}
              >
                {/* Month Title */}
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {m.label}
                  </h3>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 font-medium flex items-center gap-1">
                    <span>Pilih Rincian</span>
                    <span>→</span>
                  </span>
                </div>

                {/* Content: Left Donut Arc & Right Exact Format */}
                <div className="flex items-center gap-3 sm:gap-4">
                  <MiniListDonut income={m.income} expense={m.expense} />

                  <div className="flex-1 space-y-0.5 text-xs sm:text-[13px] font-mono">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 dark:text-slate-400 font-sans text-xs">Pemasukan:</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold tabular-nums">
                        {formatRupiahDetailed(m.income)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 dark:text-slate-400 font-sans text-xs">Pengeluaran:</span>
                      <span className="text-rose-600 dark:text-rose-400 font-bold tabular-nums">
                        {formatRupiahDetailed(-m.expense)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-0.5 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-slate-800 dark:text-slate-200 font-sans font-bold text-xs">Total:</span>
                      <span
                        className={`font-bold tabular-nums ${
                          m.total >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {formatRupiahDetailed(m.total)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* POP-UP PILIHAN: PEMASUKAN ATAU PENGELUARAN */}
      {isChoiceModalOpen && (
        <div
          onClick={() => setIsChoiceModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs animate-in fade-in overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-2xl space-y-3.5 animate-in zoom-in-95"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  {targetMonthForChoice.label}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  Pilih jenis yang ingin ditampilkan:
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsChoiceModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2 pt-0.5">
              <button
                type="button"
                onClick={() => handleSelectFlowFromModal('income')}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 hover:bg-emerald-100/80 dark:hover:bg-emerald-900/50 text-left transition-all flex items-center justify-between group shadow-2xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                    <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-emerald-950 dark:text-emerald-100">
                    Pemasukan
                  </span>
                </div>
                <span className="text-xs sm:text-sm font-extrabold font-mono text-emerald-700 dark:text-emerald-300">
                  {formatRupiahDetailed(targetMonthForChoice.income)}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectFlowFromModal('expense')}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-rose-500 bg-rose-50/70 dark:bg-rose-950/40 hover:bg-rose-100/80 dark:hover:bg-rose-900/50 text-left transition-all flex items-center justify-between group shadow-2xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                    <ArrowDownRight className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-rose-950 dark:text-rose-100">
                    Pengeluaran
                  </span>
                </div>
                <span className="text-xs sm:text-sm font-extrabold font-mono text-rose-700 dark:text-rose-300">
                  {formatRupiahDetailed(-targetMonthForChoice.expense)}
                </span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsChoiceModalOpen(false)}
              className="w-full py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. TAMPILAN DETAIL: PEMASUKAN & PENGELUARAN */}
      {activeTab === 'overview' && subView === 'detail' && (
        <div className="space-y-3">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-2.5 sm:p-3 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <button
                type="button"
                onClick={handlePrevMonth}
                disabled={currentMonthIdx >= mergedMonthsList.length - 1}
                className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 flex items-center justify-center text-slate-700 dark:text-slate-200 transition-colors"
                title="Bulan Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white font-mono tracking-tight min-w-[140px] text-center">
                {currentMonthData.label}
              </span>

              <button
                type="button"
                onClick={handleNextMonth}
                disabled={currentMonthIdx <= 0}
                className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 flex items-center justify-center text-slate-700 dark:text-slate-200 transition-colors"
                title="Bulan Berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex p-0.5 bg-slate-100 dark:bg-slate-800 rounded-xl self-center sm:self-auto">
              <button
                type="button"
                onClick={() => setSelectedFlowType('expense')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  selectedFlowType === 'expense'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Pengeluaran
              </button>
              <button
                type="button"
                onClick={() => setSelectedFlowType('income')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  selectedFlowType === 'income'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Pemasukan
              </button>
            </div>
          </div>

          {/* DIAGRAM DONAT BESAR */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-2xs flex flex-col items-center justify-center relative overflow-hidden">
            <div className="relative w-64 h-64 sm:w-72 sm:h-72 my-2 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" className="text-slate-100 dark:text-slate-800" strokeWidth="18" />

                {(() => {
                  const r = 35;
                  const c = 2 * Math.PI * r;
                  let accumulatedPercent = 0;

                  return breakdownData.map((slice, idx) => {
                    const strokeLen = (slice.percentage / 100) * c;
                    const strokeOffset = -(accumulatedPercent / 100) * c;
                    accumulatedPercent += slice.percentage;

                    const isHovered = hoveredSlice === idx;

                    return (
                      <circle
                        key={slice.name}
                        cx="50"
                        cy="50"
                        r={r}
                        fill="none"
                        stroke={slice.color}
                        strokeWidth={isHovered ? 21 : 18}
                        strokeDasharray={`${strokeLen} ${c - strokeLen}`}
                        strokeDashoffset={strokeOffset}
                        className="transition-all duration-200 cursor-pointer"
                        onMouseEnter={() => setHoveredSlice(idx)}
                        onMouseLeave={() => setHoveredSlice(null)}
                      />
                    );
                  });
                })()}

                <circle cx="50" cy="50" r="23" fill="#1E293B" />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2 pointer-events-none text-white">
                {hoveredSlice !== null && breakdownData[hoveredSlice] ? (
                  <>
                    <span className="text-[10px] sm:text-xs text-slate-300 font-bold truncate max-w-[120px]">
                      {breakdownData[hoveredSlice].name}
                    </span>
                    <span className="text-xs sm:text-sm font-black font-mono mt-0.5">
                      {formatRupiah(breakdownData[hoveredSlice].amount)}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono font-bold">
                      {breakdownData[hoveredSlice].percentage}%
                    </span>
                  </>
                ) : selectedFlowType === 'income' ? (
                  <>
                    <span className="text-[11px] text-slate-300 font-bold">
                      Pemasukan
                    </span>
                    <span className="text-xs sm:text-sm font-extrabold font-mono mt-0.5">
                      {formatRupiahDetailed(detailTotalAmount)}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono font-bold mt-0.5">
                      100,00%
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-[10px] sm:text-[11px] text-slate-300 font-bold">
                      Pengeluaran
                    </span>
                    <span className="text-xs sm:text-sm font-extrabold font-mono mt-0.5">
                      {formatRupiahDetailed(detailTotalAmount)}
                    </span>
                    <span className="text-[10px] text-rose-300 font-mono font-bold mt-0.5">
                      {breakdownData.length} Kategori
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-1">
              Sentuh atau arahkan kursor ke segmen donat untuk melihat rincian
            </div>
          </div>

          {/* KARTU 2: RINCIAN KATEGORI */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 p-3 sm:p-4 shadow-2xs space-y-1.5">
            <div className="space-y-1">
              {breakdownData.map((item, idx) => {
                const isHovered = hoveredSlice === idx;

                return (
                  <div
                    key={item.name}
                    onClick={() => setSelectedCategoryForTxnModal(item)}
                    onMouseEnter={() => setHoveredSlice(idx)}
                    onMouseLeave={() => setHoveredSlice(null)}
                    className={`py-2 px-2.5 sm:px-3 rounded-xl transition-all flex items-center justify-between cursor-pointer border border-transparent group ${
                      isHovered
                        ? 'bg-slate-100/90 dark:bg-slate-800 border-slate-200/80 dark:border-slate-700 scale-[1.005]'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                    title="Klik untuk melihat rincian mutasi transaksi"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-md shrink-0 shadow-2xs group-hover:scale-110 transition-transform"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                        {item.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 font-mono text-right">
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold min-w-[36px]">
                        {item.percentage}%
                      </span>
                      <span
                        className={`text-xs sm:text-sm font-bold tabular-nums min-w-[120px] ${
                          selectedFlowType === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {formatRupiahDetailed(selectedFlowType === 'expense' ? -item.amount : item.amount)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between font-mono">
              <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white font-sans">
                Total:
              </span>
              <span
                className={`text-sm sm:text-base font-extrabold tabular-nums ${
                  selectedFlowType === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {formatRupiahDetailed(detailTotalAmount)}
              </span>
            </div>
          </div>

          {/* Modal Rincian Transaksi per Kategori */}
          {selectedCategoryForTxnModal && (
            <div
              onClick={() => setSelectedCategoryForTxnModal(null)}
              className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs animate-in fade-in overflow-y-auto"
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xl space-y-4 animate-in zoom-in-95 max-h-[85vh] flex flex-col"
              >
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-5 h-5 rounded-md shrink-0 shadow-2xs"
                      style={{ backgroundColor: selectedCategoryForTxnModal.color }}
                    />
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                        {selectedCategoryForTxnModal.name}
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        {currentMonthData.label} · {selectedFlowType === 'expense' ? 'Pengeluaran' : 'Pemasukan'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedCategoryForTxnModal(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block">Total Kategori</span>
                    <span
                      className={`text-base font-extrabold font-mono tabular-nums ${
                        selectedFlowType === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {formatRupiahDetailed(
                        selectedFlowType === 'expense'
                          ? -selectedCategoryForTxnModal.amount
                          : selectedCategoryForTxnModal.amount
                      )}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block">Porsi Anggaran</span>
                    <span className="text-xs font-bold font-mono text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-2 py-0.5 rounded-lg">
                      {selectedCategoryForTxnModal.percentage}%
                    </span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-0.5 max-h-[50vh]">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                    Daftar Mutasi Transaksi
                  </span>
                  {getTransactionsForCategoryModal(selectedCategoryForTxnModal.name).map((txn) => (
                    <div
                      key={txn.id}
                      className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600 hover:bg-slate-50/70 dark:hover:bg-slate-800/80 transition-all flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {txn.title}
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                          {txn.date} · {txn.accountName}
                        </div>
                      </div>
                      <div
                        className={`text-xs font-extrabold font-mono tabular-nums whitespace-nowrap ${
                          selectedFlowType === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {selectedFlowType === 'income' ? '+' : '-'}
                        {formatRupiah(txn.amount)}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedCategoryForTxnModal(null)}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  Tutup Rincian
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PERBANDINGAN */}
      {/* ========================================================================= */}
      {activeTab === 'compare' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-2xs space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Filter 1 */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <span className="text-xs font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wider block">
                Periode A (Pembanding 1)
              </span>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Tipe Aliran Dana</label>
                <select
                  value={compType1}
                  onChange={(e) => setCompType1(e.target.value as any)}
                  className="w-full mt-1 p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="expense">Pengeluaran</option>
                  <option value="income">Pemasukan</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Rekening</label>
                <select
                  value={compAccount1}
                  onChange={(e) => setCompAccount1(e.target.value)}
                  className="w-full mt-1 p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="all">Semua Rekening</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Dari Tanggal</label>
                  <input
                    type="date"
                    value={compFrom1}
                    onChange={(e) => setCompFrom1(e.target.value)}
                    className="w-full mt-1 p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Ke Tanggal</label>
                  <input
                    type="date"
                    value={compTo1}
                    onChange={(e) => setCompTo1(e.target.value)}
                    className="w-full mt-1 p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                <div className="text-[11px] text-slate-500 dark:text-slate-400">Hasil Periode A:</div>
                <div className="text-xl font-extrabold text-slate-900 dark:text-white font-mono mt-0.5">
                  {formatRupiah(resPeriod1.sum)}
                </div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                  {resPeriod1.count} transaksi ditemukan
                </div>
              </div>
            </div>

            {/* Filter 2 */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <span className="text-xs font-bold text-purple-900 dark:text-purple-300 uppercase tracking-wider block">
                Periode B (Pembanding 2)
              </span>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Tipe Aliran Dana</label>
                <select
                  value={compType2}
                  onChange={(e) => setCompType2(e.target.value as any)}
                  className="w-full mt-1 p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="expense">Pengeluaran</option>
                  <option value="income">Pemasukan</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Rekening</label>
                <select
                  value={compAccount2}
                  onChange={(e) => setCompAccount2(e.target.value)}
                  className="w-full mt-1 p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="all">Semua Rekening</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Dari Tanggal</label>
                  <input
                    type="date"
                    value={compFrom2}
                    onChange={(e) => setCompFrom2(e.target.value)}
                    className="w-full mt-1 p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Ke Tanggal</label>
                  <input
                    type="date"
                    value={compTo2}
                    onChange={(e) => setCompTo2(e.target.value)}
                    className="w-full mt-1 p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                <div className="text-[11px] text-slate-500 dark:text-slate-400">Hasil Periode B:</div>
                <div className="text-xl font-extrabold text-slate-900 dark:text-white font-mono mt-0.5">
                  {formatRupiah(resPeriod2.sum)}
                </div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                  {resPeriod2.count} transaksi ditemukan
                </div>
              </div>
            </div>
          </div>

          {/* Comparison Delta KPI Box */}
          <div className="p-5 rounded-2xl bg-slate-900 dark:bg-slate-800 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-transparent dark:border-slate-700">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Analisis Selisih (Periode A vs Periode B)
              </span>
              <div className="text-2xl font-black font-mono mt-1">
                {diffAmount >= 0 ? '+' : ''}
                {formatRupiah(diffAmount)}
              </div>
              <p className="text-xs text-slate-300 mt-1">
                {diffAmount > 0
                  ? `Periode A lebih tinggi ${Math.abs(diffPercent)}% dibandingkan Periode B.`
                  : diffAmount < 0
                  ? `Periode A lebih hemat ${Math.abs(diffPercent)}% dibandingkan Periode B.`
                  : 'Kedua periode memiliki nominal yang sama persis.'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/10 rounded-xl text-center">
                <div className="text-xs text-slate-300">Selisih Persen</div>
                <div className="text-lg font-bold font-mono">
                  {diffPercent >= 0 ? `+${diffPercent}%` : `${diffPercent}%`}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

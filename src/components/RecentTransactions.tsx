import React, { useState, useMemo } from 'react';
import {
  Trash2,
  Edit2,
  ArrowLeftRight,
  MoreVertical,
  Calendar,
  Home,
  ShoppingBag,
  Zap,
  GraduationCap,
  BookOpen,
  Baby,
  Car,
  Fuel,
  Coffee,
  Utensils,
  HeartPulse,
  Briefcase,
  TrendingUp,
  Landmark,
  Film,
  Plane,
  Gift,
  Shield,
  Smartphone,
  Tag,
  Receipt,
  X,
} from 'lucide-react';
import { Account, Category, Transaction } from '../types/finance';
import { formatRupiah, formatDateIndo } from '../lib/formatters';
import { AppIcon } from './AppIcon';

interface RecentTransactionsProps {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  onDeleteTransaction: (id: string) => void;
  onUpdateTransaction: (id: string, updates: Partial<Transaction>) => void;
  onQuickAdd: () => void;
  onOpenSettings?: () => void;
  onLogoClick?: () => void;
}

export const RecentTransactions: React.FC<RecentTransactionsProps> = ({
  transactions,
  accounts,
  categories,
  onDeleteTransaction,
  onUpdateTransaction,
  onOpenSettings,
  onLogoClick,
}) => {
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [selectedTransactionForDetail, setSelectedTransactionForDetail] = useState<Transaction | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [editAmountStr, setEditAmountStr] = useState('');
  const [editAccountId, setEditAccountId] = useState('');

  // Selected Month filter: 'all' or 'YYYY-MM'
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>('all');

  // Icon mapping helper
  const getCategoryIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Home':
        return <Home className="w-5 h-5" />;
      case 'ShoppingBag':
        return <ShoppingBag className="w-5 h-5" />;
      case 'Zap':
        return <Zap className="w-5 h-5" />;
      case 'GraduationCap':
        return <GraduationCap className="w-5 h-5" />;
      case 'BookOpen':
        return <BookOpen className="w-5 h-5" />;
      case 'Baby':
        return <Baby className="w-5 h-5" />;
      case 'Car':
        return <Car className="w-5 h-5" />;
      case 'Fuel':
        return <Fuel className="w-5 h-5" />;
      case 'Coffee':
        return <Coffee className="w-5 h-5" />;
      case 'Utensils':
        return <Utensils className="w-5 h-5" />;
      case 'HeartPulse':
        return <HeartPulse className="w-5 h-5" />;
      case 'Briefcase':
        return <Briefcase className="w-5 h-5" />;
      case 'TrendingUp':
        return <TrendingUp className="w-5 h-5" />;
      case 'Landmark':
        return <Landmark className="w-5 h-5" />;
      case 'Film':
        return <Film className="w-5 h-5" />;
      case 'Plane':
        return <Plane className="w-5 h-5" />;
      case 'Gift':
        return <Gift className="w-5 h-5" />;
      case 'Shield':
        return <Shield className="w-5 h-5" />;
      case 'Smartphone':
        return <Smartphone className="w-5 h-5" />;
      case 'Tag':
        return <Tag className="w-5 h-5" />;
      default:
        return <Receipt className="w-5 h-5" />;
    }
  };

  const getAccountName = (accId?: string) => {
    if (!accId) return '-';
    return accounts.find((a) => a.id === accId)?.name || 'Rekening';
  };

  const getCategory = (catId?: string) => {
    return categories.find((c) => c.id === catId);
  };

  // Month pills options (recent 3 months + current)
  const monthPills = useMemo(() => {
    const monthsMap = new Map<string, string>();
    const monthsIndo = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    // Build last 3 months up to current date
    const now = new Date();
    for (let i = 2; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const key = `${y}-${m}`;
      const label = monthsIndo[d.getMonth()];
      monthsMap.set(key, label);
    }

    // Include any extra month present in transactions
    transactions.forEach((tx) => {
      const d = new Date(tx.transactionDate);
      if (!isNaN(d.getTime())) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const key = `${y}-${m}`;
        if (!monthsMap.has(key)) {
          monthsMap.set(key, monthsIndo[d.getMonth()]);
        }
      }
    });

    return Array.from(monthsMap.entries()).map(([key, label]) => ({ key, label }));
  }, [transactions]);

  // Filtered transactions by selected month
  const filteredTransactions = useMemo(() => {
    if (selectedMonthKey === 'all') return transactions;
    return transactions.filter((tx) => {
      const d = new Date(tx.transactionDate);
      if (isNaN(d.getTime())) return false;
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      return `${y}-${m}` === selectedMonthKey;
    });
  }, [transactions, selectedMonthKey]);

  // Summary calculations for filtered transactions
  const { displayIncomeTotal, displayExpenseTotal } = useMemo(() => {
    let income = 0;
    let expense = 0;
    filteredTransactions.forEach((t) => {
      if (t.type === 'income') income += t.amount;
      if (t.type === 'expense') expense += t.amount;
    });
    return { displayIncomeTotal: income, displayExpenseTotal: expense };
  }, [filteredTransactions]);

  // Group transactions by day (YYYY-MM-DD)
  const groupedTransactions = useMemo(() => {
    const sorted = [...filteredTransactions].sort(
      (a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()
    );

    const groupsMap = new Map<
      string,
      {
        dateKey: string;
        dateObj: Date;
        dayNumber: string;
        dayName: string;
        monthYear: string;
        incomeTotal: number;
        expenseTotal: number;
        items: Transaction[];
      }
    >();

    sorted.forEach((tx) => {
      const d = new Date(tx.transactionDate);
      if (isNaN(d.getTime())) return;

      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dayNum = String(d.getDate()).padStart(2, '0');
      const dateKey = `${y}-${m}-${dayNum}`;

      if (!groupsMap.has(dateKey)) {
        const daysIndo = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const monthsIndo = [
          'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
          'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
        ];

        groupsMap.set(dateKey, {
          dateKey,
          dateObj: d,
          dayNumber: dayNum,
          dayName: daysIndo[d.getDay()],
          monthYear: `${monthsIndo[d.getMonth()]} ${d.getFullYear()}`,
          incomeTotal: 0,
          expenseTotal: 0,
          items: [],
        });
      }

      const g = groupsMap.get(dateKey)!;
      if (tx.type === 'income') g.incomeTotal += tx.amount;
      if (tx.type === 'expense') g.expenseTotal += tx.amount;
      g.items.push(tx);
    });

    return Array.from(groupsMap.values()).sort((a, b) => b.dateKey.localeCompare(a.dateKey));
  }, [filteredTransactions]);

  // Edit Handlers
  const handleStartEdit = (t: Transaction) => {
    setOpenDropdownId(null);
    setEditingTransaction(t);
    setEditNotes(t.notes || '');
    setEditAmountStr(t.amount.toString());
    setEditAccountId(t.accountId);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransaction) return;

    const val = parseFloat(editAmountStr.replace(/[^0-9]/g, ''));
    if (!val || val <= 0) return;

    onUpdateTransaction(editingTransaction.id, {
      amount: val,
      notes: editNotes.trim(),
      accountId: editAccountId,
    });

    setEditingTransaction(null);
    if (selectedTransactionForDetail?.id === editingTransaction.id) {
      setSelectedTransactionForDetail(null);
    }
  };

  return (
    <div className="w-full flex-1 min-h-0 flex flex-col overflow-hidden bg-white dark:bg-slate-950">
      {/* 1. TOP BLUE GRADIENT HERO HEADER (FREEZE - Mockup Transaksi_Baru_cd384683.jpg) */}
      <div
        className="w-full shrink-0 text-white pt-2 sm:pt-3 pb-11 px-4 select-none relative z-10"
        style={{ background: 'linear-gradient(180deg, #0052b4 0%, #0170d5 50%, #2cbdf8 100%)' }}
      >
        <div className="max-w-2xl mx-auto w-full">
          {/* Header Bar: Logo 3.png (Left) & Settings Gear (Right) */}
          <div className="flex items-center justify-between py-1 mb-2">
            <button
              type="button"
              onClick={onLogoClick}
              className="group flex items-center transition-transform active:scale-95 cursor-pointer"
              title="Ke Beranda Catatin!"
            >
              <img
                src="/Logo 3.png"
                alt="Catatin!"
                className="h-8 sm:h-9 w-auto max-w-[160px] object-contain drop-shadow-xs"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.src.includes('%20')) {
                    target.src = '/Logo%203.png';
                  }
                }}
              />
            </button>

            <button
              type="button"
              onClick={onOpenSettings}
              className="p-1 rounded-xl text-white hover:text-white/80 active:scale-90 transition-transform cursor-pointer"
              title="Pengaturan & Akun"
              aria-label="Buka Pengaturan"
            >
              <AppIcon name="settings" className="w-7 h-7 text-white" />
            </button>
          </div>

          {/* Centered Total Pengeluaran */}
          <div className="flex flex-col items-center justify-center text-center pt-1 pb-1">
            <span className="text-xs sm:text-sm font-semibold text-sky-100 tracking-wide">
              Total Pengeluaran
            </span>
            <div className="text-3xl sm:text-4xl font-extrabold text-white font-mono tracking-tight mt-0.5 drop-shadow-xs">
              {formatRupiah(displayExpenseTotal)}
            </div>
          </div>

          {/* White Pill Card: Pemasukan & Selisih */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 shadow-md text-slate-800 dark:text-white flex items-center justify-between mt-2 max-w-md mx-auto w-full border border-white/20">
            <div className="min-w-0">
              <span className="text-[11px] sm:text-xs font-semibold text-emerald-700 dark:text-emerald-400 block truncate">
                Pemasukan
              </span>
              <div className="text-sm sm:text-base font-extrabold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5 truncate">
                {formatRupiah(displayIncomeTotal)}
              </div>
            </div>

            <div className="text-right min-w-0">
              <span className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 block truncate">
                Selisih
              </span>
              <div
                className={`text-sm sm:text-base font-extrabold font-mono mt-0.5 truncate ${
                  displayIncomeTotal - displayExpenseTotal >= 0
                    ? 'text-slate-800 dark:text-slate-200'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {displayIncomeTotal - displayExpenseTotal >= 0 ? '+' : ''}
                {formatRupiah(displayIncomeTotal - displayExpenseTotal)}
              </div>
            </div>
          </div>

          {/* Horizontal Month Selection Pills */}
          <div className="flex items-center justify-center gap-2 mt-3 overflow-x-auto no-scrollbar py-1">
            {monthPills.map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => setSelectedMonthKey(selectedMonthKey === m.key ? 'all' : m.key)}
                className={`px-4 py-1.5 rounded-2xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer ${
                  selectedMonthKey === m.key
                    ? 'bg-white text-[#0052b4] border-2 border-sky-400 shadow-xs'
                    : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-xs'
                }`}
              >
                {m.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setSelectedMonthKey('all')}
              className={`p-2 rounded-2xl transition-all shrink-0 cursor-pointer ${
                selectedMonthKey === 'all'
                  ? 'bg-white text-[#0052b4] border-2 border-sky-400 shadow-xs'
                  : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-xs'
              }`}
              title="Tampilkan Semua Transaksi"
            >
              <Calendar className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. CURVED WHITE BOTTOM SHEET CONTAINER (SCROLLABLE - Mockup Transaksi_Baru_cd384683.jpg) */}
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar pb-28 bg-white dark:bg-slate-950 rounded-t-[32px] sm:rounded-t-[36px] -mt-[32px] sm:-mt-[36px] shadow-[0_-8px_20px_rgba(0,0,0,0.12)] dark:shadow-[0_-8px_20px_rgba(0,0,0,0.35)] relative z-20">
        <div className="max-w-2xl mx-auto w-full px-4 pt-5 space-y-4">
          {groupedTransactions.length === 0 ? (
            <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 p-8 text-center shadow-2xs">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Belum ada transaksi pada periode ini.</p>
            </div>
          ) : (
            groupedTransactions.map((group) => (
              <div key={group.dateKey} className="space-y-1.5">
                {/* Header Tanggal */}
                <div className="flex items-center justify-between px-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black font-mono text-slate-900 dark:text-white">
                      {group.dayNumber}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[11px]">
                      {group.dayName}
                    </span>
                    <span className="text-slate-400 dark:text-slate-500 font-medium text-[11px]">
                      {group.monthYear}
                    </span>
                  </div>

                  {/* Subtotal Hari Ini */}
                  <div className="flex items-center gap-2 font-mono text-[11px] font-bold">
                    {group.incomeTotal > 0 && (
                      <span className="text-emerald-600 dark:text-emerald-400">
                        +{formatRupiah(group.incomeTotal)}
                      </span>
                    )}
                    {group.expenseTotal > 0 && (
                      <span className="text-rose-600 dark:text-rose-400">
                        -{formatRupiah(group.expenseTotal)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Kotakan List Transaksi Hari Ini */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
                  {group.items.map((tx) => {
                    const cat = getCategory(tx.categoryId);
                    const isIncome = tx.type === 'income';
                    const isTransfer = tx.type === 'transfer';
                    const isExpense = tx.type === 'expense';
                    const accountName = getAccountName(tx.accountId);
                    const targetAccountName = isTransfer ? getAccountName(tx.targetAccountId || undefined) : '';

                    const displayName = isTransfer
                      ? 'Transfer Antar Rekening'
                      : (cat?.name || tx.notes || 'Transaksi');
                    const displaySub = isTransfer
                      ? `${accountName} ➔ ${targetAccountName}${tx.notes && tx.notes !== 'Transfer Antar Rekening' ? ` · ${tx.notes}` : ''}`
                      : tx.notes && cat?.name
                      ? `${accountName} · ${tx.notes}`
                      : accountName;

                    return (
                      <div
                        key={tx.id}
                        onClick={() => setSelectedTransactionForDetail(tx)}
                        className={`p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors group cursor-pointer gap-2 ${
                          openDropdownId === tx.id ? 'relative z-40' : ''
                        }`}
                      >
                        {/* Sisi Kiri: Ikon Kategori & Keterangan */}
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div
                            className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-2xs shrink-0 transition-transform group-hover:scale-105"
                            style={{
                              backgroundColor: isTransfer
                                ? '#2563EB'
                                : cat?.color || (isIncome ? '#059669' : '#E11D48'),
                            }}
                          >
                            {isTransfer ? (
                              <ArrowLeftRight className="w-5 h-5 stroke-[2.5]" />
                            ) : (
                              getCategoryIcon(cat?.icon)
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                              {displayName}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                              {displaySub}
                            </div>
                          </div>
                        </div>

                        {/* Sisi Kanan: Nominal & Dropdown Menu Titik Tiga (⋮) */}
                        <div
                          className="flex items-center gap-2 sm:gap-3 shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="text-right">
                            <span
                              className={`text-sm sm:text-base font-extrabold font-mono tabular-nums ${
                                isIncome
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : isTransfer
                                  ? 'text-blue-600 dark:text-blue-400'
                                  : 'text-rose-600 dark:text-rose-400'
                              }`}
                            >
                              {isIncome ? '+' : isExpense ? '-' : ''}
                              {formatRupiah(tx.amount)}
                            </span>
                          </div>

                          {/* Dropdown Menu Titik Tiga (⋮) */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() =>
                                setOpenDropdownId(openDropdownId === tx.id ? null : tx.id)
                              }
                              className="w-8 h-8 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                              title="Opsi Transaksi"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {openDropdownId === tx.id && (
                              <>
                                <div
                                  className="fixed inset-0 z-40"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenDropdownId(null);
                                  }}
                                />
                                <div
                                  className="absolute right-0 top-full mt-1.5 z-50 w-44 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 text-xs animate-in fade-in zoom-in-95 duration-100"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    type="button"
                                    onClick={() => handleStartEdit(tx)}
                                    className="w-full px-3.5 py-2.5 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 font-semibold cursor-pointer"
                                  >
                                    <Edit2 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                                    <span>Edit Transaksi</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenDropdownId(null);
                                      onDeleteTransaction(tx.id);
                                    }}
                                    className="w-full px-3.5 py-2.5 text-left text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2.5 font-semibold cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                    <span>Hapus</span>
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 3. MODAL POPUP DETAIL TRANSAKSI */}
      {selectedTransactionForDetail && (
        <div
          onClick={() => setSelectedTransactionForDetail(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs animate-in fade-in overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header Modal Detail */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-xs shrink-0"
                  style={{
                    backgroundColor:
                      selectedTransactionForDetail.type === 'transfer'
                        ? '#2563EB'
                        : getCategory(selectedTransactionForDetail.categoryId)?.color ||
                          (selectedTransactionForDetail.type === 'income' ? '#059669' : '#E11D48'),
                  }}
                >
                  {selectedTransactionForDetail.type === 'transfer' ? (
                    <ArrowLeftRight className="w-5 h-5 stroke-[2.5]" />
                  ) : (
                    getCategoryIcon(getCategory(selectedTransactionForDetail.categoryId)?.icon)
                  )}
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    {selectedTransactionForDetail.type === 'transfer'
                      ? 'Transfer Antar Rekening'
                      : (getCategory(selectedTransactionForDetail.categoryId)?.name || 'Transaksi')}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    {formatDateIndo(selectedTransactionForDetail.transactionDate)}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedTransactionForDetail(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Konten Detail Nominal & Info */}
            <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-center">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
                {selectedTransactionForDetail.type === 'income'
                  ? 'Nominal Pemasukan'
                  : selectedTransactionForDetail.type === 'transfer'
                  ? 'Nominal Transfer'
                  : 'Nominal Pengeluaran'}
              </span>
              <div
                className={`text-2xl sm:text-3xl font-black font-mono tracking-tight mt-1 ${
                  selectedTransactionForDetail.type === 'income'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : selectedTransactionForDetail.type === 'transfer'
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {selectedTransactionForDetail.type === 'income' ? '+' : selectedTransactionForDetail.type === 'expense' ? '-' : ''}
                {formatRupiah(selectedTransactionForDetail.amount)}
              </div>
            </div>

            <div className="p-4 sm:p-5 space-y-3 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Rekening Asal</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {getAccountName(selectedTransactionForDetail.accountId)}
                </span>
              </div>

              {selectedTransactionForDetail.type === 'transfer' && (
                <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Rekening Tujuan</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {getAccountName(selectedTransactionForDetail.targetAccountId || undefined)}
                  </span>
                </div>
              )}

              {selectedTransactionForDetail.notes && (
                <div className="flex items-start justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Catatan</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 text-right max-w-[200px]">
                    {selectedTransactionForDetail.notes}
                  </span>
                </div>
              )}

              {selectedTransactionForDetail.tags && selectedTransactionForDetail.tags.length > 0 && (
                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Tag</span>
                  <div className="flex gap-1 flex-wrap justify-end">
                    {selectedTransactionForDetail.tags.map((t) => (
                      <span key={t} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md text-[10px] font-semibold">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Modal: Tombol Aksi */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  const tx = selectedTransactionForDetail;
                  setSelectedTransactionForDetail(null);
                  onDeleteTransaction(tx.id);
                }}
                className="py-2 px-3 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const tx = selectedTransactionForDetail;
                    setSelectedTransactionForDetail(null);
                    handleStartEdit(tx);
                  }}
                  className="py-2 px-3 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. MODAL EDIT TRANSAKSI */}
      {editingTransaction && (
        <div
          onClick={() => setEditingTransaction(null)}
          className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95"
          >
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Edit Transaksi</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Perubahan nilai atau rekening otomatis memperbarui saldo rekening terkait.
            </p>

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Nominal (Rp)</label>
                <input
                  type="number"
                  value={editAmountStr}
                  onChange={(e) => setEditAmountStr(e.target.value)}
                  required
                  autoFocus
                  className="w-full mt-1 p-2.5 text-lg font-bold font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Rekening</label>
                <select
                  value={editAccountId}
                  onChange={(e) => setEditAccountId(e.target.value)}
                  className="w-full mt-1 p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({formatRupiah(a.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Catatan</label>
                <input
                  type="text"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Catatan transaksi..."
                  className="w-full mt-1 p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTransaction(null)}
                  className="flex-1 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl shadow-xs cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

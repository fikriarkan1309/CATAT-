import React, { useState, useMemo } from 'react';
import {
  Trash2,
  Edit2,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  MoreVertical,
  Calendar,
  Wallet,
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

interface RecentTransactionsProps {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  onDeleteTransaction: (id: string) => void;
  onUpdateTransaction: (id: string, updates: Partial<Transaction>) => void;
  onQuickAdd: () => void;
}

export const RecentTransactions: React.FC<RecentTransactionsProps> = ({
  transactions,
  accounts,
  categories,
  onDeleteTransaction,
  onUpdateTransaction,
}) => {
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [selectedTransactionForDetail, setSelectedTransactionForDetail] = useState<Transaction | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [editAmountStr, setEditAmountStr] = useState('');
  const [editAccountId, setEditAccountId] = useState('');

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

  // Summary calculations
  const { totalIncome, totalExpense } = useMemo(() => {
    let income = 0;
    let expense = 0;
    transactions.forEach((t) => {
      if (t.type === 'income') income += t.amount;
      if (t.type === 'expense') expense += t.amount;
    });
    return { totalIncome: income, totalExpense: expense };
  }, [transactions]);

  // Group transactions by day (YYYY-MM-DD)
  const groupedTransactions = useMemo(() => {
    const sorted = [...transactions].sort(
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
          'Januari',
          'Februari',
          'Maret',
          'April',
          'Mei',
          'Juni',
          'Juli',
          'Agustus',
          'September',
          'Oktober',
          'November',
          'Desember',
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
  }, [transactions]);

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
    <div className="space-y-4 max-w-4xl mx-auto w-full">
      {/* 1. RINGKASAN TOTAL MUTASI / TRANSAKSI */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          {/* Sisi Kiri: Total Pengeluaran */}
          <div className="min-w-0">
            <span className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 block truncate">
              Total Pengeluaran
            </span>
            <div className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 font-mono tracking-tight mt-0.5 truncate">
              {formatRupiah(totalExpense)}
            </div>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 block truncate">
              {transactions.length} mutasi tercatat
            </span>
          </div>

          {/* Sisi Kanan: Pemasukan & Pengeluaran Bersih */}
          <div className="pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800 sm:border-l sm:pl-6 flex items-center justify-between sm:justify-end gap-5">
            <div className="text-left sm:text-right">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                <span>Pemasukan</span>
              </div>
              <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm sm:text-base mt-0.5">
                {formatRupiah(totalIncome)}
              </div>
            </div>

            <div className="text-right">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium justify-end">
                <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500 shrink-0"></span>
                <span>Selisih</span>
              </div>
              <div
                className={`font-mono font-bold text-sm sm:text-base mt-0.5 ${
                  totalIncome - totalExpense >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {formatRupiah(totalIncome - totalExpense)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. DAFTAR TRANSAKSI DIKELOMPOKKAN PER TANGGAL */}
      {groupedTransactions.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 p-8 text-center shadow-2xs">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Belum ada transaksi tercatat.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedTransactions.map((group, groupIndex) => (
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
              <div
                className={`bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs divide-y divide-slate-100 dark:divide-slate-800 ${
                  group.items.some((item) => item.id === openDropdownId)
                    ? 'relative z-30'
                    : 'relative z-10'
                }`}
              >
                {group.items.map((tx, txIndex) => {
                  const cat = getCategory(tx.categoryId);
                  const isIncome = tx.type === 'income';
                  const isTransfer = tx.type === 'transfer';
                  const isExpense = tx.type === 'expense';
                  const accountName = getAccountName(tx.accountId);
                  const targetAccountName = isTransfer ? getAccountName(tx.targetAccountId || undefined) : '';

                  const displayName = cat?.name || tx.notes || 'Transaksi';
                  const displaySub = isTransfer
                    ? `${accountName} ➔ ${targetAccountName}`
                    : tx.notes && cat?.name
                    ? `${accountName} · ${tx.notes}`
                    : accountName;

                  const isLastItemInAll =
                    groupIndex === groupedTransactions.length - 1 &&
                    txIndex === group.items.length - 1;

                  return (
                    <div
                      key={tx.id}
                      onClick={() => setSelectedTransactionForDetail(tx)}
                      className={`p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors group cursor-pointer gap-2 first:rounded-t-2xl sm:first:rounded-t-3xl last:rounded-b-2xl sm:last:rounded-b-3xl ${
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
                            className="w-8 h-8 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center justify-center transition-colors"
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
                                  className="w-full px-3.5 py-2.5 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 font-semibold"
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
                                  className="w-full px-3.5 py-2.5 text-left text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2.5 font-semibold"
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
          ))}
        </div>
      )}

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
                    {getCategory(selectedTransactionForDetail.categoryId)?.name || 'Transaksi'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    {formatDateIndo(selectedTransactionForDetail.transactionDate)}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedTransactionForDetail(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
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
                className="py-2 px-3 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
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
                  className="py-2 px-3 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
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
                  className="flex-1 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl shadow-xs"
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

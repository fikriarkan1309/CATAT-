import React, { useState } from 'react';
import {
  Building2,
  Wallet,
  Smartphone,
  TrendingUp,
  MoreVertical,
  Plus,
  Minus,
  ArrowLeftRight,
  Edit2,
  Archive,
  Trash2,
  History,
  X,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronDown,
} from 'lucide-react';
import { Account, AccountType, Category, Transaction } from '../types/finance';
import { formatRupiah, formatDateIndo } from '../lib/formatters';

interface AccountCardsProps {
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  onAddIncome: (accountId?: string) => void;
  onAddExpense: (accountId?: string) => void;
  onTransfer: (accountId?: string) => void;
  onEditAccount: (account: Account) => void;
  onToggleArchive: (accountId: string) => void;
  onDeleteAccount: (accountId: string) => void;
  onAddNewAccount: () => void;
}

export const AccountCards: React.FC<AccountCardsProps> = ({
  accounts,
  transactions,
  categories,
  onAddIncome,
  onAddExpense,
  onTransfer,
  onEditAccount,
  onToggleArchive,
  onDeleteAccount,
  onAddNewAccount,
}) => {
  const [selectedAccountForDetail, setSelectedAccountForDetail] = useState<Account | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const activeAccounts = accounts.filter((a) => !a.isArchived);
  const archivedAccounts = accounts.filter((a) => a.isArchived);

  const totalAssets = activeAccounts
    .filter((a) => a.balance >= 0)
    .reduce((sum, a) => sum + a.balance, 0);

  const totalBalance = totalAssets;

  const getAccountIcon = (type: AccountType) => {
    switch (type) {
      case 'bank':
        return <Building2 className="w-5 h-5" />;
      case 'ewallet':
        return <Smartphone className="w-5 h-5" />;
      case 'cash':
        return <Wallet className="w-5 h-5" />;
      default:
        return <TrendingUp className="w-5 h-5" />;
    }
  };

  const getAccountTypeLabel = (type: AccountType) => {
    switch (type) {
      case 'bank':
        return 'Bank';
      case 'ewallet':
        return 'E-Wallet';
      case 'cash':
        return 'Tunai';
      default:
        return 'Lainnya';
    }
  };

  const getCategoryName = (catId: string) => {
    const cat = categories.find((c) => c.id === catId);
    return cat ? cat.name : 'Umum';
  };

  const getCategoryColor = (catId: string) => {
    const cat = categories.find((c) => c.id === catId);
    return cat ? cat.color : '#64748B';
  };

  // Mutasi akun terpilih
  const accountTransactions = selectedAccountForDetail
    ? transactions
        .filter(
          (t) =>
            t.accountId === selectedAccountForDetail.id ||
            t.targetAccountId === selectedAccountForDetail.id
        )
        .sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime())
    : [];

  return (
    <div className="space-y-4 max-w-4xl mx-auto w-full overflow-hidden">
      {/* 2. CARD TOTAL SALDO & ASET */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          {/* Sisi Kiri: Total & Nominal Utama */}
          <div className="min-w-0">
            <span className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 block truncate">
              Total
            </span>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight mt-0.5 truncate">
              {formatRupiah(totalBalance)}
            </div>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 block truncate">
              {activeAccounts.length} rekening terdaftar
            </span>
          </div>

          {/* Sisi Kanan: Hanya Aset */}
          <div className="pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800 sm:border-l sm:pl-6 flex items-center justify-between sm:justify-end gap-3 min-w-[150px]">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
              <span>Aset</span>
            </div>
            <span className="font-mono font-bold text-slate-900 dark:text-white text-sm sm:text-base">
              {formatRupiah(totalAssets)}
            </span>
          </div>
        </div>
      </div>

      {/* 3. DAFTAR REKENING VERTIKAL */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
        {activeAccounts.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-3">
              Belum ada rekening aktif.
            </p>
            <button
              type="button"
              onClick={onAddNewAccount}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Tambah Rekening Baru</span>
            </button>
          </div>
        ) : (
          <>
            {activeAccounts.map((acc) => (
              <div
                key={acc.id}
                onClick={() => setSelectedAccountForDetail(acc)}
                className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors group cursor-pointer gap-2"
              >
                {/* Sisi Kiri: Ikon Berwarna + Nama & Nomor Akun */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-2xs shrink-0 transition-transform group-hover:scale-105"
                    style={{ backgroundColor: acc.color }}
                  >
                    {getAccountIcon(acc.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                      {acc.name}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5 mt-0.5">
                      <span>{getAccountTypeLabel(acc.type)}</span>
                      {acc.accountNumber && (
                        <>
                          <span className="text-slate-300 dark:text-slate-600">·</span>
                          <span className="font-mono text-slate-600 dark:text-slate-400">•••• {acc.accountNumber.slice(-4)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sisi Kanan: Nominal Saldo & Tombol Aksi */}
                <div
                  className="flex items-center gap-2 sm:gap-3 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Quick Action Pill Buttons on desktop */}
                  <div className="hidden md:flex items-center gap-1 mr-1">
                    <button
                      onClick={() => onAddIncome(acc.id)}
                      className="w-7 h-7 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-400 rounded-lg flex items-center justify-center transition-colors"
                      title="Tambah Pemasukan"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    </button>

                    <button
                      onClick={() => onAddExpense(acc.id)}
                      className="w-7 h-7 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-400 rounded-lg flex items-center justify-center transition-colors"
                      title="Tambah Pengeluaran"
                    >
                      <Minus className="w-3.5 h-3.5 stroke-[3]" />
                    </button>

                    <button
                      onClick={() => onTransfer(acc.id)}
                      className="w-7 h-7 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-400 rounded-lg flex items-center justify-center transition-colors"
                      title="Transfer Antar Rekening"
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Nominal Saldo */}
                  <div className="text-right">
                    <span className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white font-mono tabular-nums">
                      {formatRupiah(acc.balance)}
                    </span>
                  </div>

                  {/* Dropdown Menu Titik Tiga (⋮) */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() =>
                        setOpenDropdownId(openDropdownId === acc.id ? null : acc.id)
                      }
                      className="w-8 h-8 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center justify-center transition-colors"
                      title="Opsi Rekening"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {openDropdownId === acc.id && (
                      <div
                        className="absolute right-0 top-9 z-30 w-44 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 text-xs animate-in fade-in"
                        onMouseLeave={() => setOpenDropdownId(null)}
                      >
                        <button
                          onClick={() => {
                            setOpenDropdownId(null);
                            setSelectedAccountForDetail(acc);
                          }}
                          className="w-full px-3 py-2 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                        >
                          <History className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                          <span>Mutasi & Detail</span>
                        </button>

                        <button
                          onClick={() => {
                            setOpenDropdownId(null);
                            onAddIncome(acc.id);
                          }}
                          className="w-full px-3 py-2 text-left text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 flex items-center gap-2"
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Tambah Pemasukan</span>
                        </button>

                        <button
                          onClick={() => {
                            setOpenDropdownId(null);
                            onAddExpense(acc.id);
                          }}
                          className="w-full px-3 py-2 text-left text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2"
                        >
                          <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Tambah Pengeluaran</span>
                        </button>

                        <button
                          onClick={() => {
                            setOpenDropdownId(null);
                            onTransfer(acc.id);
                          }}
                          className="w-full px-3 py-2 text-left text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 flex items-center gap-2"
                        >
                          <ArrowLeftRight className="w-3.5 h-3.5" />
                          <span>Transfer Rekening</span>
                        </button>

                        <div className="border-t border-slate-100 dark:border-slate-800 my-1"></div>

                        <button
                          onClick={() => {
                            setOpenDropdownId(null);
                            onEditAccount(acc);
                          }}
                          className="w-full px-3 py-2 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                          <span>Edit Rekening</span>
                        </button>

                        <button
                          onClick={() => {
                            setOpenDropdownId(null);
                            onToggleArchive(acc.id);
                          }}
                          className="w-full px-3 py-2 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                        >
                          <Archive className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                          <span>Arsipkan</span>
                        </button>

                        <button
                          onClick={() => {
                            setOpenDropdownId(null);
                            onDeleteAccount(acc.id);
                          }}
                          className="w-full px-3 py-2 text-left text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          <span>Hapus Rekening</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* 4. REKENING DIARSIPKAN */}
      {archivedAccounts.length > 0 && (
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowArchived(!showArchived)}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors px-1"
          >
            <Archive className="w-3.5 h-3.5 text-amber-500" />
            <span>Rekening Diarsipkan ({archivedAccounts.length})</span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                showArchived ? 'rotate-180' : ''
              }`}
            />
          </button>

          {showArchived && (
            <div className="mt-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
              {archivedAccounts.map((acc) => (
                <div
                  key={acc.id}
                  className="p-3 sm:p-4 flex items-center justify-between opacity-75 hover:opacity-100 transition-opacity"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 opacity-80"
                      style={{ backgroundColor: acc.color }}
                    >
                      {getAccountIcon(acc.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate">
                        {acc.name}
                      </div>
                      <div className="text-xs text-slate-400">
                        {getAccountTypeLabel(acc.type)} · Diarsipkan
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-bold text-slate-500 font-mono">
                      {formatRupiah(acc.balance)}
                    </span>
                    <button
                      onClick={() => onToggleArchive(acc.id)}
                      className="px-2.5 py-1 text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-lg transition-colors"
                    >
                      Pulihkan
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. POP-UP DETAIL REKENING & MUTASI TRANSAKSI */}
      {selectedAccountForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs animate-in fade-in overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-xs shrink-0"
                  style={{ backgroundColor: selectedAccountForDetail.color }}
                >
                  {getAccountIcon(selectedAccountForDetail.type)}
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    {selectedAccountForDetail.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    {selectedAccountForDetail.currency} · {getAccountTypeLabel(selectedAccountForDetail.type)}
                    {selectedAccountForDetail.accountNumber &&
                      ` · •••• ${selectedAccountForDetail.accountNumber.slice(-4)}`}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedAccountForDetail(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content: Saldo & Quick Actions */}
            <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
                Saldo Saat Ini
              </span>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight mt-0.5">
                {formatRupiah(selectedAccountForDetail.balance)}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-2 mt-4">
                <button
                  onClick={() => {
                    const accId = selectedAccountForDetail.id;
                    setSelectedAccountForDetail(null);
                    onAddIncome(accId);
                  }}
                  className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Masuk</span>
                </button>

                <button
                  onClick={() => {
                    const accId = selectedAccountForDetail.id;
                    setSelectedAccountForDetail(null);
                    onAddExpense(accId);
                  }}
                  className="py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                >
                  <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Keluar</span>
                </button>

                <button
                  onClick={() => {
                    const accId = selectedAccountForDetail.id;
                    setSelectedAccountForDetail(null);
                    onTransfer(accId);
                  }}
                  className="py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  <span>Transfer</span>
                </button>
              </div>
            </div>

            {/* Mutation Transactions List */}
            <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Riwayat Mutasi Transaksi ({accountTransactions.length})
                </span>
                <button
                  onClick={() => {
                    const acc = selectedAccountForDetail;
                    setSelectedAccountForDetail(null);
                    onEditAccount(acc);
                  }}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Akun</span>
                </button>
              </div>

              {accountTransactions.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                  Belum ada mutasi transaksi untuk rekening ini.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900">
                  {accountTransactions.map((tx) => {
                    const isIncome = tx.type === 'income';
                    const isTransfer = tx.type === 'transfer';
                    const isOutgoingTransfer =
                      isTransfer && tx.accountId === selectedAccountForDetail.id;

                    return (
                      <div
                        key={tx.id}
                        className="p-3 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] shrink-0 font-bold"
                            style={{ backgroundColor: getCategoryColor(tx.categoryId) }}
                          >
                            {isIncome ? (
                              <ArrowDownLeft className="w-3.5 h-3.5 text-white" />
                            ) : (
                              <ArrowUpRight className="w-3.5 h-3.5 text-white" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900 dark:text-white truncate">
                              {tx.notes || getCategoryName(tx.categoryId)}
                            </div>
                            <div className="text-[11px] text-slate-400 dark:text-slate-500">
                              {formatDateIndo(tx.transactionDate)} ·{' '}
                              {getCategoryName(tx.categoryId)}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span
                            className={`font-mono font-bold text-xs ${
                              isIncome
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : isOutgoingTransfer
                                ? 'text-blue-600 dark:text-blue-400'
                                : 'text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            {isIncome ? '+' : '-'} {formatRupiah(tx.amount)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedAccountForDetail(null)}
                className="px-4 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

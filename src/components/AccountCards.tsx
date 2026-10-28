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
import { AppIcon } from './AppIcon';

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
  onOpenSettings?: () => void;
  onLogoClick?: () => void;
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
  onOpenSettings,
  onLogoClick,
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
    <div className="w-full flex flex-col">
      {/* 1. TOP BLUE GRADIENT HERO HEADER (Mockup Rekening_Baru_73f29a70.jpg) */}
      <div className="w-full bg-gradient-to-b from-[#0052b4] via-[#0170d5] to-[#2cbdf8] text-white pt-2 sm:pt-3 pb-8 px-4 select-none">
        <div className="max-w-lg mx-auto sm:max-w-xl md:max-w-2xl w-full">
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

          {/* Centered Total Aset + Nominal + '+ Rekening' button */}
          <div className="flex flex-col items-center justify-center text-center pt-1 pb-3">
            <span className="text-xs sm:text-sm font-semibold text-sky-100 tracking-wide">
              Total Aset
            </span>
            <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-sans my-1">
              {formatRupiah(totalAssets)}
            </div>
            <button
              type="button"
              onClick={onAddNewAccount}
              className="mt-2 bg-white text-sky-600 hover:bg-sky-50 font-bold px-4 py-1.5 rounded-full shadow-md text-xs sm:text-sm inline-flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Rekening</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. DAFTAR REKENING VERTIKAL (Curved White Card Container) */}
      <div className="max-w-lg mx-auto sm:max-w-xl md:max-w-2xl w-full px-3 sm:px-4 -mt-4 pb-24">
        <div className="bg-white dark:bg-slate-900 rounded-[28px] sm:rounded-[32px] border border-slate-200/80 dark:border-slate-800 shadow-sm divide-y divide-slate-100 dark:divide-slate-800 p-2 sm:p-3">
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
            activeAccounts.map((acc) => (
              <div
                key={acc.id}
                onClick={() => setSelectedAccountForDetail(acc)}
                className={`p-3 sm:p-3.5 flex items-center justify-between hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors group cursor-pointer gap-2 first:rounded-t-2xl sm:first:rounded-t-3xl last:rounded-b-2xl sm:last:rounded-b-3xl ${
                  openDropdownId === acc.id ? 'relative z-40' : 'relative z-10'
                }`}
              >
                {/* Sisi Kiri: Ikon Berwarna + Nama & Jenis */}
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
                    <div className="text-xs text-slate-400 font-medium capitalize mt-0.5">
                      {getAccountTypeLabel(acc.type)}
                    </div>
                  </div>
                </div>

                {/* Sisi Kanan: Nominal Saldo & Tombol Aksi */}
                <div
                  className="flex items-center gap-2 sm:gap-3 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Nominal Saldo */}
                  <div className="text-right">
                    <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white font-mono tabular-nums">
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
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setOpenDropdownId(null)}
                        />
                        <div
                          className="absolute right-0 top-full mt-1.5 z-50 w-44 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 text-xs animate-in fade-in zoom-in-95 duration-100"
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
                    </>
                  )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
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

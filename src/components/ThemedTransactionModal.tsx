import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  CreditCard,
  Calendar,
  FileText,
  AlertCircle,
  Tag,
  Check,
  ChevronDown,
  ArrowRight,
} from 'lucide-react';
import {
  Account,
  Budget,
  Category,
  Transaction,
  TransactionType,
  UserRole,
} from '../types/finance';
import { formatRupiah } from '../lib/formatters';
import { PartyAutocompleteInput } from './PartyAutocompleteInput';
import { savePartyMemory } from '../lib/partyMemory';

interface ThemedTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: TransactionType; // 'expense', 'income', 'transfer'
  accounts: Account[];
  categories: Category[];
  budgets: Budget[];
  transactions: Transaction[];
  activeRole: UserRole;
  defaultAccountId?: string;
  onOpenManageCategories: () => void;
  onSave: (data: {
    accountId: string;
    categoryId: string;
    userId: string;
    amount: number;
    type: TransactionType;
    targetAccountId?: string | null;
    partyFrom?: string;
    partyTo?: string;
    tags: string[];
    notes?: string;
    transactionDate?: string;
    isGuiltFree?: boolean;
    guiltFreeOwner?: UserRole | null;
  }) => void;
}

export const ThemedTransactionModal: React.FC<ThemedTransactionModalProps> = ({
  isOpen,
  onClose,
  type,
  accounts,
  categories,
  budgets,
  transactions,
  activeRole,
  defaultAccountId,
  onOpenManageCategories,
  onSave,
}) => {
  const [amountStr, setAmountStr] = useState<string>('');
  const [accountId, setAccountId] = useState<string>(defaultAccountId || accounts[0]?.id || '');
  const [targetAccountId, setTargetAccountId] = useState<string>(
    accounts.find((a) => a.id !== (defaultAccountId || accounts[0]?.id))?.id || ''
  );
  const [selectedParentId, setSelectedParentId] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [partyFrom, setPartyFrom] = useState<string>('');
  const [partyTo, setPartyTo] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [txnDate, setTxnDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isGuiltFree, setIsGuiltFree] = useState<boolean>(false);

  // Filter categories by transaction type
  const relevantCategories = categories.filter(
    (c) => c.type === (type === 'transfer' ? 'expense' : type)
  );
  const parentCategories = relevantCategories.filter((c) => !c.parentId);

  const prevIsOpenRef = useRef(false);
  const accountsRef = useRef(accounts);
  accountsRef.current = accounts;
  const categoriesRef = useRef(categories);
  categoriesRef.current = categories;

  // PERBAIKAN BUG: Isian modal HANYA diinisialisasi ketika modal baru saja dibuka (transisi tertutup -> terbuka).
  // JANGAN me-reset saat user sedang mengetik (misal karena background sync / heartbeat setiap 6 detik).
  // Isian akan direset bersih PASCA SUBMIT pada handleSubmit.
  useEffect(() => {
    if (!prevIsOpenRef.current && isOpen) {
      setAmountStr('');
      setPartyFrom('');
      setPartyTo('');
      setNotes('');
      setIsGuiltFree(false);
      setTxnDate(new Date().toISOString().split('T')[0]);

      const accs = accountsRef.current;
      const cats = categoriesRef.current;
      const initialSource = defaultAccountId || accs[0]?.id || '';
      setAccountId(initialSource);
      const initialTarget = accs.find((a) => a.id !== initialSource);
      setTargetAccountId(initialTarget ? initialTarget.id : '');

      if (type !== 'transfer') {
        const relevant = cats.filter((c) => c.type === type);
        const parents = relevant.filter((c) => !c.parentId);
        if (parents.length > 0) {
          const firstParent = parents[0];
          setSelectedParentId(firstParent.id);
          const firstSub = relevant.find((c) => c.parentId === firstParent.id);
          setSelectedCategoryId(firstSub ? firstSub.id : firstParent.id);
        } else {
          setSelectedParentId('');
          setSelectedCategoryId('');
        }
      } else {
        setSelectedParentId('');
        setSelectedCategoryId('');
      }
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, type, defaultAccountId]);

  if (!isOpen) return null;

  const handleParentSelect = (parentId: string) => {
    setSelectedParentId(parentId);
    const subCats = relevantCategories.filter((c) => c.parentId === parentId);
    if (subCats.length > 0) {
      setSelectedCategoryId(subCats[0].id);
    } else {
      setSelectedCategoryId(parentId);
    }
  };

  const adjustAmount = (delta: number) => {
    const current = parseFloat(amountStr.replace(/[^0-9]/g, '')) || 0;
    const nextVal = Math.max(0, current + delta);
    setAmountStr(nextVal > 0 ? nextVal.toString() : '');
  };

  const subCategories = relevantCategories.filter((c) => c.parentId === selectedParentId);

  // Linked budget check
  const linkedBudget = budgets.find(
    (b) =>
      b.categoryId === selectedParentId ||
      b.categoryId === selectedCategoryId ||
      categories.some((c) => c.id === selectedCategoryId && c.parentId === b.categoryId)
  );

  let remainingBudget: number | null = null;
  let totalEffectiveBudget = 0;
  if (linkedBudget && type === 'expense') {
    const categoryTransactions = transactions.filter((t) => {
      const isMatch =
        t.categoryId === linkedBudget.categoryId ||
        categories.some((c) => c.id === t.categoryId && c.parentId === linkedBudget.categoryId);
      return isMatch && t.type === 'expense';
    });

    const spent = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
    totalEffectiveBudget = linkedBudget.limitAmount + (linkedBudget.rolloverAmount || 0);
    remainingBudget = totalEffectiveBudget - spent;
  }

  const numericAmount = parseFloat(amountStr.replace(/[^0-9]/g, '')) || 0;
  const simulatedRemainingBudget =
    remainingBudget !== null ? remainingBudget - numericAmount : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numericAmount <= 0) return;

    // SAVE TO MEMORY FOR AUTOCOMPLETE (hanya untuk pemasukan/pengeluaran)
    if (type !== 'transfer') {
      if (partyFrom.trim()) {
        savePartyMemory('from', partyFrom.trim());
      }
      if (partyTo.trim()) {
        savePartyMemory('to', partyTo.trim());
      }
    }

    onSave({
      accountId,
      categoryId: type === 'transfer' ? 'transfer' : (selectedCategoryId || selectedParentId || categories[0]?.id || ''),
      userId: activeRole === 'husband' ? 'usr-husband-fikri-01' : 'usr-wife-alya-02',
      amount: numericAmount,
      type,
      targetAccountId: type === 'transfer' ? targetAccountId : null,
      partyFrom: type === 'transfer' ? '' : partyFrom.trim(),
      partyTo: type === 'transfer' ? '' : partyTo.trim(),
      tags: type === 'transfer' ? ['Transfer Antar Rekening'] : [type === 'expense' ? 'Operasional' : 'Pemasukan'],
      notes: notes.trim(),
      transactionDate: txnDate
        ? new Date(txnDate.includes('T') ? txnDate : `${txnDate}T12:00:00`).toISOString()
        : new Date().toISOString(),
      isGuiltFree,
      guiltFreeOwner: isGuiltFree ? activeRole : null,
    });

    // Reset input fields
    setAmountStr('');
    setPartyFrom('');
    setPartyTo('');
    setNotes('');
    setIsGuiltFree(false);
    onClose();
  };

  // Color / text theme per transaction type
  const modalTheme = {
    expense: {
      title: 'Tambah Pengeluaran',
      subtitle: 'Catat pengeluaran baru dan kurangi saldo rekening',
      accent: 'rose',
      primaryBtn: 'bg-rose-600 hover:bg-rose-700 text-white',
      badgeColor: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400',
    },
    income: {
      title: 'Tambah Pemasukan',
      subtitle: 'Catat pemasukan baru dan tambahkan saldo rekening',
      accent: 'emerald',
      primaryBtn: 'bg-emerald-600 hover:bg-emerald-700 text-white',
      badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400',
    },
    transfer: {
      title: 'Transfer Uang Antar Rekening',
      subtitle: 'Pindahkan dana dari satu rekening ke rekening lain',
      accent: 'blue',
      primaryBtn: 'bg-blue-600 hover:bg-blue-700 text-white',
      badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400',
    },
  }[type];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* HEADER */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-2xs ${
                type === 'expense'
                  ? 'bg-rose-500'
                  : type === 'income'
                  ? 'bg-emerald-500'
                  : 'bg-blue-500'
              }`}
            >
              {type === 'expense' ? '−' : type === 'income' ? '+' : '⇄'}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{modalTheme.title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{modalTheme.subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* FORM CONTENT */}
        {type === 'transfer' ? (
          <form onSubmit={handleSubmit} className="p-5 space-y-4 flex-1 overflow-y-auto">
            {/* Nominal Transfer */}
            <div className="p-4 bg-slate-50/80 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
                Nominal Transfer (Rp)
              </label>
              <input
                type="number"
                inputMode="numeric"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                placeholder="0"
                required
                autoFocus
                className="w-full text-3xl font-extrabold text-slate-900 dark:text-white bg-transparent outline-none font-mono tabular-nums"
              />
              {numericAmount > 0 && (
                <div className="text-xs text-blue-600 dark:text-blue-400 font-bold font-mono">
                  {formatRupiah(numericAmount)}
                </div>
              )}
            </div>

            {/* Rekening Sumber & Tujuan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Dari Rekening (Sumber)
                </label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({formatRupiah(acc.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Ke Rekening (Tujuan)
                </label>
                <select
                  value={targetAccountId}
                  onChange={(e) => setTargetAccountId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                >
                  {accounts
                    .filter((a) => a.id !== accountId)
                    .map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({formatRupiah(acc.balance)})
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* Tanggal Transaksi */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Tanggal Transaksi
              </label>
              <input
                type="date"
                value={txnDate}
                onChange={(e) => setTxnDate(e.target.value)}
                required
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
              />
            </div>

            {/* Catatan */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Catatan (Opsional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Keterangan transfer..."
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={numericAmount <= 0}
                className={`flex-1 py-3 text-xs font-bold rounded-xl shadow-xs transition-colors ${modalTheme.primaryBtn}`}
              >
                Simpan Transfer
              </button>
            </div>
          </form>
        ) : (
          /* FORM PEMASUKAN & PENGELUARAN */
          <form onSubmit={handleSubmit} className="p-5 space-y-4 flex-1 overflow-y-auto">
            {/* 1. NOMINAL INPUT & QUICK BUTTONS */}
            <div className="p-4 bg-slate-50/80 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2.5">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
                Nominal Transaksi (Rp)
              </label>
              <input
                type="number"
                inputMode="numeric"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                placeholder="0"
                required
                autoFocus
                className="w-full text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white bg-transparent outline-none font-mono tabular-nums tracking-tight"
              />
              {numericAmount > 0 && (
                <div
                  className={`text-sm font-bold font-mono ${
                    type === 'expense' ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {formatRupiah(numericAmount)}
                </div>
              )}

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-1.5 pt-1 overflow-x-auto pb-0.5 no-scrollbar">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase shrink-0">
                  Cepat:
                </span>
                <button
                  type="button"
                  onClick={() => adjustAmount(25000)}
                  className="px-2.5 py-1 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg shadow-2xs shrink-0"
                >
                  +25rb
                </button>
                <button
                  type="button"
                  onClick={() => adjustAmount(50000)}
                  className="px-2.5 py-1 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg shadow-2xs shrink-0"
                >
                  +50rb
                </button>
                <button
                  type="button"
                  onClick={() => adjustAmount(100000)}
                  className="px-2.5 py-1 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg shadow-2xs shrink-0"
                >
                  +100rb
                </button>
                <button
                  type="button"
                  onClick={() => adjustAmount(500000)}
                  className="px-2.5 py-1 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg shadow-2xs shrink-0"
                >
                  +500rb
                </button>
                <button
                  type="button"
                  onClick={() => adjustAmount(1000000)}
                  className="px-2.5 py-1 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg shadow-2xs shrink-0"
                >
                  +1jt
                </button>
                <button
                  type="button"
                  onClick={() => adjustAmount(-50000)}
                  className="px-2 py-1 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 text-xs font-semibold rounded-lg shadow-2xs shrink-0"
                  title="Kurang 50rb"
                >
                  -50rb
                </button>
              </div>
            </div>

            {/* 2. REKENING & TANGGAL */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Rekening / Dompet
                </label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} — Saldo: {formatRupiah(acc.balance)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Tanggal Transaksi
                </label>
                <input
                  type="date"
                  value={txnDate}
                  onChange={(e) => setTxnDate(e.target.value)}
                  required
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                />
              </div>
            </div>

            {/* 3. KATEGORI & SUB-KATEGORI */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  Pilih Kategori:
                </label>
                <button
                  type="button"
                  onClick={onOpenManageCategories}
                  className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                >
                  Kelola Kategori
                </button>
              </div>

              {/* Kategori Utama Chips */}
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                {parentCategories.map((p) => {
                  const isSelected = selectedParentId === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleParentSelect(p.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-slate-900 dark:bg-indigo-600 text-white border-slate-900 dark:border-indigo-600 shadow-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
                      }`}
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: p.color }}
                      />
                      <span>{p.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Sub-Kategori Chips jika ada */}
              {subCategories.length > 0 && (
                <div className="p-2.5 bg-slate-50/70 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                    Sub-Kategori:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {subCategories.map((sub) => {
                      const isSelected = selectedCategoryId === sub.id;
                      return (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => setSelectedCategoryId(sub.id)}
                          className={`p-2 rounded-xl text-xs font-semibold text-left border transition-all flex items-center justify-between ${
                            isSelected
                              ? 'bg-white dark:bg-slate-800 border-blue-500 dark:border-blue-400 text-blue-700 dark:text-blue-300 shadow-2xs ring-1 ring-blue-500/20'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                          }`}
                        >
                          <span className="truncate">{sub.name}</span>
                          {isSelected && (
                            <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 ml-1" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Sisa Anggaran Alert Card (Jika Pengeluaran & Ada Anggaran Terkait) */}
            {type === 'expense' && linkedBudget && (
              <div className="p-3 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/70 rounded-xl text-xs space-y-1">
                <div className="flex items-center justify-between font-bold text-amber-900 dark:text-amber-200">
                  <span className="flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>
                      Termasuk Anggaran: {categories.find((c) => c.id === linkedBudget.categoryId)?.name || 'Kategori Terkait'}
                    </span>
                  </span>
                  <span className="font-mono">Batas: {formatRupiah(totalEffectiveBudget)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 pt-0.5">
                  <span>Sisa Saat Ini:</span>
                  <span className="font-bold font-mono text-slate-800 dark:text-slate-100">
                    {formatRupiah(remainingBudget || 0)}
                  </span>
                </div>
                {numericAmount > 0 && (
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 border-t border-amber-200/60 dark:border-amber-800/50 pt-1">
                    <span>Sisa Setelah Transaksi:</span>
                    <span
                      className={`font-bold font-mono ${
                        (simulatedRemainingBudget || 0) < 0
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-emerald-700 dark:text-emerald-400'
                      }`}
                    >
                      {formatRupiah(simulatedRemainingBudget || 0)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* 4. ISIAN "DARI" DAN "KE" DENGAN MEMORI AUTOCOMPLETE PERSISTEN */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <PartyAutocompleteInput
                label="Dari (Sumber / Pembayar)"
                value={partyFrom}
                onChange={setPartyFrom}
                partyType="from"
                placeholder={
                  type === 'expense'
                    ? 'Contoh: Fikri Arkan / Dompet'
                    : 'Contoh: PT Tech / Sales Mobil'
                }
              />
              <PartyAutocompleteInput
                label="Ke (Tujuan / Penerima / Merchant)"
                value={partyTo}
                onChange={setPartyTo}
                partyType="to"
                placeholder={
                  type === 'expense'
                    ? 'Contoh: Superindo / Tokopedia / Sales Mobil'
                    : 'Contoh: Rekening BCA'
                }
              />
            </div>

            {/* 5. CATATAN TAMBAHAN (OPSIONAL) */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Catatan (Opsional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Misal: Belanja bulanan, transfer bonus, dll."
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:border-slate-400"
              />
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={numericAmount <= 0}
                className={`flex-1 py-3 text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 ${modalTheme.primaryBtn}`}
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Simpan Transaksi</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

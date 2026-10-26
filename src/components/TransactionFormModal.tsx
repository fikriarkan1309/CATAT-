import React, { useState } from 'react';
import {
  X,
  Plus,
  Tag,
  CreditCard,
  FolderTree,
  FileText,
  Calendar,
  Sparkles,
  Check,
  Coffee,
} from 'lucide-react';
import {
  Account,
  Category,
  TransactionType,
  UserRole,
} from '../types/finance';
import { AVAILABLE_TAGS } from '../lib/constants';
import { formatRupiah } from '../lib/formatters';

interface TransactionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  categories: Category[];
  activeRole: UserRole;
  onSave: (transactionData: {
    accountId: string;
    categoryId: string;
    userId: string;
    amount: number;
    type: TransactionType;
    targetAccountId?: string | null;
    tags: string[];
    notes?: string;
    transactionDate?: string;
    isGuiltFree?: boolean;
    guiltFreeOwner?: UserRole | null;
  }) => void;
}

export const TransactionFormModal: React.FC<TransactionFormModalProps> = ({
  isOpen,
  onClose,
  accounts,
  categories,
  activeRole,
  onSave,
}) => {
  const [type, setType] = useState<TransactionType>('expense');
  const [amountStr, setAmountStr] = useState<string>('');
  const [accountId, setAccountId] = useState<string>(accounts[0]?.id || '');
  const [targetAccountId, setTargetAccountId] = useState<string>(accounts[1]?.id || '');
  const [selectedParentId, setSelectedParentId] = useState<string>('cat-kebutuhan-pokok');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('sub-belanja-dapur');
  const [selectedTags, setSelectedTags] = useState<string[]>(['Operasional Rumah']);
  const [customTagInput, setCustomTagInput] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isGuiltFree, setIsGuiltFree] = useState<boolean>(false);
  const [txnDate, setTxnDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const prevIsOpenRef = React.useRef(false);
  const accountsRef = React.useRef(accounts);
  accountsRef.current = accounts;

  React.useEffect(() => {
    if (!prevIsOpenRef.current && isOpen) {
      setAmountStr('');
      setNotes('');
      setCustomTagInput('');
      setIsGuiltFree(false);
      setTxnDate(new Date().toISOString().split('T')[0]);
      const accs = accountsRef.current;
      if (accs.length > 0) {
        setAccountId(accs[0].id);
        const second = accs.find((a) => a.id !== accs[0].id);
        setTargetAccountId(second ? second.id : '');
      }
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter categories by type
  const parentCategories = categories.filter(
    (c) => !c.parentId && c.type === (type === 'transfer' ? 'expense' : type)
  );

  const subCategories = categories.filter(
    (c) => c.parentId === selectedParentId && c.type === (type === 'transfer' ? 'expense' : type)
  );

  const handleParentSelect = (pId: string) => {
    setSelectedParentId(pId);
    const firstSub = categories.find((c) => c.parentId === pId);
    setSelectedCategoryId(firstSub ? firstSub.id : pId);
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleAddCustomTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && customTagInput.trim()) {
      e.preventDefault();
      if (!selectedTags.includes(customTagInput.trim())) {
        setSelectedTags([...selectedTags, customTagInput.trim()]);
      }
      setCustomTagInput('');
    }
  };

  const handleQuickAddAmount = (addVal: number) => {
    const current = parseFloat(amountStr.replace(/[^0-9]/g, '')) || 0;
    setAmountStr((current + addVal).toString());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rawVal = parseFloat(amountStr.replace(/[^0-9]/g, ''));
    if (!rawVal || rawVal <= 0) return;

    onSave({
      accountId,
      categoryId: selectedCategoryId || selectedParentId,
      userId: activeRole === 'husband' ? 'usr-husband-fikri-01' : 'usr-wife-alya-02',
      amount: rawVal,
      type,
      targetAccountId: type === 'transfer' ? targetAccountId : null,
      tags: selectedTags,
      notes: notes.trim(),
      transactionDate: txnDate
        ? new Date(txnDate.includes('T') ? txnDate : `${txnDate}T12:00:00`).toISOString()
        : new Date().toISOString(),
      isGuiltFree,
      guiltFreeOwner: isGuiltFree ? activeRole : null,
    });

    // Reset form pasca submit
    setAmountStr('');
    setNotes('');
    setCustomTagInput('');
    setIsGuiltFree(false);
    onClose();
  };

  const rawAmount = parseFloat(amountStr.replace(/[^0-9]/g, '')) || 0;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-900">Input Transaksi Baru</span>
            <span className="text-xs text-slate-400 font-medium">·</span>
            <span className="text-xs text-slate-600 font-medium">
              Oleh {activeRole === 'husband' ? '👨🏻‍💼 Suami' : '👩🏻‍💼 Istri'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Transaction Type Segmented Switcher */}
          <div className="flex p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                type === 'expense'
                  ? 'bg-white text-rose-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pengeluaran
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                type === 'income'
                  ? 'bg-white text-emerald-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pemasukan
            </button>
            <button
              type="button"
              onClick={() => setType('transfer')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                type === 'transfer'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Transfer Antar Rekening
            </button>
          </div>

          {/* Amount Input with big display & fast increments */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="text-[11px] font-semibold text-slate-500 mb-1">
              Nominal Transaksi (IDR)
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-slate-400">Rp</span>
              <input
                type="number"
                inputMode="numeric"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                placeholder="0"
                autoFocus
                required
                className="w-full text-3xl font-extrabold text-slate-900 bg-transparent border-none outline-none font-mono tabular-nums placeholder:text-slate-300"
              />
            </div>
            {rawAmount > 0 && (
              <div className="text-xs text-slate-500 font-medium mt-1">
                {formatRupiah(rawAmount)}
              </div>
            )}

            {/* Quick Increment Buttons */}
            <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-slate-200/60 overflow-x-auto pb-0.5">
              {[50000, 100000, 250000, 500000, 1000000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleQuickAddAmount(val)}
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-medium rounded-md border border-slate-200 shadow-2xs whitespace-nowrap"
                >
                  +{val >= 1000000 ? `${val / 1000000}Jt` : `${val / 1000}Rb`}
                </button>
              ))}
            </div>
          </div>

          {/* Guilt-Free Spending Toggle (Only for Expense) */}
          {type === 'expense' && (
            <div
              onClick={() => setIsGuiltFree(!isGuiltFree)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                isGuiltFree
                  ? 'bg-amber-50/80 border-amber-300 text-amber-900'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100/60 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`p-2 rounded-xl ${
                    isGuiltFree ? 'bg-amber-200 text-amber-800' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  <Coffee className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold leading-tight">
                    Dompet Pribadi / Uang Jajan {activeRole === 'husband' ? 'Suami' : 'Istri'}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Pengeluaran santai (kopi, hobi) tanpa detail audit laporan utama
                  </div>
                </div>
              </div>
              <div
                className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                  isGuiltFree
                    ? 'bg-amber-500 border-amber-600 text-white'
                    : 'border-slate-300 bg-white'
                }`}
              >
                {isGuiltFree && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
            </div>
          )}

          {/* Account Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5" />
              <span>{type === 'transfer' ? 'Dari Rekening Sumber' : 'Rekening / Sumber Dana'}</span>
            </label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:ring-2 focus:ring-slate-900"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} — Saldo: {formatRupiah(acc.balance)}
                </option>
              ))}
            </select>
          </div>

          {/* Target Account if Transfer */}
          {type === 'transfer' && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5" />
                <span>Ke Rekening Tujuan</span>
              </label>
              <select
                value={targetAccountId}
                onChange={(e) => setTargetAccountId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:ring-2 focus:ring-slate-900"
              >
                {accounts
                  .filter((a) => a.id !== accountId)
                  .map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} — Saldo: {formatRupiah(acc.balance)}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Parent & Child Category Selection */}
          {type !== 'transfer' && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                <FolderTree className="w-3.5 h-3.5" />
                <span>Kategori Utama & Sub-Kategori</span>
              </label>

              {/* Parent category pills */}
              <div className="flex flex-wrap gap-1.5">
                {parentCategories.map((pCat) => (
                  <button
                    key={pCat.id}
                    type="button"
                    onClick={() => handleParentSelect(pCat.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      selectedParentId === pCat.id
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {pCat.name}
                  </button>
                ))}
              </div>

              {/* Sub-categories */}
              {subCategories.length > 0 && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 mt-2">
                  <div className="text-[11px] font-semibold text-slate-500 mb-2">
                    Pilih Sub-Kategori:
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {subCategories.map((sub) => (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => setSelectedCategoryId(sub.id)}
                        className={`p-2 rounded-lg text-xs font-medium text-left border transition-all flex items-center justify-between ${
                          selectedCategoryId === sub.id
                            ? 'bg-blue-50 border-blue-400 text-blue-900 font-semibold'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span className="truncate">{sub.name}</span>
                        {selectedCategoryId === sub.id && (
                          <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 ml-1" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tagging System */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" />
              <span>Tagging Spesifik Keluarga</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {AVAILABLE_TAGS.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>

            {/* Custom Tag input */}
            <input
              type="text"
              value={customTagInput}
              onChange={(e) => setCustomTagInput(e.target.value)}
              onKeyDown={handleAddCustomTag}
              placeholder="+ Ketik tag baru lalu tekan Enter"
              className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white placeholder:text-slate-400 focus:ring-1 focus:ring-slate-900"
            />
          </div>

          {/* Notes & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                <FileText className="w-3 h-3" />
                <span>Catatan</span>
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Misal: Belanja bulanan Superindo"
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>Tanggal</span>
              </label>
              <input
                type="date"
                value={txnDate}
                onChange={(e) => setTxnDate(e.target.value)}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 transition-colors"
          >
            Batal
          </button>

          <button
            onClick={handleSubmit}
            disabled={rawAmount <= 0}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Simpan Transaksi Instan (Offline-Ready)</span>
          </button>
        </div>
      </div>
    </div>
  );
};

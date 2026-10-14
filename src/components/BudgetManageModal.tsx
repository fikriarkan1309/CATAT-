import React, { useState, useEffect } from 'react';
import { X, Target, Calendar, CreditCard, FolderTree } from 'lucide-react';
import { Account, Budget, BudgetDuration, Category } from '../types/finance';
import { formatRupiah } from '../lib/formatters';

interface BudgetManageModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  accounts: Account[];
  onSave: (data: {
    categoryId: string;
    accountId: string;
    limitAmount: number;
    duration: BudgetDuration;
    startDate: string;
    endDate: string;
  }) => void;
  editingBudget?: Budget | null;
}

export const BudgetManageModal: React.FC<BudgetManageModalProps> = ({
  isOpen,
  onClose,
  categories,
  accounts,
  onSave,
  editingBudget,
}) => {
  const expenseCategories = categories.filter((c) => c.type === 'expense' && !c.parentId);

  const [categoryId, setCategoryId] = useState(expenseCategories[0]?.id || '');
  const [accountId, setAccountId] = useState('all');
  const [limitStr, setLimitStr] = useState('');
  const [duration, setDuration] = useState<BudgetDuration>('1_month');
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]
  );

  useEffect(() => {
    if (editingBudget) {
      setCategoryId(editingBudget.categoryId);
      setAccountId(editingBudget.accountId || 'all');
      setLimitStr(editingBudget.limitAmount.toString());
      setDuration(editingBudget.duration || '1_month');
      setStartDate(editingBudget.startDate || '');
      setEndDate(editingBudget.endDate || '');
    } else {
      setCategoryId(expenseCategories[0]?.id || '');
      setAccountId('all');
      setLimitStr('');
      setDuration('1_month');
      setStartDate(
        new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
      );
      setEndDate(
        new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]
      );
    }
  }, [editingBudget, isOpen]);

  // Adjust dates automatically when duration presets change
  const handleDurationChange = (d: BudgetDuration) => {
    setDuration(d);
    const now = new Date();
    if (d === '1_week') {
      const nextWeek = new Date(now);
      nextWeek.setDate(now.getDate() + 7);
      setStartDate(now.toISOString().split('T')[0]);
      setEndDate(nextWeek.toISOString().split('T')[0]);
    } else if (d === '1_month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setStartDate(firstDay.toISOString().split('T')[0]);
      setEndDate(lastDay.toISOString().split('T')[0]);
    } else if (d === '1_year') {
      const firstDay = new Date(now.getFullYear(), 0, 1);
      const lastDay = new Date(now.getFullYear(), 11, 31);
      setStartDate(firstDay.toISOString().split('T')[0]);
      setEndDate(lastDay.toISOString().split('T')[0]);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(limitStr.replace(/[^0-9]/g, ''));
    if (!val || val <= 0) return;

    onSave({
      categoryId,
      accountId,
      limitAmount: val,
      duration,
      startDate,
      endDate,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                {editingBudget ? 'Edit Anggaran' : 'Tambah Anggaran Baru'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Sesuai alur konfigurasi durasi & rekening Mind Map
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Kategori: pilih */}
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
              <FolderTree className="w-3.5 h-3.5" />
              <span>Kategori Anggaran</span>
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full mt-1 p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
            >
              {expenseCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Rekening: semua / pilih */}
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5" />
              <span>Cakupan Rekening</span>
            </label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full mt-1 p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
            >
              <option value="all">Semua Rekening (Gabungan Likuiditas)</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  Rekening: {acc.name} ({formatRupiah(acc.balance)})
                </option>
              ))}
            </select>
          </div>

          {/* Jumlah Anggaran: isi */}
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Jumlah Batas Anggaran (Rp)</label>
            <input
              type="number"
              value={limitStr}
              onChange={(e) => setLimitStr(e.target.value)}
              placeholder="0"
              required
              autoFocus
              className="w-full mt-1 p-2.5 text-xl font-bold font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-600"
            />
          </div>

          {/* Durasi: pilih 1 Minggu, 1 Bulan (default), 1 Tahun, Periode khusus */}
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 block">
              Durasi Anggaran
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {[
                { id: '1_week', label: '1 Minggu' },
                { id: '1_month', label: '1 Bulan' },
                { id: '1_year', label: '1 Tahun' },
                { id: 'custom', label: 'Khusus' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleDurationChange(item.id as BudgetDuration)}
                  className={`py-2 px-2 text-xs font-medium rounded-lg border transition-all ${
                    duration === item.id
                      ? 'bg-slate-900 dark:bg-indigo-600 text-white border-slate-900 dark:border-indigo-600 font-semibold'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Periode Khusus / Rentang Tanggal */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Dari Tanggal</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full mt-1 p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Ke Tanggal</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="w-full mt-1 p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Tombol Batal & Simpan */}
          <div className="flex gap-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 text-xs font-bold text-white bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 rounded-xl shadow-xs"
            >
              Simpan Anggaran
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

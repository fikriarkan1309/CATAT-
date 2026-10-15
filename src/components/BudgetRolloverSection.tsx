import React, { useState, useRef } from 'react';
import {
  RotateCcw,
  Plus,
  Calendar,
  AlertTriangle,
  Wallet,
  PiggyBank,
  MoreVertical,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Account, Budget, Category, RolloverAction, SharedGoal, Transaction } from '../types/finance';
import { formatDateIndo, formatRupiah } from '../lib/formatters';

interface BudgetRolloverSectionProps {
  budgets: Budget[];
  categories: Category[];
  transactions: Transaction[];
  goals: SharedGoal[];
  accounts: Account[];
  onProcessRollover: (
    budgetId: string,
    action: RolloverAction,
    targetGoalId?: string
  ) => void;
  onAddNewBudget: () => void;
  onEditBudget: (budget: Budget) => void;
  onDeleteBudget: (id: string) => void;
}

export const BudgetRolloverSection: React.FC<BudgetRolloverSectionProps> = ({
  budgets,
  categories,
  transactions,
  goals,
  accounts,
  onProcessRollover,
  onAddNewBudget,
  onEditBudget,
  onDeleteBudget,
}) => {
  const [selectedBudgetForRollover, setSelectedBudgetForRollover] = useState<Budget | null>(null);
  const [rolloverAction, setRolloverAction] = useState<RolloverAction>('rollover');
  const [targetGoalId, setTargetGoalId] = useState<string>(goals[0]?.id || '');
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [selectedDurationFilter, setSelectedDurationFilter] = useState<string>('all');

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollPeriod = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -180 : 180;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handlePeriodWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (scrollContainerRef.current && e.deltaY !== 0) {
      scrollContainerRef.current.scrollLeft += e.deltaY;
    }
  };

  // Helper to calculate total spent for a parent category + its subcategories
  const getCategorySpent = (b: Budget) => {
    const catId = b.categoryId;
    const subCatIds = categories.filter((c) => c.parentId === catId).map((c) => c.id);
    const targetIds = [catId, ...subCatIds];

    return transactions
      .filter((t) => {
        if (!targetIds.includes(t.categoryId) || t.type !== 'expense' || t.isGuiltFree) return false;
        if (b.accountId && b.accountId !== 'all' && t.accountId !== b.accountId) return false;
        if (b.startDate && b.endDate) {
          const tDate = t.transactionDate.split('T')[0];
          if (tDate < b.startDate || tDate > b.endDate) return false;
        }
        return true;
      })
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const handleOpenRolloverModal = (b: Budget) => {
    setOpenDropdownId(null);
    setSelectedBudgetForRollover(b);
    setRolloverAction(b.rolloverAction || 'rollover');
  };

  const handleConfirmRollover = () => {
    if (!selectedBudgetForRollover) return;
    onProcessRollover(selectedBudgetForRollover.id, rolloverAction, targetGoalId);
    setSelectedBudgetForRollover(null);
  };

  // Filter budgets by duration
  const filteredBudgets = budgets.filter((b) => {
    if (selectedDurationFilter === 'all') return true;
    return (b.duration || '1_month') === selectedDurationFilter;
  });

  const getDurationLabel = (duration: string) => {
    switch (duration) {
      case '1_week':
        return '1 Minggu';
      case '1_month':
        return '1 Bulan';
      case '1_year':
        return '1 Tahun';
      case 'custom':
        return 'Khusus';
      default:
        return 'Bulanan';
    }
  };

  const periodOptions = [
    { id: 'all', label: 'Semua Periode' },
    { id: '1_week', label: '1 Minggu' },
    { id: '1_month', label: '1 Bulan (Default)' },
    { id: '1_year', label: '1 Tahun' },
    { id: 'custom', label: 'Periode Khusus' },
  ];

  return (
    <div className="space-y-3.5 w-full overflow-hidden">
      {/* 1. PILIHAN KLASIFIKASI PERIODE */}
      <div className="relative group">
        <button
          type="button"
          onClick={() => scrollPeriod('left')}
          className="hidden md:flex absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-7 h-7 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xs border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-full items-center justify-center shadow-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95"
          title="Geser ke kiri"
        >
          <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
        </button>

        <div
          ref={scrollContainerRef}
          onWheel={handlePeriodWheel}
          className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-0.5 px-0.5 text-xs scroll-smooth no-scrollbar"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {periodOptions.map((tab) => {
            const isSelected = selectedDurationFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedDurationFilter(tab.id)}
                className={`shrink-0 whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all select-none ${
                  isSelected
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs scale-[1.02]'
                    : 'bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => scrollPeriod('right')}
          className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-7 h-7 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xs border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-full items-center justify-center shadow-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95"
          title="Geser ke kanan"
        >
          <ChevronRight className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>

      {/* 2. DAFTAR KOTAKAN ANGGARAN */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs divide-y divide-slate-100 dark:divide-slate-800">
        {filteredBudgets.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500">
              <PiggyBank className="w-6 h-6 stroke-[1.75]" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-3">
              Tidak ada anggaran pada klasifikasi periode ini.
            </p>
            <button
              type="button"
              onClick={onAddNewBudget}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Tambah Anggaran Baru</span>
            </button>
          </div>
        ) : (
          <>
            {filteredBudgets.map((b) => {
              const category = categories.find((c) => c.id === b.categoryId);
              const budgetName = (b as any).name || category?.name || 'Anggaran Kategori';
              const spent = getCategorySpent(b);
              const totalEffectiveBudget = b.limitAmount + (b.rolloverAmount || 0);
              const remaining = Math.max(0, totalEffectiveBudget - spent);
              const percent = Math.min(100, Math.round((spent / totalEffectiveBudget) * 100));
              const isOver = spent > totalEffectiveBudget;

              const matchedAccount = accounts.find((a) => a.id === b.accountId);
              const accountLabel = b.accountId === 'all' || !b.accountId ? 'Semua Rekening' : (matchedAccount?.name || 'Rekening Khusus');

              return (
                <div
                  key={b.id}
                  className="p-3.5 sm:p-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/60 transition-colors group space-y-3"
                >
                  {/* Baris Atas */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center text-white text-base font-extrabold shadow-2xs shrink-0 transition-transform group-hover:scale-105"
                        style={{ backgroundColor: category?.color || '#3B82F6' }}
                      >
                        {category?.name ? category.name.slice(0, 1).toUpperCase() : 'A'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                          {budgetName}
                        </div>

                        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-[11px]">
                            {getDurationLabel(b.duration)}
                          </span>
                          <span className="text-slate-300 dark:text-slate-600">·</span>
                          <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-[11px] truncate">
                            <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>
                              {b.startDate ? formatDateIndo(b.startDate) : 'Awal Bulan'} —{' '}
                              {b.endDate ? formatDateIndo(b.endDate) : 'Akhir Bulan'}
                            </span>
                          </div>
                          {b.accountId && b.accountId !== 'all' && (
                            <>
                              <span className="text-slate-300 dark:text-slate-600">·</span>
                              <div className="hidden sm:flex items-center gap-1 text-slate-400 text-[11px] truncate">
                                <Wallet className="w-3 h-3 shrink-0" />
                                <span>{accountLabel}</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Sisi Kanan: Nominal Sisa Anggaran & Menu Titik Tiga */}
                    <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
                      <div className="text-right">
                        <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                          {isOver ? 'Overbudget' : 'Sisa Anggaran'}
                        </span>
                        <span
                          className={`text-sm sm:text-base font-black font-mono tabular-nums ${
                            isOver ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'
                          }`}
                        >
                          {isOver
                            ? `-${formatRupiah(spent - totalEffectiveBudget)}`
                            : formatRupiah(remaining)}
                        </span>
                      </div>

                      <div className="relative">
                        <button
                          type="button"
                          onClick={() =>
                            setOpenDropdownId(openDropdownId === b.id ? null : b.id)
                          }
                          className="w-8 h-8 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl flex items-center justify-center transition-colors"
                          title="Opsi Anggaran"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {openDropdownId === b.id && (
                          <div
                            className="fixed z-50 w-44 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 text-xs animate-in fade-in"
                            style={{
                              top: 'auto',
                              left: 'auto',
                              transform: 'translate(-100%, 0.5rem)',
                            }}
                          >
                            <div
                              className="fixed inset-0 z-[-1]"
                              onClick={() => setOpenDropdownId(null)}
                            />
                            <button
                              type="button"
                              onClick={() => handleOpenRolloverModal(b)}
                              className="w-full px-3 py-2 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 font-medium"
                            >
                              <RotateCcw className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                              <span>Atur Rollover</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setOpenDropdownId(null);
                                onEditBudget(b);
                              }}
                              className="w-full px-3 py-2 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 font-medium"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                              <span>Edit Anggaran</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setOpenDropdownId(null);
                                onDeleteBudget(b.id);
                              }}
                              className="w-full px-3 py-2 text-left text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 font-medium"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                              <span>Hapus Anggaran</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar & Details */}
                  <div className="space-y-1 pt-0.5">
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isOver
                            ? 'bg-rose-500 dark:bg-rose-600'
                            : percent > 85
                            ? 'bg-amber-500 dark:bg-amber-600'
                            : 'bg-emerald-500 dark:bg-emerald-600'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono">
                      <span>
                        Terbayarkan: <strong className="text-slate-800 dark:text-slate-200 font-semibold">{formatRupiah(spent)}</strong>
                      </span>
                      <span>
                        Batas: <span className="text-slate-700 dark:text-slate-300 font-medium">{formatRupiah(totalEffectiveBudget)}</span>{' '}
                        <span className={`font-bold ${isOver ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'}`}>
                          ({percent}%)
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Rollover Modal */}
      {selectedBudgetForRollover && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
              Atur Rollover Sisa Anggaran
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Pilih tindakan untuk sisa anggaran kategori{' '}
              <strong className="text-slate-800 dark:text-slate-200">
                {categories.find((c) => c.id === selectedBudgetForRollover.categoryId)?.name}
              </strong>
              .
            </p>

            <div className="space-y-2.5 mb-5">
              <label
                onClick={() => setRolloverAction('rollover')}
                className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                  rolloverAction === 'rollover'
                    ? 'bg-blue-50/70 dark:bg-blue-950/50 border-blue-400 dark:border-blue-600 text-blue-900 dark:text-blue-100'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <RotateCcw className="w-4 h-4 mt-0.5 text-blue-600 dark:text-blue-400 shrink-0" />
                <div>
                  <div className="text-xs font-bold leading-tight">1. Rollover ke Periode Berikutnya</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Sisa dana akan diakumulasikan ke batas periode berikutnya.
                  </div>
                </div>
              </label>

              <label
                onClick={() => setRolloverAction('savings')}
                className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                  rolloverAction === 'savings'
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/50 border-emerald-400 dark:border-emerald-600 text-emerald-900 dark:text-emerald-100'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <PiggyBank className="w-4 h-4 mt-0.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div className="flex-1">
                  <div className="text-xs font-bold leading-tight">
                    2. Pindahkan ke Tabungan Bersama
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 mb-2">
                    Otomatis setorkan sisa dana ini ke salah satu target impian keluarga.
                  </div>
                  {rolloverAction === 'savings' && (
                    <select
                      value={targetGoalId}
                      onChange={(e) => setTargetGoalId(e.target.value)}
                      className="w-full p-2 text-xs rounded-lg border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                    >
                      {goals.map((g) => (
                        <option key={g.id} value={g.id}>
                          🎯 {g.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </label>

              <label
                onClick={() => setRolloverAction('reset')}
                className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                  rolloverAction === 'reset'
                    ? 'bg-slate-100 dark:bg-slate-800 border-slate-400 dark:border-slate-600 text-slate-900 dark:text-white'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <RotateCcw className="w-4 h-4 mt-0.5 text-slate-600 dark:text-slate-400 shrink-0" />
                <div>
                  <div className="text-xs font-bold leading-tight">3. Reset Anggaran</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Hapus sisa anggaran, mulai periode baru murni dengan batas standar.
                  </div>
                </div>
              </label>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedBudgetForRollover(null)}
                className="flex-1 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmRollover}
                className="flex-1 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl shadow-xs transition-colors"
              >
                Terapkan Rollover
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

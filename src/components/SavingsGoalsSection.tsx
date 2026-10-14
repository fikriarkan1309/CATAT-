import React, { useState } from 'react';
import {
  Target,
  Plus,
  Calendar,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  MoreVertical,
  CheckCircle2,
  Trash2,
  Edit2,
  Building2,
  Car,
  GraduationCap,
  Plane,
  Heart,
  PiggyBank,
  Sparkles,
  Shield,
  Gift,
  ShoppingBag,
  Landmark,
  X,
  Check,
  TrendingUp,
} from 'lucide-react';
import { Account, SharedGoal } from '../types/finance';
import { formatDateIndo, formatRupiah, formatCompactRupiah } from '../lib/formatters';

interface SavingsGoalsSectionProps {
  goals: SharedGoal[];
  accounts: Account[];
  onAddGoal: (data: {
    name: string;
    targetAmount: number;
    targetDate: string;
    icon?: string;
    color?: string;
    notes?: string;
    initialAmount?: number;
  }) => void;
  onUpdateGoal: (id: string, updates: Partial<SharedGoal>) => void;
  onDeleteGoal: (id: string) => void;
  onDepositToGoal: (goalId: string, amount: number, sourceAccountId: string) => void;
  onWithdrawFromGoal: (goalId: string, amount: number, targetAccountId: string, notes?: string) => void;
}

// 12 Line Icons with single-color style (no emojis)
const AVAILABLE_GOAL_ICONS = [
  { name: 'PiggyBank', label: 'Celengan', icon: PiggyBank },
  { name: 'Target', label: 'Target', icon: Target },
  { name: 'Building2', label: 'Rumah', icon: Building2 },
  { name: 'Car', label: 'Kendaraan', icon: Car },
  { name: 'GraduationCap', label: 'Pendidikan', icon: GraduationCap },
  { name: 'Plane', label: 'Liburan', icon: Plane },
  { name: 'Heart', label: 'Keluarga', icon: Heart },
  { name: 'Sparkles', label: 'Ibadah', icon: Sparkles },
  { name: 'Wallet', label: 'Tabungan', icon: Wallet },
  { name: 'Landmark', label: 'Investasi', icon: Landmark },
  { name: 'Shield', label: 'Darurat', icon: Shield },
  { name: 'Gift', label: 'Hadiah', icon: Gift },
  { name: 'ShoppingBag', label: 'Impian', icon: ShoppingBag },
  { name: 'TrendingUp', label: 'Bisnis', icon: TrendingUp },
];

const PALETTE_COLORS = [
  '#10B981', // Emerald
  '#3B82F6', // Blue
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#14B8A6', // Teal
  '#F97316', // Orange
  '#6366F1', // Indigo
  '#475569', // Slate
  '#84CC16', // Lime
];

export const SavingsGoalsSection: React.FC<SavingsGoalsSectionProps> = ({
  goals,
  accounts,
  onAddGoal,
  onUpdateGoal,
  onDeleteGoal,
  onDepositToGoal,
  onWithdrawFromGoal,
}) => {
  // Filter state
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  // Modal State for Add / Edit
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SharedGoal | null>(null);
  const [name, setName] = useState('');
  const [targetAmountStr, setTargetAmountStr] = useState('');
  const [initialAmountStr, setInitialAmountStr] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('PiggyBank');
  const [selectedColor, setSelectedColor] = useState('#10B981');
  const [notes, setNotes] = useState('');

  // Modal State for Deposit (Nabung) / Withdraw (Tarik Dana)
  const [actionModal, setActionModal] = useState<{
    goal: SharedGoal;
    type: 'deposit' | 'withdraw';
  } | null>(null);
  const [actionAmountStr, setActionAmountStr] = useState('');
  const [actionAccountId, setActionAccountId] = useState(accounts[0]?.id || '');
  const [actionNotes, setActionNotes] = useState('');

  // Dropdown menu state
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Stats calculation
  const totalTarget = goals.reduce((acc, g) => acc + g.targetAmount, 0);
  const totalCurrent = goals.reduce((acc, g) => acc + g.currentAmount, 0);
  const totalPercentage = totalTarget > 0 ? Math.min(100, Math.round((totalCurrent / totalTarget) * 100)) : 0;
  const completedCount = goals.filter((g) => g.currentAmount >= g.targetAmount).length;
  const activeCount = goals.length - completedCount;

  const filteredGoals = goals.filter((g) => {
    const isDone = g.currentAmount >= g.targetAmount;
    if (filter === 'completed') return isDone;
    if (filter === 'active') return !isDone;
    return true;
  });

  const handleOpenAdd = () => {
    setEditingGoal(null);
    setName('');
    setTargetAmountStr('');
    setInitialAmountStr('');
    setTargetDate(new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().slice(0, 10));
    setSelectedIcon('PiggyBank');
    setSelectedColor('#10B981');
    setNotes('');
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (goal: SharedGoal) => {
    setEditingGoal(goal);
    setName(goal.name);
    setTargetAmountStr(goal.targetAmount.toString());
    setInitialAmountStr(goal.currentAmount.toString());
    setTargetDate(goal.targetDate);
    setSelectedIcon(goal.icon || 'PiggyBank');
    setSelectedColor(goal.color || '#10B981');
    setNotes(goal.notes || '');
    setActiveMenuId(null);
    setIsFormModalOpen(true);
  };

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const tAmount = parseFloat(targetAmountStr.replace(/[^0-9]/g, ''));
    if (!name.trim() || !tAmount || tAmount <= 0) return;

    if (editingGoal) {
      onUpdateGoal(editingGoal.id, {
        name: name.trim(),
        targetAmount: tAmount,
        targetDate,
        icon: selectedIcon,
        color: selectedColor,
        notes: notes.trim(),
      });
    } else {
      const initAmount = parseFloat(initialAmountStr.replace(/[^0-9]/g, '')) || 0;
      onAddGoal({
        name: name.trim(),
        targetAmount: tAmount,
        targetDate,
        icon: selectedIcon,
        color: selectedColor,
        notes: notes.trim(),
        initialAmount: initAmount,
      });
    }

    setIsFormModalOpen(false);
  };

  const handleOpenAction = (goal: SharedGoal, type: 'deposit' | 'withdraw') => {
    setActionModal({ goal, type });
    setActionAmountStr('');
    setActionAccountId(accounts[0]?.id || '');
    setActionNotes('');
    setActiveMenuId(null);
  };

  const handleSubmitAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionModal) return;
    const amountVal = parseFloat(actionAmountStr.replace(/[^0-9]/g, ''));
    if (!amountVal || amountVal <= 0) return;

    if (actionModal.type === 'deposit') {
      onDepositToGoal(actionModal.goal.id, amountVal, actionAccountId);
    } else {
      onWithdrawFromGoal(actionModal.goal.id, amountVal, actionAccountId, actionNotes);
    }

    setActionModal(null);
  };

  const renderGoalIcon = (iconName: string, className = 'w-5 h-5') => {
    const found = AVAILABLE_GOAL_ICONS.find((item) => item.name === iconName);
    const IconComp = found ? found.icon : Target;
    return <IconComp className={className} />;
  };

  return (
    <div className="space-y-3.5 max-w-4xl mx-auto w-full overflow-hidden">
      {/* 1. TOP CARD SUMMARY (Ramping & Seragam dengan Rekening & Anggaran) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 p-3.5 sm:p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          {/* Sisi Kiri: Total & Nominal Utama */}
          <div className="min-w-0">
            <span className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 block truncate">
              Total Dana Tabungan Terkumpul
            </span>
            <div className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight mt-0.5 truncate">
              {formatRupiah(totalCurrent)}
            </div>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 block truncate">
              {goals.length} target · {completedCount} tercapai ({totalPercentage}%)
            </span>
          </div>

          {/* Sisi Kanan: Target & Tombol Tambah Target */}
          <div className="pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800 sm:border-l sm:pl-6 flex items-center justify-between sm:justify-end gap-3 flex-wrap">
            <div className="text-right">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
                <span>Total Target</span>
              </div>
              <span className="font-mono font-bold text-slate-900 dark:text-white text-xs sm:text-base block mt-0.5">
                {formatRupiah(totalTarget)}
              </span>
            </div>

            <button
              type="button"
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs shrink-0"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Tambah Target</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. FILTER PILLS */}
      <div className="flex items-center justify-between">
        <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === 'all'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Semua ({goals.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('active')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === 'active'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Berjalan ({activeCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('completed')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === 'completed'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Tercapai ({completedCount})
          </button>
        </div>
      </div>

      {/* 3. DAFTAR KOTAKAN TARGET TABUNGAN (Ramping, Rapi, One-Color Line Icons) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs divide-y divide-slate-100 dark:divide-slate-800/80 overflow-hidden">
        {filteredGoals.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500">
              <PiggyBank className="w-6 h-6 stroke-[1.75]" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-3">
              Belum ada target tabungan terdaftar.
            </p>
            <button
              type="button"
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Tambah Target Baru</span>
            </button>
          </div>
        ) : (
          filteredGoals.map((goal) => {
            const progress = Math.min(100, Math.round((goal.currentAmount / (goal.targetAmount || 1)) * 100));
            const isDone = goal.currentAmount >= goal.targetAmount;
            const daysLeft = Math.ceil(
              (new Date(goal.targetDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24)
            );
            const goalBgColor = goal.color || '#10B981';

            return (
              <div
                key={goal.id}
                className="p-3 sm:p-3.5 hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors group space-y-2.5"
              >
                {/* Main Row: Icon + Title/Subtitle (Left) and Amounts + Actions (Right) */}
                <div className="flex items-center justify-between gap-2.5 min-w-0">
                  {/* Sisi Kiri: One-Color Line Icon on Background Color + Nama Target */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center text-white shadow-2xs shrink-0 transition-transform group-hover:scale-105"
                      style={{ backgroundColor: goalBgColor }}
                    >
                      {renderGoalIcon(goal.icon, 'w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]')}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors truncate">
                        {goal.name}
                      </div>

                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5 mt-0.5 truncate">
                        {isDone ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold shrink-0">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Tercapai</span>
                          </span>
                        ) : daysLeft > 0 ? (
                          <span className="text-slate-500 dark:text-slate-400 shrink-0">
                            Sisa {daysLeft} hari
                          </span>
                        ) : (
                          <span className="text-rose-500 font-medium shrink-0">
                            Lewat tempo
                          </span>
                        )}

                        <span className="text-slate-300 dark:text-slate-600">·</span>
                        <span className="truncate">
                          {goal.targetDate ? formatDateIndo(goal.targetDate) : 'Fleksibel'}
                        </span>

                        {goal.notes && (
                          <>
                            <span className="text-slate-300 dark:text-slate-600 hidden sm:inline">·</span>
                            <span className="text-slate-400 truncate max-w-[130px] hidden sm:inline italic">
                              "{goal.notes}"
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Sisi Kanan: Action Buttons (Desktop), Nominal & Menu Titik Tiga */}
                  <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    {/* Quick Desktop Buttons (hidden on mobile to keep compact & neat) */}
                    <div className="hidden md:flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenAction(goal, 'deposit')}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/80 text-emerald-700 dark:text-emerald-300 text-xs font-bold transition-colors"
                        title="Setor Tabungan"
                      >
                        <ArrowDownLeft className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Nabung</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenAction(goal, 'withdraw')}
                        disabled={goal.currentAmount <= 0}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors disabled:opacity-40"
                        title="Tarik ke Rekening"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        <span>Tarik</span>
                      </button>
                    </div>

                    {/* Nominal Terkumpul & Target */}
                    <div className="text-right">
                      <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white font-mono tabular-nums block leading-tight">
                        {formatRupiah(goal.currentAmount)}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono block leading-tight mt-0.5">
                        {progress}% dari {formatCompactRupiah(goal.targetAmount)}
                      </span>
                    </div>

                    {/* Kebab Menu Button & Dropdown */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setActiveMenuId(activeMenuId === goal.id ? null : goal.id)}
                        className="w-7 h-7 sm:w-8 sm:h-8 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center justify-center transition-colors"
                        title="Opsi Target"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {activeMenuId === goal.id && (
                        <div
                          className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-1 z-30 animate-in fade-in zoom-in-95"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => handleOpenAction(goal, 'deposit')}
                            className="w-full px-3 py-2 text-left text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 flex items-center gap-2"
                          >
                            <ArrowDownLeft className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>Setor / Nabung</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenAction(goal, 'withdraw')}
                            disabled={goal.currentAmount <= 0}
                            className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 disabled:opacity-40"
                          >
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            <span>Tarik ke Rekening</span>
                          </button>

                          <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                          <button
                            type="button"
                            onClick={() => handleOpenEdit(goal)}
                            className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Edit Target</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Hapus target "${goal.name}"?`)) {
                                onDeleteGoal(goal.id);
                              }
                              setActiveMenuId(null);
                            }}
                            className="w-full px-3 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Hapus Target</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Progress Bar Ramping (Identik dengan Budget & Rekening) */}
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isDone ? 'bg-emerald-500' : 'bg-slate-900 dark:bg-white'
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: TAMBAH / EDIT TARGET TABUNGAN (PILIH ICON & WARNA SATU TEMA) */}
      {/* ========================================================================= */}
      {isFormModalOpen && (
        <div
          onClick={() => setIsFormModalOpen(false)}
          className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95"
          >
            {/* Header */}
            <div className="shrink-0 px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {editingGoal ? 'Edit Target Tabungan' : 'Tambah Target Tabungan'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Tentukan target dana, warna background dan ikon representatif
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Body Scrollable */}
            <form onSubmit={handleSaveGoal} id="goalForm" className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {/* Nama Target */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Nama Target</label>
                <input
                  type="text"
                  placeholder="Misal: Beli Mobil Listrik, Renovasi Dapur, Biaya Kuliah"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                  className="w-full mt-1 p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              {/* Target Nominal & Saldo Awal */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Target (Rp)</label>
                  <input
                    type="number"
                    placeholder="10000000"
                    value={targetAmountStr}
                    onChange={(e) => setTargetAmountStr(e.target.value)}
                    required
                    className="w-full mt-1 p-2.5 text-xs font-mono font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {editingGoal ? 'Saldo Terkumpul' : 'Saldo Awal (Opsional)'}
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={initialAmountStr}
                    onChange={(e) => setInitialAmountStr(e.target.value)}
                    className="w-full mt-1 p-2.5 text-xs font-mono font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              {/* Tenggat Waktu / Target Date */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Target Tercapai</label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  required
                  className="w-full mt-1 p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              {/* Pilih Warna Background (Satu Warna / Solid Color Theme) */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Warna Background Ikon
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {PALETTE_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSelectedColor(c)}
                      className="w-7 h-7 rounded-full flex items-center justify-center transition-transform hover:scale-110 relative shrink-0 shadow-2xs"
                      style={{ backgroundColor: c }}
                      title={c}
                    >
                      {selectedColor === c && (
                        <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pilih Ikon Line (Lucide Single Color Icon - Persis Kategori) */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Pilih Ikon Line
                </label>
                <div className="grid grid-cols-7 gap-2 max-h-36 overflow-y-auto p-1 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-800/40">
                  {AVAILABLE_GOAL_ICONS.map((item) => {
                    const isSelected = selectedIcon === item.name;
                    const IconComp = item.icon;
                    return (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => setSelectedIcon(item.name)}
                        className={`p-2 rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${
                          isSelected
                            ? 'text-white shadow-xs scale-105'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
                        }`}
                        style={isSelected ? { backgroundColor: selectedColor } : {}}
                        title={item.label}
                      >
                        <IconComp className="w-4 h-4 stroke-[2.2]" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Catatan / Keterangan */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Catatan / Keterangan</label>
                <input
                  type="text"
                  placeholder="Misal: Alokasi tabungan bulanan 1.5jt via BCA"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full mt-1 p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>
            </form>

            {/* Footer Sticky */}
            <div className="shrink-0 px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                form="goalForm"
                className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-all shadow-xs"
              >
                {editingGoal ? 'Simpan Perubahan' : 'Buat Target Baru'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: SETOR (NABUNG) / TARIK DANA */}
      {/* ========================================================================= */}
      {actionModal && (
        <div
          onClick={() => setActionModal(null)}
          className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95"
          >
            {/* Header */}
            <div className="shrink-0 px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  {actionModal.type === 'deposit' ? (
                    <>
                      <ArrowDownLeft className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
                      <span>Setor Tabungan</span>
                    </>
                  ) : (
                    <>
                      <ArrowUpRight className="w-4 h-4 text-blue-600 stroke-[2.5]" />
                      <span>Tarik Dana Tabungan</span>
                    </>
                  )}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                  Target: {actionModal.goal.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActionModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmitAction} id="actionForm" className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Nominal (Rp)</label>
                <input
                  type="number"
                  placeholder="500000"
                  value={actionAmountStr}
                  onChange={(e) => setActionAmountStr(e.target.value)}
                  required
                  autoFocus
                  className="w-full mt-1 p-2.5 text-base font-bold font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {actionModal.type === 'deposit' ? 'Sumber Rekening (Debet)' : 'Tujuan Rekening (Kredit)'}
                </label>
                <select
                  value={actionAccountId}
                  onChange={(e) => setActionAccountId(e.target.value)}
                  required
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
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Catatan Mutasi</label>
                <input
                  type="text"
                  placeholder={
                    actionModal.type === 'deposit'
                      ? 'Nabung alokasi bonus / gaji bulanan'
                      : 'Tarik dana untuk keperluan darurat'
                  }
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  className="w-full mt-1 p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </form>

            {/* Footer Sticky */}
            <div className="shrink-0 px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setActionModal(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                form="actionForm"
                className={`px-5 py-2 text-xs font-bold text-white rounded-xl transition-all shadow-xs ${
                  actionModal.type === 'deposit'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {actionModal.type === 'deposit' ? 'Konfirmasi Setor' : 'Konfirmasi Tarik'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

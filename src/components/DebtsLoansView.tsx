import React, { useState } from 'react';
import {
  HandCoins,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  Phone,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  Edit2,
  Trash2,
  X,
  CreditCard,
  History,
  Clock,
  Wallet,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Account, DebtItem, DebtPayment, DebtType } from '../types/finance';
import { formatDateIndo, formatRupiah, formatCompactRupiah } from '../lib/formatters';

interface DebtsLoansViewProps {
  debts: DebtItem[];
  accounts: Account[];
  onAddDebt: (data: {
    type: DebtType;
    personName: string;
    phone?: string;
    totalAmount: number;
    initialPaid?: number;
    startDate: string;
    dueDate?: string;
    notes?: string;
  }) => void;
  onUpdateDebt: (id: string, updates: Partial<DebtItem>) => void;
  onDeleteDebt: (id: string) => void;
  onRecordPayment: (
    debtId: string,
    payment: {
      amount: number;
      accountId?: string;
      notes?: string;
      date?: string;
    }
  ) => void;
}

export const DebtsLoansView: React.FC<DebtsLoansViewProps> = ({
  debts,
  accounts,
  onAddDebt,
  onUpdateDebt,
  onDeleteDebt,
  onRecordPayment,
}) => {
  // Main Tab: 'debt' (Hutang Saya) | 'receivable' (Piutang Saya)
  const [activeType, setActiveType] = useState<DebtType>('debt');

  // Status Filter: 'all' | 'active' | 'settled'
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'settled'>('all');

  // Form Modal State (Tambah / Edit)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<DebtItem | null>(null);
  const [personName, setPersonName] = useState('');
  const [phone, setPhone] = useState('');
  const [totalAmountStr, setTotalAmountStr] = useState('');
  const [initialPaidStr, setInitialPaidStr] = useState('');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [formDebtType, setFormDebtType] = useState<DebtType>('debt');

  // Payment Recording Modal State
  const [paymentModalDebt, setPaymentModalDebt] = useState<DebtItem | null>(null);
  const [payAmountStr, setPayAmountStr] = useState('');
  const [payAccountId, setPayAccountId] = useState(accounts[0]?.id || '');
  const [payNotes, setPayNotes] = useState('');
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10));

  // Expanded Payment History Accordion State
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);

  // Kebab dropdown menu state
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Filtered lists
  const myDebts = debts.filter((d) => d.type === 'debt');
  const myReceivables = debts.filter((d) => d.type === 'receivable');

  const totalMyDebtsRemaining = myDebts.reduce(
    (acc, d) => acc + Math.max(0, d.totalAmount - d.paidAmount),
    0
  );
  const totalMyReceivablesRemaining = myReceivables.reduce(
    (acc, d) => acc + Math.max(0, d.totalAmount - d.paidAmount),
    0
  );
  const netPosition = totalMyReceivablesRemaining - totalMyDebtsRemaining;

  const currentList = debts
    .filter((d) => d.type === activeType)
    .filter((d) => {
      const isSettled = d.status === 'settled' || d.paidAmount >= d.totalAmount;
      if (statusFilter === 'active') return !isSettled;
      if (statusFilter === 'settled') return isSettled;
      return true;
    });

  const handleOpenAdd = (type: DebtType) => {
    setEditingDebt(null);
    setFormDebtType(type);
    setPersonName('');
    setPhone('');
    setTotalAmountStr('');
    setInitialPaidStr('');
    setStartDate(new Date().toISOString().slice(0, 10));
    setDueDate('');
    setNotes('');
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (debt: DebtItem) => {
    setEditingDebt(debt);
    setFormDebtType(debt.type);
    setPersonName(debt.personName);
    setPhone(debt.phone || '');
    setTotalAmountStr(debt.totalAmount.toString());
    setInitialPaidStr(debt.paidAmount.toString());
    setStartDate(debt.startDate);
    setDueDate(debt.dueDate || '');
    setNotes(debt.notes || '');
    setActiveMenuId(null);
    setIsFormModalOpen(true);
  };

  const handleSaveDebt = (e: React.FormEvent) => {
    e.preventDefault();
    const tAmount = parseFloat(totalAmountStr.replace(/[^0-9]/g, ''));
    if (!personName.trim() || !tAmount || tAmount <= 0) return;

    if (editingDebt) {
      onUpdateDebt(editingDebt.id, {
        personName: personName.trim(),
        phone: phone.trim() || undefined,
        totalAmount: tAmount,
        startDate,
        dueDate: dueDate || undefined,
        notes: notes.trim(),
        type: formDebtType,
      });
    } else {
      const initPaid = parseFloat(initialPaidStr.replace(/[^0-9]/g, '')) || 0;
      onAddDebt({
        type: formDebtType,
        personName: personName.trim(),
        phone: phone.trim() || undefined,
        totalAmount: tAmount,
        initialPaid: initPaid,
        startDate,
        dueDate: dueDate || undefined,
        notes: notes.trim(),
      });
    }

    setIsFormModalOpen(false);
  };

  const handleOpenPayModal = (debt: DebtItem) => {
    const remaining = Math.max(0, debt.totalAmount - debt.paidAmount);
    setPaymentModalDebt(debt);
    setPayAmountStr(remaining.toString());
    setPayAccountId(accounts[0]?.id || '');
    setPayNotes(
      debt.type === 'debt'
        ? `Cicilan hutang kepada ${debt.personName}`
        : `Terima pelunasan dari ${debt.personName}`
    );
    setPayDate(new Date().toISOString().slice(0, 10));
    setActiveMenuId(null);
  };

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalDebt) return;
    const amountVal = parseFloat(payAmountStr.replace(/[^0-9]/g, ''));
    if (!amountVal || amountVal <= 0) return;

    onRecordPayment(paymentModalDebt.id, {
      amount: amountVal,
      accountId: payAccountId,
      notes: payNotes,
      date: payDate,
    });

    setPaymentModalDebt(null);
  };

  return (
    <div className="space-y-3.5 max-w-4xl mx-auto w-full">
      {/* 1. TOP CARD SUMMARY (Ramping & Responsive, Tidak Melebihi Layar HP) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 p-3.5 sm:p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          {/* Sisi Kiri: Posisi Bersih & Nominal Utama */}
          <div className="min-w-0">
            <span className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 block truncate">
              Posisi Bersih Keuangan
            </span>
            <div className="text-xl sm:text-3xl font-black font-mono tracking-tight mt-0.5 truncate">
              <span className={netPosition >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                {netPosition >= 0 ? '+' : ''}{formatRupiah(netPosition)}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 block truncate">
              {netPosition >= 0 ? 'Piutang melebihi hutang (Surplus)' : 'Kewajiban hutang melebihi piutang'}
            </span>
          </div>

          {/* Sisi Kanan: Mini Metrics Hutang vs Piutang & Tombol Tambah */}
          <div className="pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800 sm:border-l sm:pl-5 flex flex-col sm:flex-row sm:items-center justify-between sm:justify-end gap-3">
            <div className="grid grid-cols-2 sm:flex sm:items-center gap-3 sm:gap-4 text-xs">
              <div>
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium">
                  <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
                  <span>Hutang Saya</span>
                </div>
                <span className="font-mono font-bold text-slate-900 dark:text-white text-xs sm:text-sm block mt-0.5 truncate">
                  {formatRupiah(totalMyDebtsRemaining)}
                </span>
              </div>

              <div>
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                  <span>Piutang Saya</span>
                </div>
                <span className="font-mono font-bold text-slate-900 dark:text-white text-xs sm:text-sm block mt-0.5 truncate">
                  {formatRupiah(totalMyReceivablesRemaining)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleOpenAdd(activeType)}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs shrink-0"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{activeType === 'debt' ? 'Catat Hutang' : 'Catat Piutang'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. SUBTAB & FILTER PILLS */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        {/* Toggle Hutang Saya vs Piutang Saya */}
        <div className="inline-flex p-1 bg-slate-200/80 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-inner">
          <button
            type="button"
            onClick={() => setActiveType('debt')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeType === 'debt'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ArrowDownRight className="w-3.5 h-3.5 text-rose-500 stroke-[2.5]" />
            <span>Hutang Saya</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500">
              {myDebts.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveType('receivable')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeType === 'receivable'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500 stroke-[2.5]" />
            <span>Piutang Saya</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500">
              {myReceivables.length}
            </span>
          </button>
        </div>

        {/* Status Filter */}
        <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              statusFilter === 'all'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Semua
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              statusFilter === 'active'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Belum Lunas
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('settled')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              statusFilter === 'settled'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Lunas
          </button>
        </div>
      </div>

      {/* 3. DAFTAR KOTAKAN HUTANG / PIUTANG (Ramping, Tuntas, Pas di Layar HP) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs divide-y divide-slate-100 dark:divide-slate-800/80">
        {currentList.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500">
              <HandCoins className="w-6 h-6 stroke-[1.75]" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-3">
              {activeType === 'debt'
                ? 'Tidak ada catatan hutang pada filter ini.'
                : 'Tidak ada catatan piutang pada filter ini.'}
            </p>
            <button
              type="button"
              onClick={() => handleOpenAdd(activeType)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{activeType === 'debt' ? 'Catat Hutang Baru' : 'Catat Piutang Baru'}</span>
            </button>
          </div>
        ) : (
          currentList.map((item) => {
            const remaining = Math.max(0, item.totalAmount - item.paidAmount);
            const progress = Math.min(100, Math.round((item.paidAmount / (item.totalAmount || 1)) * 100));
            const isSettled = item.status === 'settled' || remaining === 0;
            const hasPayments = (item.payments || []).length > 0;
            const isExpanded = expandedHistoryId === item.id;

            return (
              <div
                key={item.id}
                className={`p-3 sm:p-3.5 hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors group space-y-2.5 first:rounded-t-2xl sm:first:rounded-t-3xl last:rounded-b-2xl sm:last:rounded-b-3xl ${
                  activeMenuId === item.id ? 'relative z-40' : 'relative z-10'
                }`}
              >
                {/* Main Row: Icon + Name (Left) and Amount + Actions (Right) */}
                <div className="flex items-center justify-between gap-2.5 min-w-0">
                  {/* Sisi Kiri: Ikon + Nama Kontak */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center text-white shadow-2xs shrink-0 transition-transform group-hover:scale-105 ${
                        item.type === 'debt' ? 'bg-rose-500' : 'bg-emerald-500'
                      }`}
                    >
                      {item.type === 'debt' ? (
                        <ArrowDownRight className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors truncate">
                        {item.personName}
                      </div>

                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5 mt-0.5 truncate">
                        {isSettled ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold shrink-0">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Lunas</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold shrink-0">
                            <Clock className="w-3 h-3" />
                            <span>Sisa {formatCompactRupiah(remaining)}</span>
                          </span>
                        )}

                        <span className="text-slate-300 dark:text-slate-600">·</span>
                        <span className="truncate">{formatDateIndo(item.startDate)}</span>

                        {item.dueDate && (
                          <>
                            <span className="text-slate-300 dark:text-slate-600 hidden sm:inline">·</span>
                            <span className="text-slate-400 truncate hidden sm:inline">
                              Tempo: {formatDateIndo(item.dueDate)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Sisi Kanan: Action Button (Desktop), Nominal & Kebab Dropdown */}
                  <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    {/* Quick Desktop Buttons */}
                    <div className="hidden md:flex items-center gap-1">
                      {!isSettled && (
                        <button
                          type="button"
                          onClick={() => handleOpenPayModal(item)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                            item.type === 'debt'
                              ? 'bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                              : 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                          }`}
                          title={item.type === 'debt' ? 'Bayar Cicilan Hutang' : 'Terima Pembayaran'}
                        >
                          <CreditCard className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>{item.type === 'debt' ? 'Bayar Cicilan' : 'Terima Bayar'}</span>
                        </button>
                      )}

                      {hasPayments && (
                        <button
                          type="button"
                          onClick={() => setExpandedHistoryId(isExpanded ? null : item.id)}
                          className={`p-1.5 rounded-lg transition-colors text-xs flex items-center gap-1 ${
                            isExpanded
                              ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400'
                              : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                          title="Riwayat Cicilan"
                        >
                          <History className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-mono">{(item.payments || []).length}</span>
                        </button>
                      )}
                    </div>

                    {/* Nominal Sisa & Total */}
                    <div className="text-right">
                      <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white font-mono tabular-nums block leading-tight">
                        {formatRupiah(remaining)}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono block leading-tight mt-0.5">
                        Total {formatCompactRupiah(item.totalAmount)}
                      </span>
                    </div>

                    {/* Kebab Dropdown */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setActiveMenuId(activeMenuId === item.id ? null : item.id)}
                        className="w-7 h-7 sm:w-8 sm:h-8 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center justify-center transition-colors"
                        title="Opsi Hutang/Piutang"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {activeMenuId === item.id && (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setActiveMenuId(null)}
                          />
                          <div
                            className="absolute right-0 top-full mt-1.5 z-50 w-44 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 text-xs animate-in fade-in zoom-in-95 duration-100"
                          >
                            {!isSettled && (
                              <button
                                type="button"
                                onClick={() => handleOpenPayModal(item)}
                                className="w-full px-3 py-2 text-left text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 flex items-center gap-2"
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                                <span>{item.type === 'debt' ? 'Bayar Cicilan' : 'Terima Pembayaran'}</span>
                              </button>
                            )}

                            {hasPayments && (
                              <button
                                type="button"
                                onClick={() => {
                                  setExpandedHistoryId(isExpanded ? null : item.id);
                                  setActiveMenuId(null);
                                }}
                                className="w-full px-3 py-2 text-left text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 flex items-center gap-2"
                              >
                                <History className="w-3.5 h-3.5" />
                                <span>{isExpanded ? 'Tutup Riwayat' : 'Lihat Riwayat Cicilan'}</span>
                              </button>
                            )}

                            <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                            <button
                              type="button"
                              onClick={() => handleOpenEdit(item)}
                              className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>Edit Catatan</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Hapus catatan untuk "${item.personName}"?`)) {
                                  onDeleteDebt(item.id);
                                }
                                setActiveMenuId(null);
                              }}
                              className="w-full px-3 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Hapus Catatan</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Progress Bar Ramping */}
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isSettled
                        ? 'bg-emerald-500'
                        : item.type === 'debt'
                        ? 'bg-rose-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>

                {/* Riwayat Pembayaran Accordion (Jika Dibuka) */}
                {isExpanded && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 animate-in fade-in space-y-1.5">
                    <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center justify-between">
                      <span>Riwayat Pembayaran Cicilan</span>
                      <button
                        type="button"
                        onClick={() => setExpandedHistoryId(null)}
                        className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                      >
                        Tutup
                      </button>
                    </div>

                    {(item.payments || []).map((p) => {
                      const acc = accounts.find((a) => a.id === p.accountId);
                      return (
                        <div
                          key={p.id}
                          className="p-2 rounded-xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs"
                        >
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                              {p.notes || 'Pembayaran cicilan'}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                              {formatDateIndo(p.date)} {acc && `· Rekening ${acc.name}`}
                            </div>
                          </div>
                          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                            +{formatRupiah(p.amount)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: TAMBAH / EDIT HUTANG ATAU PIUTANG */}
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
            <div className="shrink-0 px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {editingDebt
                    ? formDebtType === 'debt'
                      ? 'Edit Catatan Hutang'
                      : 'Edit Catatan Piutang'
                    : formDebtType === 'debt'
                    ? 'Catat Hutang Baru'
                    : 'Catat Piutang Baru'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {formDebtType === 'debt'
                    ? 'Kewajiban uang yang harus Anda bayarkan kepada orang lain'
                    : 'Uang Anda yang dipinjam oleh orang lain dan harus ditagih'}
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

            <form onSubmit={handleSaveDebt} id="debtForm" className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {formDebtType === 'debt' ? 'Nama Pemberi Pinjaman / Kreditur' : 'Nama Peminjam / Debitur'}
                </label>
                <input
                  type="text"
                  placeholder="Misal: Mas Hendra, Toko Bangunan Berkah, Bibi Siti"
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  required
                  autoFocus
                  className="w-full mt-1 p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">No. HP / WhatsApp (Opsional)</label>
                <input
                  type="tel"
                  placeholder="Misal: 08123456789"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full mt-1 p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Total Nominal (Rp)</label>
                  <input
                    type="number"
                    placeholder="1000000"
                    value={totalAmountStr}
                    onChange={(e) => setTotalAmountStr(e.target.value)}
                    required
                    className="w-full mt-1 p-2.5 text-xs font-mono font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {editingDebt ? 'Sudah Terbayar' : 'Dibayar di Muka (Opsional)'}
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={initialPaidStr}
                    onChange={(e) => setInitialPaidStr(e.target.value)}
                    className="w-full mt-1 p-2.5 text-xs font-mono font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Tanggal Mulai Pinjam</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="w-full mt-1 p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Jatuh Tempo (Opsional)</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full mt-1 p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Catatan / Alasan Pinjaman</label>
                <input
                  type="text"
                  placeholder="Misal: Tambahan semen & keramik kamar mandi"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full mt-1 p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>
            </form>

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
                form="debtForm"
                className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-all shadow-xs"
              >
                {editingDebt ? 'Simpan Perubahan' : 'Simpan Catatan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CATAT PEMBAYARAN CICILAN */}
      {/* ========================================================================= */}
      {paymentModalDebt && (
        <div
          onClick={() => setPaymentModalDebt(null)}
          className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95"
          >
            <div className="shrink-0 px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  <span>
                    {paymentModalDebt.type === 'debt' ? 'Bayar Cicilan Hutang' : 'Terima Pembayaran Piutang'}
                  </span>
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                  Kontak: {paymentModalDebt.personName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPaymentModalDebt(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmPayment} id="payDebtForm" className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Nominal Pembayaran (Rp)</label>
                <input
                  type="number"
                  placeholder="500000"
                  value={payAmountStr}
                  onChange={(e) => setPayAmountStr(e.target.value)}
                  required
                  autoFocus
                  className="w-full mt-1 p-2.5 text-base font-bold font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {paymentModalDebt.type === 'debt' ? 'Rekening Sumber Dana' : 'Rekening Penerima Dana'}
                </label>
                <select
                  value={payAccountId}
                  onChange={(e) => setPayAccountId(e.target.value)}
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
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Tanggal Pembayaran</label>
                <input
                  type="date"
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                  required
                  className="w-full mt-1 p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Catatan Pembayaran</label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full mt-1 p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </form>

            <div className="shrink-0 px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setPaymentModalDebt(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                form="payDebtForm"
                className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-all shadow-xs"
              >
                Konfirmasi Pembayaran
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

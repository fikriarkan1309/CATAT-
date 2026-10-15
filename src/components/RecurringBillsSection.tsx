import React, { useState } from 'react';
import {
  Receipt,
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  CreditCard,
  MoreVertical,
  Edit2,
  Trash2,
  X,
  Zap,
  RotateCcw,
  Tag,
  Wallet,
} from 'lucide-react';
import { Account, Category, RecurringBill } from '../types/finance';
import { formatDateIndo, formatRupiah, formatCompactRupiah } from '../lib/formatters';

interface RecurringBillsSectionProps {
  bills: RecurringBill[];
  accounts: Account[];
  categories: Category[];
  onAddBill: (data: {
    name: string;
    amount: number;
    categoryId: string;
    accountId?: string;
    dueDay: number;
    frequency?: 'monthly' | 'weekly' | 'yearly';
    notes?: string;
  }) => void;
  onUpdateBill: (id: string, updates: Partial<RecurringBill>) => void;
  onDeleteBill: (id: string) => void;
  onPayBill: (billId: string, accountId: string, notes?: string) => void;
  onUnpayBill: (billId: string, monthStr?: string) => void;
}

export const RecurringBillsSection: React.FC<RecurringBillsSectionProps> = ({
  bills,
  accounts,
  categories,
  onAddBill,
  onUpdateBill,
  onDeleteBill,
  onPayBill,
  onUnpayBill,
}) => {
  const currentMonth = new Date().toISOString().slice(0, 7); // 'YYYY-MM'
  const currentDay = new Date().getDate();

  // Filter state: 'all' | 'unpaid' | 'paid'
  const [filter, setFilter] = useState<'all' | 'unpaid' | 'paid'>('all');

  // Form modal state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<RecurringBill | null>(null);
  const [name, setName] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [dueDay, setDueDay] = useState<number>(10);
  const [frequency, setFrequency] = useState<'monthly' | 'weekly' | 'yearly'>('monthly');
  const [notes, setNotes] = useState('');

  // Payment confirmation modal
  const [payingBill, setPayingBill] = useState<RecurringBill | null>(null);
  const [payAccountId, setPayAccountId] = useState('');
  const [payNotes, setPayNotes] = useState('');

  // Menu popover
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Statistics
  const totalAmount = bills.reduce((acc, b) => acc + b.amount, 0);
  const paidBills = bills.filter((b) => b.paidMonths?.includes(currentMonth));
  const unpaidBills = bills.filter((b) => !b.paidMonths?.includes(currentMonth));
  const totalPaidAmount = paidBills.reduce((acc, b) => acc + b.amount, 0);
  const totalUnpaidAmount = unpaidBills.reduce((acc, b) => acc + b.amount, 0);

  const filteredBills = bills.filter((b) => {
    const isPaid = b.paidMonths?.includes(currentMonth);
    if (filter === 'paid') return isPaid;
    if (filter === 'unpaid') return !isPaid;
    return true;
  });

  const handleOpenAdd = () => {
    setEditingBill(null);
    setName('');
    setAmountStr('');
    setCategoryId(categories.find((c) => c.type === 'expense')?.id || categories[0]?.id || '');
    setAccountId(accounts[0]?.id || '');
    setDueDay(15);
    setFrequency('monthly');
    setNotes('');
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (bill: RecurringBill) => {
    setEditingBill(bill);
    setName(bill.name);
    setAmountStr(bill.amount.toString());
    setCategoryId(bill.categoryId);
    setAccountId(bill.accountId || accounts[0]?.id || '');
    setDueDay(bill.dueDay);
    setFrequency(bill.frequency);
    setNotes(bill.notes || '');
    setActiveMenuId(null);
    setIsFormModalOpen(true);
  };

  const handleSaveBill = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(amountStr.replace(/[^0-9]/g, ''));
    if (!name.trim() || !amountVal || amountVal <= 0) return;

    if (editingBill) {
      onUpdateBill(editingBill.id, {
        name: name.trim(),
        amount: amountVal,
        categoryId,
        accountId: accountId || undefined,
        dueDay,
        frequency,
        notes: notes.trim(),
      });
    } else {
      onAddBill({
        name: name.trim(),
        amount: amountVal,
        categoryId,
        accountId: accountId || undefined,
        dueDay,
        frequency,
        notes: notes.trim(),
      });
    }

    setIsFormModalOpen(false);
  };

  const handleOpenPay = (bill: RecurringBill) => {
    setPayingBill(bill);
    setPayAccountId(bill.accountId || accounts[0]?.id || '');
    setPayNotes(`Pembayaran rutin ${bill.name} periode ${currentMonth}`);
    setActiveMenuId(null);
  };

  const handleConfirmPay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingBill) return;
    onPayBill(payingBill.id, payAccountId, payNotes);
    setPayingBill(null);
  };

  const handleToggleUnpay = (bill: RecurringBill) => {
    if (confirm(`Batalkan status lunas "${bill.name}" untuk bulan ini?`)) {
      onUnpayBill(bill.id, currentMonth);
    }
    setActiveMenuId(null);
  };

  const getDueStatus = (day: number, isPaid: boolean) => {
    if (isPaid) {
      return {
        label: 'Lunas',
        color: 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60',
        icon: CheckCircle2,
      };
    }
    const diff = day - currentDay;
    if (diff < 0) {
      return {
        label: 'Lewat tempo',
        color: 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60',
        icon: AlertCircle,
      };
    }
    if (diff <= 3) {
      return {
        label: `Sisa ${diff} hari`,
        color: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60',
        icon: Clock,
      };
    }
    return {
      label: `Tgl ${day}`,
      color: 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800',
      icon: Calendar,
    };
  };

  return (
    <div className="space-y-3.5 max-w-4xl mx-auto w-full overflow-hidden">
      {/* 1. TOP CARD SUMMARY (Ramping & Seragam dengan Rekening) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 p-3.5 sm:p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          {/* Sisi Kiri: Total & Nominal Utama */}
          <div className="min-w-0">
            <span className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 block truncate">
              Total Tagihan Rutin Bulan Ini
            </span>
            <div className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight mt-0.5 truncate">
              {formatRupiah(totalAmount)}
            </div>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 block truncate">
              {bills.length} tagihan · {paidBills.length} lunas · {unpaidBills.length} belum bayar
            </span>
          </div>

          {/* Sisi Kanan: Sisa Belum Bayar & Tombol Tambah */}
          <div className="pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800 sm:border-l sm:pl-6 flex items-center justify-between sm:justify-end gap-3 flex-wrap">
            <div className="text-right">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0"></span>
                <span>Belum Terbayar</span>
              </div>
              <span className="font-mono font-bold text-slate-900 dark:text-white text-xs sm:text-base block mt-0.5">
                {formatRupiah(totalUnpaidAmount)}
              </span>
            </div>

            <button
              type="button"
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs shrink-0"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Tambah Tagihan</span>
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
            Semua ({bills.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('unpaid')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === 'unpaid'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Belum Lunas ({unpaidBills.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('paid')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === 'paid'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Lunas ({paidBills.length})
          </button>
        </div>
      </div>

      {/* 3. DAFTAR KOTAKAN TAGIHAN (Ramping, Rapi, Sesuai Rekening & Anggaran) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs divide-y divide-slate-100 dark:divide-slate-800/80">
        {filteredBills.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500">
              <Receipt className="w-6 h-6 stroke-[1.75]" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-3">
              Belum ada data tagihan rutin pada filter ini.
            </p>
            <button
              type="button"
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Tambah Tagihan Baru</span>
            </button>
          </div>
        ) : (
          filteredBills.map((bill) => {
            const isPaid = bill.paidMonths?.includes(currentMonth);
            const status = getDueStatus(bill.dueDay, isPaid);
            const StatusIcon = status.icon;
            const account = accounts.find((a) => a.id === bill.accountId);
            const category = categories.find((c) => c.id === bill.categoryId);

            return (
              <div
                key={bill.id}
                className="p-3 sm:p-3.5 hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors group flex items-center justify-between gap-2.5 min-w-0"
              >
                {/* Sisi Kiri: Ikon Kategori + Nama & Keterangan Ramping */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center text-white shadow-2xs shrink-0 transition-transform group-hover:scale-105"
                    style={{ backgroundColor: category?.color || '#F59E0B' }}
                  >
                    <Receipt className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors truncate">
                      {bill.name}
                    </div>

                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5 mt-0.5 truncate">
                      <span className={`inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold gap-0.5 shrink-0 ${status.color}`}>
                        <StatusIcon className="w-2.5 h-2.5" />
                        <span>{status.label}</span>
                      </span>

                      <span className="text-slate-300 dark:text-slate-600">·</span>
                      <span className="truncate">{category?.name || 'Rutin'}</span>

                      {account && (
                        <>
                          <span className="text-slate-300 dark:text-slate-600 hidden sm:inline">·</span>
                          <span className="text-slate-400 truncate max-w-[120px] hidden sm:inline">
                            {account.name}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sisi Kanan: Action Button (Desktop), Nominal & Kebab Menu */}
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                  {/* Quick Action Button (Desktop) */}
                  <div className="hidden md:flex items-center">
                    {!isPaid ? (
                      <button
                        type="button"
                        onClick={() => handleOpenPay(bill)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/80 text-emerald-700 dark:text-emerald-300 text-xs font-bold transition-colors"
                        title="Bayar Tagihan Sekarang"
                      >
                        <CreditCard className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Bayar</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleToggleUnpay(bill)}
                        className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 text-[11px] font-medium transition-colors"
                        title="Batalkan Status Lunas"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Batal Lunas</span>
                      </button>
                    )}
                  </div>

                  {/* Nominal Tagihan */}
                  <div className="text-right">
                    <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white font-mono tabular-nums block leading-tight">
                      {formatRupiah(bill.amount)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono block leading-tight mt-0.5">
                      Tgl {bill.dueDay} / bln
                    </span>
                  </div>

                  {/* Kebab Dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setActiveMenuId(activeMenuId === bill.id ? null : bill.id)}
                      className="w-7 h-7 sm:w-8 sm:h-8 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center justify-center transition-colors"
                      title="Opsi Tagihan"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {activeMenuId === bill.id && (
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
                          onClick={() => setActiveMenuId(null)}
                        />
                        {!isPaid ? (
                          <button
                            type="button"
                            onClick={() => handleOpenPay(bill)}
                            className="w-full px-3 py-2 text-left text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 flex items-center gap-2"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Bayar Sekarang</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleToggleUnpay(bill)}
                            className="w-full px-3 py-2 text-left text-xs font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 flex items-center gap-2"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Batal Lunas Bulan Ini</span>
                          </button>
                        )}

                        <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                        <button
                          type="button"
                          onClick={() => handleOpenEdit(bill)}
                          className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit Tagihan</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Hapus tagihan "${bill.name}"?`)) {
                              onDeleteBill(bill.id);
                            }
                            setActiveMenuId(null);
                          }}
                          className="w-full px-3 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus Tagihan</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: TAMBAH / EDIT TAGIHAN RUTIN */}
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
                  {editingBill ? 'Edit Tagihan Rutin' : 'Tambah Tagihan Rutin'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Atur pengingat kewajiban tagihan berkala setiap bulan
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

            <form onSubmit={handleSaveBill} id="billForm" className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Nama Tagihan</label>
                <input
                  type="text"
                  placeholder="Misal: Listrik PLN, WiFi Indihome, BPJS"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                  className="w-full mt-1 p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Nominal (Rp)</label>
                  <input
                    type="number"
                    placeholder="500000"
                    value={amountStr}
                    onChange={(e) => setAmountStr(e.target.value)}
                    required
                    className="w-full mt-1 p-2.5 text-xs font-mono font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Tanggal Jatuh Tempo</label>
                  <select
                    value={dueDay}
                    onChange={(e) => setDueDay(parseInt(e.target.value, 10))}
                    className="w-full mt-1 p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d}>
                        Tanggal {d} setiap bulan
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Kategori</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    required
                    className="w-full mt-1 p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Rekening Pembayaran</label>
                  <select
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full mt-1 p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="">Semua / Pilih saat bayar</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Catatan / No. Pelanggan</label>
                <input
                  type="text"
                  placeholder="Misal: ID Pelanggan 5210983271 a.n Fikri"
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
                form="billForm"
                className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-all shadow-xs"
              >
                {editingBill ? 'Simpan Perubahan' : 'Buat Tagihan Baru'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: KONFIRMASI PEMBAYARAN TAGIHAN */}
      {/* ========================================================================= */}
      {payingBill && (
        <div
          onClick={() => setPayingBill(null)}
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
                  <span>Bayar Tagihan Rutin</span>
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                  {payingBill.name} · {formatRupiah(payingBill.amount)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPayingBill(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmPay} id="payForm" className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Pilih Rekening Sumber</label>
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
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Catatan Transaksi</label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full mt-1 p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 text-xs space-y-1">
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Nominal Tagihan:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {formatRupiah(payingBill.amount)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Periode Bulan:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{currentMonth}</span>
                </div>
              </div>
            </form>

            <div className="shrink-0 px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setPayingBill(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                form="payForm"
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-xs"
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

import React, { useState, useEffect } from 'react';
import { X, CreditCard, DollarSign, Wallet, Check } from 'lucide-react';
import { Account, AccountType } from '../types/finance';
import { formatRupiah } from '../lib/formatters';

interface AccountManageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    currency: string;
    initialBalance: number;
    color?: string;
    type?: AccountType;
    accountNumber?: string;
  }) => void;
  editingAccount?: Account | null;
}

export const AccountManageModal: React.FC<AccountManageModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingAccount,
}) => {
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('IDR');
  const [initialBalanceStr, setInitialBalanceStr] = useState('');
  const [type, setType] = useState<AccountType>('bank');
  const [accountNumber, setAccountNumber] = useState('');
  const [color, setColor] = useState('#2563EB');

  useEffect(() => {
    if (editingAccount) {
      setName(editingAccount.name);
      setCurrency(editingAccount.currency || 'IDR');
      setInitialBalanceStr(editingAccount.balance.toString());
      setType(editingAccount.type);
      setAccountNumber(editingAccount.accountNumber || '');
      setColor(editingAccount.color || '#2563EB');
    } else {
      setName('');
      setCurrency('IDR');
      setInitialBalanceStr('');
      setType('bank');
      setAccountNumber('');
      setColor('#2563EB');
    }
  }, [editingAccount, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const val = parseFloat(initialBalanceStr.replace(/[^0-9]/g, '')) || 0;
    onSave({
      name: name.trim(),
      currency,
      initialBalance: val,
      color,
      type,
      accountNumber: accountNumber.trim(),
    });
    onClose();
  };

  const colors = [
    '#2563EB', // Blue
    '#0284C7', // Sky
    '#059669', // Emerald
    '#D97706', // Amber
    '#7C3AED', // Purple
    '#DC2626', // Red
    '#475569', // Slate
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-xl">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                {editingAccount ? 'Edit Rekening' : 'Tambah Rekening Baru'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Sesuai alur navigasi halaman Rekening
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
          {/* Nama Rekening = isian */}
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Nama Rekening</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: BCA Tabungan Utama / GoPay / Dompet Tunai"
              required
              autoFocus
              className="w-full mt-1 p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-600"
            />
          </div>

          {/* Tipe & Mata Uang */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Tipe Rekening</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as AccountType)}
                className="w-full mt-1 p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="bank">Bank</option>
                <option value="ewallet">E-Wallet</option>
                <option value="cash">Uang Tunai</option>
                <option value="investment">Investasi</option>
              </select>
            </div>

            {/* Mata Uang Rekening = pilihan */}
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Mata Uang</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full mt-1 p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
              >
                <option value="IDR">IDR (Rupiah)</option>
                <option value="USD">USD (Dollar)</option>
                <option value="SGD">SGD (Sing Dollar)</option>
                <option value="EUR">EUR (Euro)</option>
              </select>
            </div>
          </div>

          {/* Jumlah Awal = isian nilai */}
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Jumlah Saldo Awal</label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400 dark:text-slate-500 font-mono">
                {currency}
              </span>
              <input
                type="number"
                value={initialBalanceStr}
                onChange={(e) => setInitialBalanceStr(e.target.value)}
                placeholder="0"
                required
                className="w-full pl-12 pr-3 py-2.5 text-sm font-bold font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-600"
              />
            </div>
          </div>

          {/* Nomor Rekening (opsional) */}
          {type === 'bank' && (
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Nomor Rekening (Opsional)
              </label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="Misal: 8830192837"
                className="w-full mt-1 p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
              />
            </div>
          )}

          {/* Pilihan Warna */}
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Warna Aksen Rekening</label>
            <div className="flex items-center gap-2 mt-1.5">
              {colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full border-2 transition-transform ${
                    color === c ? 'scale-110 border-slate-900 dark:border-white' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
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
              Simpan Rekening
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

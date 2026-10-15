import React, { useState, useEffect } from 'react';
import {
  User,
  Users,
  Smartphone,
  Laptop,
  CheckCircle2,
  ShieldCheck,
  X,
  LogOut,
  Edit2,
  Check,
} from 'lucide-react';
import { RegisteredUser } from '../lib/storage';

interface UserAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  userAccount?: RegisteredUser;
  onUpdateAccountName?: (newName: string) => void;
  isOnline: boolean;
  pendingSyncCount: number;
  onLogout?: () => void;
}

export const UserAccountModal: React.FC<UserAccountModalProps> = ({
  isOpen,
  onClose,
  userAccount,
  onUpdateAccountName,
  isOnline,
  onLogout,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(userAccount?.accountName || 'Keluarga Pratama');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (userAccount?.accountName) {
      setNameInput(userAccount.accountName);
    }
  }, [userAccount]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    if (onUpdateAccountName) {
      onUpdateAccountName(nameInput.trim());
    }
    setIsEditingName(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md max-h-[85vh] sm:max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 my-auto"
      >
        {/* Header - Sticky */}
        <div className="shrink-0 px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Pengaturan Akun
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                1 Akun keluarga untuk semua perangkat
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            title="Tutup (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 overscroll-contain">
          {/* User Card Profile */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-md relative overflow-hidden">
            <div className="relative z-10 flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/80 block">
                  Akun Keluarga Aktif
                </span>
                <div className="text-base font-black truncate">
                  {userAccount?.accountName || 'Keluarga Pratama'}
                </div>
                <p className="text-xs text-white/90 truncate font-mono mt-0.5">
                  {userAccount?.email || 'fikriarkan1309@gmail.com'}
                </p>
                <div className="flex items-center gap-1.5 mt-2 text-[11px] text-white/90 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Multi-Device Terhubung Real-Time</span>
                </div>
              </div>
            </div>
          </div>

          {/* Edit Nama Akun Form */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Nama Akun / Keluarga
              </label>
              {!isEditingName && (
                <button
                  type="button"
                  onClick={() => setIsEditingName(true)}
                  className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Ubah Nama</span>
                </button>
              )}
            </div>

            {isEditingName ? (
              <form onSubmit={handleSaveName} className="flex gap-2">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  required
                  autoFocus
                  placeholder="Nama Akun"
                  className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Simpan</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingName(false)}
                  className="px-2.5 py-1.5 text-xs text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl"
                >
                  Batal
                </button>
              </form>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {userAccount?.accountName || 'Keluarga Pratama'}
                </span>
                {saveSuccess && (
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Tersimpan!</span>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Multi-Device Synchronize Box */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Buka di Perangkat Lain (Multi-Device)
                </span>
              </div>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 rounded-md">
                Bebas Batasan
              </span>
            </div>

            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
              Suami dan istri masuk menggunakan <strong>email dan kata sandi yang sama</strong> di HP maupun laptop masing-masing. Seluruh transaksi otomatis saling terhubung dan tersinkronisasi.
            </p>

            <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block">Email Login Bersama</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {userAccount?.email || 'fikriarkan1309@gmail.com'}
                </span>
              </div>
              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50 dark:bg-indigo-950/50 px-2 py-1 rounded-lg">
                1 Akun Bersama
              </span>
            </div>
          </div>

          {/* Active Connected Devices List */}
          <div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
              Status Perangkat
            </span>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs">
                <div className="flex items-center gap-2.5">
                  <Laptop className="w-4 h-4 text-blue-500" />
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                      Perangkat Ini
                    </span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                      {isOnline ? 'Online • Tersinkronisasi' : 'Offline • Tersimpan di IndexedDB'}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 font-medium">Aktif</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs">
                <div className="flex items-center gap-2.5">
                  <Smartphone className="w-4 h-4 text-slate-400" />
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                      HP Pasangan (Mobile / PWA)
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                      Gunakan email & kata sandi yang sama
                    </span>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 font-medium">Siap</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Sticky */}
        <div className="shrink-0 px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-xs flex items-center justify-between gap-2">
          {onLogout && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onLogout();
              }}
              className="py-2.5 px-3.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar (Logout)</span>
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs active:scale-[0.99]"
          >
            Selesai / Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

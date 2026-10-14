import React, { useState, useEffect } from 'react';
import {
  User,
  Smartphone,
  Laptop,
  CheckCircle2,
  Copy,
  ShieldCheck,
  X,
  RefreshCw,
  Share2,
} from 'lucide-react';
import { UserRole } from '../types/finance';

interface UserAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeRole: UserRole;
  onSelectRole: (role: UserRole) => void;
  isOnline: boolean;
  pendingSyncCount: number;
}

export const UserAccountModal: React.FC<UserAccountModalProps> = ({
  isOpen,
  onClose,
  activeRole,
  onSelectRole,
  isOnline,
  pendingSyncCount,
}) => {
  const [copied, setCopied] = useState(false);
  const syncPairCode = 'CF-849201';

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

  const handleCopyCode = () => {
    navigator.clipboard.writeText(syncPairCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
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
                Akun & Multi-Device
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                1 Akun tersambung di banyak perangkat sekaligus
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
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-md relative overflow-hidden">
            <div className="relative z-10 flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl border border-white/30 shrink-0">
                {activeRole === 'husband' ? '👨🏻‍💼' : '👩🏻‍💼'}
              </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold truncate">
                  {activeRole === 'husband' ? 'Fikri Arkan' : 'Alya Putri'}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/25 border border-white/30 uppercase tracking-wider">
                  {activeRole === 'husband' ? 'Suami' : 'Istri'}
                </span>
              </div>
              <p className="text-xs text-white/80 truncate mt-0.5 font-mono">
                fikriarkan1309@gmail.com
              </p>
              <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-white/90 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                <span>Akun Utama Keluarga Aktif</span>
              </div>
            </div>
          </div>
        </div>

        {/* Switch Role Tabs */}
        <div className="mt-4">
          <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
            Ganti Profil Aktif di Perangkat Ini
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onSelectRole('husband')}
              className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                activeRole === 'husband'
                  ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/20'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
              }`}
            >
              <span className="text-lg">👨🏻‍💼</span>
              <div className="text-left">
                <span className="block font-bold">Fikri (Suami)</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Pengelola Kas</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onSelectRole('wife')}
              className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                activeRole === 'wife'
                  ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 ring-2 ring-purple-500/20'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
              }`}
            >
              <span className="text-lg">👩🏻‍💼</span>
              <div className="text-left">
                <span className="block font-bold">Alya (Istri)</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Pengelola Anggaran</span>
              </div>
            </button>
          </div>
        </div>

        {/* Multi-Device Synchronize Box */}
        <div className="mt-5 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Share2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                Buka di Perangkat Lain (Multi-Device)
              </span>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 rounded-md">
              Aktif
            </span>
          </div>

          <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
            Buka link aplikasi di HP pasangan atau laptop Anda, lalu masukkan kode sinkronisasi berikut agar data transaksi otomatis saling terhubung real-time.
          </p>

          <div className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Kode Pairing Akun
              </span>
              <span className="text-sm font-extrabold font-mono text-indigo-600 dark:text-indigo-400">
                {syncPairCode}
              </span>
            </div>
            <button
              onClick={handleCopyCode}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100'
              }`}
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Kode</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Active Connected Devices List */}
        <div className="mt-4">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
            Perangkat Terhubung
          </span>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-2.5">
                <Laptop className="w-4 h-4 text-blue-500" />
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                    Perangkat Ini (Web Browser)
                  </span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                    {isOnline ? 'Online • Sinkronisasi Siap' : 'Offline • Tersimpan di IndexedDB'}
                  </span>
                </div>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">Saat Ini</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-2.5">
                <Smartphone className="w-4 h-4 text-slate-400" />
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                    HP Android (PWA / Mobile)
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    Sinkron otomatis setiap ada perubahan
                  </span>
                </div>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">Tersambung</span>
            </div>
          </div>
        </div>
        </div>

        {/* Footer - Sticky */}
        <div className="shrink-0 px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-xs flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs active:scale-[0.99]"
          >
            Selesai / Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

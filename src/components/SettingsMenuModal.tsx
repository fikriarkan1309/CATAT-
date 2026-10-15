import React, { useEffect, useRef } from 'react';
import {
  Database,
  Tag,
  User,
  Moon,
  Sun,
  ChevronRight,
  X,
  Settings,
  LogOut,
  Cloud,
} from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase';

interface SettingsMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenDataModal: () => void;
  onOpenCategories: () => void;
  onOpenAccountModal: () => void;
  onOpenSupabaseModal?: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onLogout?: () => void;
}

export const SettingsMenuModal: React.FC<SettingsMenuModalProps> = ({
  isOpen,
  onClose,
  onOpenDataModal,
  onOpenCategories,
  onOpenAccountModal,
  onOpenSupabaseModal,
  theme,
  onToggleTheme,
  onLogout,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 dark:bg-slate-950/70 backdrop-blur-xs flex items-start justify-end p-3 sm:p-5 animate-in fade-in"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xs bg-white dark:bg-slate-900 rounded-3xl p-4 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in slide-in-from-top-4 zoom-in-95 mt-10 sm:mt-12"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              Pengaturan & Menu
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Menu Items */}
        <div className="space-y-1.5">
          {/* 1. DATA (Poin nomor 3) */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenDataModal();
            }}
            className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  Data
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Cadangan, restore & ekspor Excel
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200" />
          </button>

          {/* 1.5. DATABASE SUPABASE (CLOUD SYNC) */}
          {onOpenSupabaseModal && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenSupabaseModal();
              }}
              className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Cloud className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      Database Supabase
                    </span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md ${
                        isSupabaseConfigured()
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {isSupabaseConfigured() ? 'Terhubung' : 'Cloud'}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Koneksi database & skema SQL
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200" />
            </button>
          )}

          {/* 2. KATEGORI */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenCategories();
            }}
            className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Tag className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  Kategori
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Kelola pos pengeluaran & pemasukan
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200" />
          </button>

          {/* 3. TEMA / DARK MODE TOGGLE */}
          <button
            type="button"
            onClick={onToggleTheme}
            className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  Mode Tampilan
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {theme === 'dark' ? 'Mode Gelap Aktif (🌙)' : 'Mode Terang Aktif (☀️)'}
                </span>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {theme === 'dark' ? 'Dark' : 'Light'}
            </span>
          </button>

          {/* 4. AKUN (Paling Bawah Sesuai Permintaan User: "akun paling bawah") */}
          <div className="pt-1 border-t border-slate-100 dark:border-slate-800 mt-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAccountModal();
              }}
              className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 hover:bg-indigo-100/70 dark:hover:bg-indigo-950/70 text-left transition-colors group border border-indigo-100 dark:border-indigo-900/50"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs group-hover:scale-105 transition-transform shadow-xs">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200 block">
                    Akun & Multi-Device
                  </span>
                  <span className="text-[11px] text-indigo-600 dark:text-indigo-400">
                    Buka 1 akun di banyak device
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-indigo-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-200" />
            </button>
          </div>

          {/* 5. KELUAR / LOGOUT */}
          {onLogout && (
            <div className="pt-1">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onLogout();
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-rose-50 dark:hover:bg-rose-950/40 text-left transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold text-xs group-hover:scale-105 transition-transform">
                    <LogOut className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-rose-600 dark:text-rose-400 block">
                      Keluar (Logout)
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Kembali ke halaman login & pairing
                    </span>
                  </div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

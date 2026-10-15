import React, { useState } from 'react';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  ShieldCheck,
  ArrowRight,
  Sun,
  Moon,
  AlertCircle,
  Smartphone,
  CheckCircle2,
  Database,
  Loader2,
} from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase';

interface AuthLoginScreenProps {
  onLogin: (
    email: string,
    password?: string
  ) => Promise<{ success: boolean; message?: string }> | { success: boolean; message?: string };
  onSignUp: (input: {
    accountName: string;
    email: string;
    password?: string;
  }) => Promise<{ success: boolean; message?: string }> | { success: boolean; message?: string };
  defaultEmail?: string;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenSupabaseConfig?: () => void;
}

export const AuthLoginScreen: React.FC<AuthLoginScreenProps> = ({
  onLogin,
  onSignUp,
  defaultEmail = 'fikriarkan1309@gmail.com',
  theme,
  onToggleTheme,
  onOpenSupabaseConfig,
}) => {
  // Mode: 'login' | 'signup'
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  // Login form state
  const [loginEmail, setLoginEmail] = useState(defaultEmail);
  const [loginPassword, setLoginPassword] = useState('password123');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Sign up form state
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);

  // Status & Feedback
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const isSupabaseActive = isSupabaseConfigured();

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!loginEmail.trim()) {
      setErrorMsg('Silakan masukkan alamat email akun Anda.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await onLogin(loginEmail.trim(), loginPassword);
      if (!res.success) {
        setErrorMsg(res.message || 'Gagal masuk. Periksa email dan kata sandi Anda.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Terjadi kesalahan saat masuk.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!signUpName.trim()) {
      setErrorMsg('Silakan masukkan nama akun Anda.');
      return;
    }
    if (!signUpEmail.trim()) {
      setErrorMsg('Silakan masukkan alamat email yang valid.');
      return;
    }
    if (!signUpPassword || signUpPassword.length < 4) {
      setErrorMsg('Kata sandi minimal 4 karakter.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await onSignUp({
        accountName: signUpName.trim(),
        email: signUpEmail.trim(),
        password: signUpPassword,
      });

      if (res.success) {
        setSuccessMsg('Akun berhasil didaftarkan! Mengarahkan ke buku kas...');
      } else {
        setErrorMsg(res.message || 'Gagal mendaftarkan akun.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Terjadi kesalahan saat pendaftaran.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoLogin = async (emailPreset: string) => {
    setLoginEmail(emailPreset);
    setLoginPassword('password123');
    setErrorMsg(null);
    setIsLoading(true);
    try {
      await onLogin(emailPreset, 'password123');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between font-sans text-slate-900 dark:text-slate-100 p-4 sm:p-6 transition-colors">
      {/* Top Header Bar */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between py-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center font-black text-sm tracking-tighter shadow-md">
            KF
          </div>
          <div>
            <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white block leading-none">
              KeluargaFin
            </span>
            <span className="text-[10px] text-slate-400 font-medium">Buku Kas Keuangan Keluarga</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenSupabaseConfig && (
            <button
              type="button"
              onClick={onOpenSupabaseConfig}
              className={`py-1.5 px-2.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                isSupabaseActive
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title="Pengaturan Koneksi Supabase Database & Auth"
            >
              <Database className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">
                {isSupabaseActive ? 'Supabase Terhubung' : 'Koneksi Supabase'}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={onToggleTheme}
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-2xs"
            title="Ganti Tema Tampilan"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>
        </div>
      </div>

      {/* Main Authentication Card */}
      <div className="max-w-md w-full mx-auto my-auto py-4">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 dark:border-slate-800 space-y-5 animate-in fade-in zoom-in-95 duration-150">
          {/* Header Card Title */}
          <div className="text-center space-y-1">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {mode === 'login' ? 'Masuk ke Akun' : 'Daftar Akun Baru'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {mode === 'login'
                ? 'Gunakan email dan kata sandi akun Anda untuk membuka buku kas'
                : 'Daftarkan nama akun, email, dan kata sandi untuk memulai'}
            </p>
          </div>

          {/* Feedback Alerts */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 rounded-xl flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/60 rounded-xl flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 1. FORM LOGIN (UNTUK YANG SUDAH PUNYA AKUN) */}
          {/* ========================================================================= */}
          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* Input Email */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Alamat Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    placeholder="nama@email.com"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-600 font-medium"
                  />
                </div>
              </div>

              {/* Input Kata Sandi */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Kata Sandi
                  </label>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-600 font-medium font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Tombol Masuk */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Memverifikasi...</span>
                  </>
                ) : (
                  <>
                    <span>Masuk ke Akun</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>

              {/* Tautan: Belum punya akun? Daftar sekarang */}
              <div className="text-center pt-2">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Belum punya akun?{' '}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null);
                    setSuccessMsg(null);
                    setMode('signup');
                  }}
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Daftar sekarang
                </button>
              </div>
            </form>
          ) : (
            /* ========================================================================= */
            /* 2. FORM PENDAFTARAN (POPUP/TAMPILAN DAFTAR AKUN BARU) */
            /* ========================================================================= */
            <form onSubmit={handleSignUpSubmit} className="space-y-4">
              {/* Input Nama Akun */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Nama Akun
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={signUpName}
                    onChange={(e) => setSignUpName(e.target.value)}
                    required
                    placeholder="Contoh: Keluarga Pratama / Fikri Arkan"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-600 font-medium"
                  />
                </div>
              </div>

              {/* Input Email */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Alamat Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    required
                    placeholder="nama@email.com"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-600 font-medium"
                  />
                </div>
              </div>

              {/* Input Kata Sandi */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Kata Sandi
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showSignUpPassword ? 'text' : 'password'}
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    required
                    placeholder="Minimal 4 karakter"
                    className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-600 font-medium font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showSignUpPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Tombol Buat Akun */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Mendaftarkan ke {isSupabaseActive ? 'Supabase' : 'Akun'}...</span>
                  </>
                ) : (
                  <>
                    <span>Daftar Akun Baru</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>

              {/* Tautan: Sudah punya akun? Masuk sekarang */}
              <div className="text-center pt-2">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Sudah punya akun?{' '}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null);
                    setSuccessMsg(null);
                    setMode('login');
                  }}
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Masuk sekarang
                </button>
              </div>
            </form>
          )}

          {/* Quick Demo Login & Supabase Setup Options */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('fikriarkan1309@gmail.com')}
              className="w-full py-2 px-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
            >
              <span>Uji Coba Cepat: Masuk sebagai Akun Utama (Fikri Arkan)</span>
            </button>

            {onOpenSupabaseConfig && (
              <button
                type="button"
                onClick={onOpenSupabaseConfig}
                className="w-full py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-300 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Database className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>
                  {isSupabaseActive
                    ? '🟢 Supabase Aktif & Terhubung (Klik untuk Kelola)'
                    : '⚙️ Hubungkan Database Cloud Supabase'}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Multi-Device Feature Info Banner */}
        <div className="mt-4 p-3 bg-white/70 dark:bg-slate-900/70 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-1 backdrop-blur-xs">
          <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
            <Smartphone className="w-3.5 h-3.5 text-blue-500" />
            <span>1 Akun untuk Semua Perangkat</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            Suami dan istri masuk menggunakan email dan kata sandi yang sama di masing-masing HP atau laptop tanpa batasan perangkat.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-[10px] text-slate-400 py-2">
        KeluargaFin &copy; 2026 · Buku Kas Keuangan Terintegrasi Multi-Device
      </div>
    </div>
  );
};

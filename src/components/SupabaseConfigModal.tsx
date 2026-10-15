import React, { useState, useEffect } from 'react';
import {
  Database,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  X,
  Server,
  Key,
  Globe,
  RefreshCw,
  HelpCircle,
  Unlink,
} from 'lucide-react';
import {
  getSupabaseConfig,
  saveSupabaseConfig,
  clearSupabaseConfig,
  testSupabaseConnection,
  isSupabaseConfigured,
  SUPABASE_SQL_SCHEMA,
} from '../lib/supabase';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectionChange?: () => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({
  isOpen,
  onClose,
  onConnectionChange,
}) => {
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'config' | 'sql' | 'faq'>('config');
  const [isCopied, setIsCopied] = useState(false);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const currentConfig = getSupabaseConfig();
      setUrl(currentConfig.url);
      setAnonKey(currentConfig.anonKey);
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isConnected = isSupabaseConfigured();

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    const result = await testSupabaseConnection(url.trim(), anonKey.trim());
    setIsTesting(false);
    setTestResult(result);
  };

  const handleSave = async () => {
    if (!url.trim() || !anonKey.trim()) {
      setTestResult({
        success: false,
        message: 'Mohon isi Project URL dan Anon Key terlebih dahulu.',
      });
      return;
    }

    setIsTesting(true);
    const test = await testSupabaseConnection(url.trim(), anonKey.trim());
    setIsTesting(false);

    if (test.success) {
      saveSupabaseConfig(url.trim(), anonKey.trim());
      setTestResult({
        success: true,
        message: 'Pengaturan Supabase berhasil disimpan dan terhubung!',
      });
      if (onConnectionChange) onConnectionChange();
      setTimeout(() => {
        onClose();
      }, 1000);
    } else {
      setTestResult(test);
    }
  };

  const handleDisconnect = () => {
    clearSupabaseConfig();
    setUrl('');
    setAnonKey('');
    setTestResult({
      success: true,
      message: 'Koneksi Supabase telah dilepas. Aplikasi kembali ke mode penyimpanan lokal offline.',
    });
    if (onConnectionChange) onConnectionChange();
  };

  const handleCopySQL = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in zoom-in-95 my-auto"
      >
        {/* Header */}
        <div className="shrink-0 px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/50">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  Koneksi Database Supabase
                </h3>
                {isConnected ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 flex items-center gap-1 border border-emerald-200 dark:border-emerald-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Terhubung
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    Mode Lokal / Offline
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Penyimpanan data buku kas & akun login di cloud Supabase
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="shrink-0 flex items-center gap-1 px-5 pt-3 pb-1 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('config')}
            className={`py-2 px-3 rounded-xl transition-colors flex items-center gap-1.5 ${
              activeTab === 'config'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border border-slate-200/80 dark:border-slate-700'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Server className="w-3.5 h-3.5 text-blue-500" />
            <span>Kredensial & Status</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('faq')}
            className={`py-2 px-3 rounded-xl transition-colors flex items-center gap-1.5 ${
              activeTab === 'faq'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border border-slate-200/80 dark:border-slate-700'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5 text-emerald-500" />
            <span>Data Login Masuk Supabase?</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sql')}
            className={`py-2 px-3 rounded-xl transition-colors flex items-center gap-1.5 ${
              activeTab === 'sql'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border border-slate-200/80 dark:border-slate-700'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-amber-500" />
            <span>Skrip SQL Skema</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {/* TAB 1: CONFIGURATION */}
          {activeTab === 'config' && (
            <div className="space-y-4">
              {/* Status Alert Banner */}
              {isConnected ? (
                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl flex items-start gap-3 text-xs text-emerald-800 dark:text-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-bold">Supabase Sedang Aktif</p>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                      Semua pendaftaran akun, data login, dan transaksi otomatis tersinkronisasi ke server Supabase Anda.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-2xl flex items-start gap-3 text-xs text-blue-800 dark:text-blue-200">
                  <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-bold">Mode Offline-First Aktif</p>
                    <p className="text-[11px] text-blue-700 dark:text-blue-300">
                      Anda bisa langsung pakai tanpa Supabase (data tersimpan di memori perangkat). Hubungkan Supabase untuk sinkronisasi otomatis antar HP suami & istri di cloud.
                    </p>
                  </div>
                </div>
              )}

              {/* Feedback Alert */}
              {testResult && (
                <div
                  className={`p-3 rounded-2xl border flex items-start gap-2.5 text-xs animate-in fade-in ${
                    testResult.success
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                      : 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <span>{testResult.message}</span>
                </div>
              )}

              {/* Inputs */}
              <div className="space-y-3.5">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Supabase Project URL
                  </label>
                  <div className="relative">
                    <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://xyzcompany.supabase.co"
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-600"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Dapatkan di dashboard Supabase: <strong>Project Settings → API → Project URL</strong>
                  </span>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Supabase Anon / Public API Key
                  </label>
                  <div className="relative">
                    <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showKey ? 'text' : 'password'}
                      value={anonKey}
                      onChange={(e) => setAnonKey(e.target.value)}
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      className="w-full pl-10 pr-20 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded-lg"
                    >
                      {showKey ? 'Sembunyikan' : 'Lihat'}
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Gunakan kunci <strong>anon / public</strong> (bukan service_role secret key).
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting || !url || !anonKey}
                  className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                  <span>{isTesting ? 'Menguji...' : 'Uji Koneksi'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isTesting || !url || !anonKey}
                  className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Simpan & Hubungkan</span>
                </button>

                {isConnected && (
                  <button
                    type="button"
                    onClick={handleDisconnect}
                    className="py-2.5 px-3 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                    title="Putuskan koneksi dan gunakan mode lokal"
                  >
                    <Unlink className="w-3.5 h-3.5" />
                    <span className="sm:hidden">Putuskan</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: FAQ & JAWABAN PERTANYAAN USER */}
          {activeTab === 'faq' && (
            <div className="space-y-3.5 text-xs">
              <div className="p-4 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-900/50 rounded-2xl space-y-2">
                <h4 className="font-extrabold text-sm text-indigo-950 dark:text-indigo-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span>Apakah data login akun juga masuk ke Supabase?</span>
                </h4>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                  <strong>YA, BENAR SEKALI!</strong> Ketika Supabase dihubungkan:
                </p>
                <ul className="space-y-1.5 text-slate-600 dark:text-slate-300 list-disc list-inside ml-1">
                  <li>
                    <strong>Email dan Kata Sandi:</strong> Masuk langsung ke sistem <strong>Supabase Auth</strong> (<code className="font-mono bg-white dark:bg-slate-800 px-1 rounded">auth.users</code>) secara aman dan terenkripsi.
                  </li>
                  <li>
                    <strong>Nama Akun & Profil:</strong> Otomatis tersimpan di tabel <code className="font-mono bg-white dark:bg-slate-800 px-1 rounded">public.profiles</code>.
                  </li>
                  <li>
                    <strong>Multi-Device:</strong> Suami dan istri bisa login bersamaan menggunakan email dan kata sandi yang sama di HP atau laptop manapun tanpa batasan jumlah perangkat.
                  </li>
                  <li>
                    <strong>Semua Data Buku Kas:</strong> Transaksi, rekening, anggaran, tagihan rutin, dan hutang/piutang tersimpan di database PostgreSQL Supabase Anda.
                  </li>
                </ul>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-2">
                <h4 className="font-extrabold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-blue-500" />
                  <span>Bagaimana cara mendapatkan URL & Anon Key di Supabase?</span>
                </h4>
                <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-300">
                  <li>Buka <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 underline font-bold">supabase.com</a> dan buat akun / project gratis.</li>
                  <li>Di menu sebelah kiri project Anda, klik <strong>Project Settings (ikon roda gigi)</strong>.</li>
                  <li>Pilih menu <strong>API</strong>.</li>
                  <li>Salin <strong>Project URL</strong> dan <strong>anon public key</strong>, lalu masukkan di tab <em>Kredensial & Status</em>.</li>
                </ol>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-2">
                <h4 className="font-extrabold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Bagaimana jika sedang tidak ada sinyal internet?</span>
                </h4>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  Aplikasi KeluargaFin dirancang secara <strong>Offline-First</strong>. Anda tetap bisa mencatat transaksi belanja meskipun sedang offline di supermarket atau pasar. Data tersimpan di memori lokal HP, dan saat koneksi internet kembali, otomatis disinkronkan ke Supabase.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: SQL SCHEMA MIGRATION */}
          {activeTab === 'sql' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Skrip SQL Skema Database
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Jalankan skrip ini sekali di <strong>SQL Editor</strong> dashboard Supabase Anda.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopySQL}
                  className="py-1.5 px-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-bold flex items-center gap-1.5 hover:opacity-90 transition-opacity shadow-xs"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopied ? 'Tersalin!' : 'Salin Skrip SQL'}</span>
                </button>
              </div>

              <div className="relative">
                <pre className="p-3 bg-slate-950 text-emerald-400 rounded-2xl text-[11px] font-mono overflow-x-auto max-h-72 border border-slate-800 leading-relaxed">
                  {SUPABASE_SQL_SCHEMA}
                </pre>
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-[11px] text-amber-800 dark:text-amber-300">
                💡 <strong>Tips:</strong> Skrip di atas sudah dilengkapi dengan tabel <code className="font-mono">profiles</code>, <code className="font-mono">accounts</code>, <code className="font-mono">transactions</code>, <code className="font-mono">budgets</code>, <code className="font-mono">goals</code>, <code className="font-mono">bills</code>, <code className="font-mono">debts</code>, serta Row Level Security (RLS) dan auto-create trigger profil saat signup.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 px-5 sm:px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-between">
          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noreferrer"
            className="text-[11px] font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1"
          >
            <span>Dashboard Supabase</span>
            <ExternalLink className="w-3 h-3" />
          </a>

          <button
            type="button"
            onClick={onClose}
            className="py-2 px-5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

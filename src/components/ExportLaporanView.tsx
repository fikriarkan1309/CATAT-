import React, { useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  CheckSquare,
  Square,
  Download,
  Eye,
  FileSpreadsheet,
  Layers,
  ChevronDown,
  ChevronUp,
  Sliders,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';
import { AppIcon } from './AppIcon';
import { PdfCanvasViewer } from './PdfCanvasViewer';
import {
  Account,
  Category,
  Transaction,
  Budget,
  SharedGoal,
  RecurringBill,
  DebtItem,
} from '../types/finance';
import {
  ExportReportOptions,
  generateFinancialPDF,
  formatRupiahPDF,
} from '../lib/pdfReportGenerator';

interface ExportLaporanViewProps {
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  goals: SharedGoal[];
  bills: RecurringBill[];
  debts: DebtItem[];
  userName?: string;
  onBack: () => void;
  onExportCSV?: () => void;
}

export const ExportLaporanView: React.FC<ExportLaporanViewProps> = ({
  accounts,
  categories,
  transactions,
  budgets,
  goals,
  bills,
  debts,
  userName,
  onBack,
  onExportCSV,
}) => {
  // Current date helpers
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    .toISOString()
    .split('T')[0];
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    .toISOString()
    .split('T')[0];

  // 1. Date Range & Period State
  const [periodPreset, setPeriodPreset] = useState<'this_month' | 'last_month' | 'last_7_days' | 'custom'>('this_month');
  const [startDate, setStartDate] = useState(firstDayOfMonth);
  const [endDate, setEndDate] = useState(lastDayOfMonth);

  // 2. Modules Selection State (All 7 modules)
  const [modules, setModules] = useState<{
    summary: boolean;
    accounts: boolean;
    savings: boolean;
    budgets: boolean;
    bills: boolean;
    debts: boolean;
    transactions: boolean;
  }>({
    summary: true,
    accounts: true,
    savings: true,
    budgets: true,
    bills: true,
    debts: true,
    transactions: true,
  });

  // Accordion active settings tab
  const [expandedSettings, setExpandedSettings] = useState<string | null>(null);

  // 3. Sub-settings for each module
  // 1) Summary settings
  const [summaryIncludeTopCategories, setSummaryIncludeTopCategories] = useState(true);
  const [summaryIncludeSavingsRatio, setSummaryIncludeSavingsRatio] = useState(true);

  // 2) Accounts settings
  const [accountsFilter, setAccountsFilter] = useState<'all' | 'selected'>('all');
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>(
    accounts.map((a) => a.id)
  );

  // 3) Savings settings
  const [savingsFilter, setSavingsFilter] = useState<'all' | 'ongoing'>('all');

  // 4) Budgets settings
  const [budgetsFilter, setBudgetsFilter] = useState<'all' | 'overbudget_only'>('all');

  // 5) Bills settings
  const [billsFilter, setBillsFilter] = useState<'all' | 'unpaid_only'>('all');

  // 6) Debts settings
  const [debtsFilter, setDebtsFilter] = useState<'all' | 'debts_only' | 'receivables_only'>('all');
  const [debtsStatusFilter, setDebtsStatusFilter] = useState<'all' | 'unpaid_only'>('all');

  // 7) Transactions settings
  const [transactionsTypeFilter, setTransactionsTypeFilter] = useState<'all' | 'expense' | 'income' | 'transfer'>('all');
  const [transactionsSort, setTransactionsSort] = useState<'desc' | 'asc'>('desc');
  const [transactionsAccountId, setTransactionsAccountId] = useState<'all' | string>('all');

  // Generation status
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [previewPdfData, setPreviewPdfData] = useState<ArrayBuffer | null>(null);
  const [previewFilename, setPreviewFilename] = useState<string>('');
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Handlers for Preset changes
  const applyPreset = (preset: 'this_month' | 'last_month' | 'last_7_days' | 'custom') => {
    setPeriodPreset(preset);
    const now = new Date();
    if (preset === 'this_month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      setStartDate(start);
      setEndDate(end);
    } else if (preset === 'last_month') {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
      const end = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
      setStartDate(start);
      setEndDate(end);
    } else if (preset === 'last_7_days') {
      const past = new Date();
      past.setDate(past.getDate() - 7);
      setStartDate(past.toISOString().split('T')[0]);
      setEndDate(now.toISOString().split('T')[0]);
    }
  };

  // Select / Deselect all
  const selectAllModules = () => {
    setModules({
      summary: true,
      accounts: true,
      savings: true,
      budgets: true,
      bills: true,
      debts: true,
      transactions: true,
    });
  };

  const deselectAllModules = () => {
    setModules({
      summary: false,
      accounts: false,
      savings: false,
      budgets: false,
      bills: false,
      debts: false,
      transactions: false,
    });
  };

  const toggleModule = (key: keyof typeof modules) => {
    setModules((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const selectedCount = Object.values(modules).filter(Boolean).length;

  const toggleAccountSelection = (accId: string) => {
    setSelectedAccountIds((prev) =>
      prev.includes(accId) ? prev.filter((id) => id !== accId) : [...prev, accId]
    );
  };

  // Compile options object
  const buildOptions = (): ExportReportOptions => {
    const startObj = new Date(startDate);
    const endObj = new Date(endDate);
    const startStr = startObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    const endStr = endObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    const periodLabel = `${startStr} — ${endStr}`;

    return {
      startDate,
      endDate,
      periodLabel,
      modules,
      settings: {
        summaryIncludeTopCategories,
        summaryIncludeSavingsRatio,
        accountsFilter,
        selectedAccountIds,
        savingsFilter,
        budgetsFilter,
        billsFilter,
        billsMonthKey: startDate.slice(0, 7),
        debtsFilter,
        debtsStatusFilter,
        transactionsTypeFilter,
        transactionsSort,
        transactionsAccountId,
      },
      userName: userName || 'Keluarga',
    };
  };

  // Handle Generate & Download PDF
  const handleDownloadPDF = async () => {
    if (selectedCount === 0) return;
    setIsGenerating(true);
    try {
      const options = buildOptions();
      const { blob, filename } = await generateFinancialPDF(options, {
        accounts,
        categories,
        transactions,
        budgets,
        goals,
        bills,
        debts,
      });

      // Trigger browser download
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3500);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle Preview PDF
  const handlePreviewPDF = async () => {
    if (selectedCount === 0) return;
    setIsGenerating(true);
    try {
      const options = buildOptions();
      const { blob, arrayBuffer, filename } = await generateFinancialPDF(options, {
        accounts,
        categories,
        transactions,
        budgets,
        goals,
        bills,
        debts,
      });

      const url = URL.createObjectURL(blob);
      setPreviewBlobUrl(url);
      setPreviewPdfData(arrayBuffer);
      setPreviewFilename(filename);
    } catch (err) {
      console.error('Failed to preview PDF:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const closePreview = () => {
    if (previewBlobUrl) {
      URL.revokeObjectURL(previewBlobUrl);
    }
    setPreviewBlobUrl(null);
    setPreviewPdfData(null);
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col pb-32 animate-in fade-in select-none">
      {/* Top Header */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800">
        <div className="max-w-lg mx-auto sm:max-w-xl md:max-w-2xl px-4 py-3 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-bold text-sky-600 dark:text-sky-400 hover:text-sky-700 bg-sky-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-sky-100 dark:border-slate-700 transition-colors shadow-2xs cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali</span>
          </button>

          <div className="text-center">
            <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
              Export Laporan
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Format Dokumen PDF Siap Cetak
            </p>
          </div>

          <div className="w-16 flex justify-end">
            {onExportCSV && (
              <button
                type="button"
                onClick={onExportCSV}
                title="Ekspor CSV / Excel"
                className="p-2 text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto sm:max-w-xl md:max-w-2xl w-full px-4 pt-4 space-y-4">

        {/* ========================================================================= */}
        {/* BAGIAN 1: RENTANG TANGGAL / PERIODE */}
        {/* ========================================================================= */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Periode Laporan
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Menentukan cakupan data ringkasan dan mutasi transaksi
              </p>
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-3">
            <button
              type="button"
              onClick={() => applyPreset('this_month')}
              className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all truncate cursor-pointer ${
                periodPreset === 'this_month'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              Bulan Ini
            </button>
            <button
              type="button"
              onClick={() => applyPreset('last_month')}
              className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all truncate cursor-pointer ${
                periodPreset === 'last_month'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              Bulan Lalu
            </button>
            <button
              type="button"
              onClick={() => applyPreset('last_7_days')}
              className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all truncate cursor-pointer ${
                periodPreset === 'last_7_days'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              7 Hari Lalu
            </button>
            <button
              type="button"
              onClick={() => setPeriodPreset('custom')}
              className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all truncate col-span-3 sm:col-span-1 cursor-pointer ${
                periodPreset === 'custom'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              Kustom
            </button>
          </div>

          {/* Custom Date Pickers */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Dari Tanggal
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPeriodPreset('custom');
                }}
                className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Sampai Tanggal
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPeriodPreset('custom');
                }}
                className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* BAGIAN 2: PILIH MODUL (7 PILAR) + PENGATURAN TIAP MENU */}
        {/* ========================================================================= */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Pilih Isi Laporan ({selectedCount} dari 7 dipilih)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={selectAllModules}
                className="text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
              >
                Pilih Semua
              </button>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <button
                type="button"
                onClick={deselectAllModules}
                className="text-[11px] font-bold text-slate-500 hover:underline cursor-pointer"
              >
                Hapus Semua
              </button>
            </div>
          </div>

          {/* ---------------- 1. RINGKASAN ---------------- */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
            <div className="p-3.5 flex items-center justify-between">
              <button
                type="button"
                onClick={() => toggleModule('summary')}
                className="flex items-center gap-3 flex-1 text-left cursor-pointer"
              >
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                    modules.summary
                      ? 'bg-sky-600 text-white'
                      : 'border-2 border-slate-300 dark:border-slate-600 text-transparent'
                  }`}
                >
                  <CheckSquare className="w-4 h-4" />
                </div>
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <AppIcon name="tab-ringkasan" className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white block">
                    1. Ringkasan Eksekutif
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                    Pemasukan, pengeluaran & arus kas bersih
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  setExpandedSettings(expandedSettings === 'summary' ? null : 'summary')
                }
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                title="Atur parameter ringkasan"
              >
                {expandedSettings === 'summary' ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Sub-settings Accordion */}
            {expandedSettings === 'summary' && (
              <div className="px-4 pb-3.5 pt-1 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-800/40 text-xs space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Pengaturan Ringkasan:
                </span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={summaryIncludeTopCategories}
                    onChange={(e) => setSummaryIncludeTopCategories(e.target.checked)}
                    className="rounded text-sky-600 focus:ring-sky-500"
                  />
                  <span className="text-slate-700 dark:text-slate-300">
                    Sertakan Kategori Pengeluaran Terbesar (Top Expenses)
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={summaryIncludeSavingsRatio}
                    onChange={(e) => setSummaryIncludeSavingsRatio(e.target.checked)}
                    className="rounded text-sky-600 focus:ring-sky-500"
                  />
                  <span className="text-slate-700 dark:text-slate-300">
                    Sertakan Rasio Tabungan (Savings Rate %)
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* ---------------- 2. REKENING ---------------- */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
            <div className="p-3.5 flex items-center justify-between">
              <button
                type="button"
                onClick={() => toggleModule('accounts')}
                className="flex items-center gap-3 flex-1 text-left cursor-pointer"
              >
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                    modules.accounts
                      ? 'bg-sky-600 text-white'
                      : 'border-2 border-slate-300 dark:border-slate-600 text-transparent'
                  }`}
                >
                  <CheckSquare className="w-4 h-4" />
                </div>
                <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <AppIcon name="tab-rekening" className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white block">
                    2. Posisi Rekening & Kas
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                    Snapshot saldo berjalan per dompet & bank
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  setExpandedSettings(expandedSettings === 'accounts' ? null : 'accounts')
                }
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                {expandedSettings === 'accounts' ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Sub-settings Accordion */}
            {expandedSettings === 'accounts' && (
              <div className="px-4 pb-3.5 pt-1 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-800/40 text-xs space-y-2.5">
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="accountsFilter"
                      checked={accountsFilter === 'all'}
                      onChange={() => setAccountsFilter('all')}
                      className="text-sky-600"
                    />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Semua Rekening</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="accountsFilter"
                      checked={accountsFilter === 'selected'}
                      onChange={() => setAccountsFilter('selected')}
                      className="text-sky-600"
                    />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Pilih Spesifik</span>
                  </label>
                </div>

                {accountsFilter === 'selected' && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {accounts.map((acc) => {
                      const isChecked = selectedAccountIds.includes(acc.id);
                      return (
                        <button
                          key={acc.id}
                          type="button"
                          onClick={() => toggleAccountSelection(acc.id)}
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
                            isChecked
                              ? 'bg-blue-600 text-white shadow-2xs'
                              : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
                          }`}
                        >
                          {acc.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ---------------- 3. TARGET TABUNGAN ---------------- */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
            <div className="p-3.5 flex items-center justify-between">
              <button
                type="button"
                onClick={() => toggleModule('savings')}
                className="flex items-center gap-3 flex-1 text-left cursor-pointer"
              >
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                    modules.savings
                      ? 'bg-sky-600 text-white'
                      : 'border-2 border-slate-300 dark:border-slate-600 text-transparent'
                  }`}
                >
                  <CheckSquare className="w-4 h-4" />
                </div>
                <div className="w-8 h-8 rounded-xl bg-green-100 dark:bg-green-950/60 text-green-600 dark:text-green-400 flex items-center justify-center shrink-0">
                  <AppIcon name="lainnya-tabungan" className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white block">
                    3. Target Tabungan
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                    Progres cita-cita & dana darurat keluarga
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  setExpandedSettings(expandedSettings === 'savings' ? null : 'savings')
                }
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                {expandedSettings === 'savings' ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            </div>

            {expandedSettings === 'savings' && (
              <div className="px-4 pb-3.5 pt-1 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-800/40 text-xs flex items-center gap-3">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="savingsFilter"
                    checked={savingsFilter === 'all'}
                    onChange={() => setSavingsFilter('all')}
                    className="text-sky-600"
                  />
                  <span className="text-slate-700 dark:text-slate-300 font-medium">Semua Target</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="savingsFilter"
                    checked={savingsFilter === 'ongoing'}
                    onChange={() => setSavingsFilter('ongoing')}
                    className="text-sky-600"
                  />
                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                    Hanya yang Masih Berjalan (&lt; 100%)
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* ---------------- 4. ALOKASI ANGGARAN ---------------- */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
            <div className="p-3.5 flex items-center justify-between">
              <button
                type="button"
                onClick={() => toggleModule('budgets')}
                className="flex items-center gap-3 flex-1 text-left cursor-pointer"
              >
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                    modules.budgets
                      ? 'bg-sky-600 text-white'
                      : 'border-2 border-slate-300 dark:border-slate-600 text-transparent'
                  }`}
                >
                  <CheckSquare className="w-4 h-4" />
                </div>
                <div className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                  <AppIcon name="lainnya-anggaran" className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white block">
                    4. Alokasi Anggaran
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                    Plafon anggaran per kategori vs realisasi
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  setExpandedSettings(expandedSettings === 'budgets' ? null : 'budgets')
                }
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                {expandedSettings === 'budgets' ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            </div>

            {expandedSettings === 'budgets' && (
              <div className="px-4 pb-3.5 pt-1 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-800/40 text-xs flex items-center gap-3">
                <span className="text-slate-600 dark:text-slate-300">
                  Termasuk evaluasi sisa anggaran dan status overbudget per pos pengeluaran.
                </span>
              </div>
            )}
          </div>

          {/* ---------------- 5. TAGIHAN RUTIN ---------------- */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
            <div className="p-3.5 flex items-center justify-between">
              <button
                type="button"
                onClick={() => toggleModule('bills')}
                className="flex items-center gap-3 flex-1 text-left cursor-pointer"
              >
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                    modules.bills
                      ? 'bg-sky-600 text-white'
                      : 'border-2 border-slate-300 dark:border-slate-600 text-transparent'
                  }`}
                >
                  <CheckSquare className="w-4 h-4" />
                </div>
                <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                  <AppIcon name="lainnya-tagihanrutin" className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white block">
                    5. Tagihan Rutin
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                    List pengeluaran tetap bulanan & status bayar
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  setExpandedSettings(expandedSettings === 'bills' ? null : 'bills')
                }
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                {expandedSettings === 'bills' ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            </div>

            {expandedSettings === 'bills' && (
              <div className="px-4 pb-3.5 pt-1 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-800/40 text-xs flex items-center gap-3">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="billsFilter"
                    checked={billsFilter === 'all'}
                    onChange={() => setBillsFilter('all')}
                    className="text-sky-600"
                  />
                  <span className="text-slate-700 dark:text-slate-300 font-medium">Semua Tagihan</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="billsFilter"
                    checked={billsFilter === 'unpaid_only'}
                    onChange={() => setBillsFilter('unpaid_only')}
                    className="text-sky-600"
                  />
                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                    Hanya yang Belum Lunas
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* ---------------- 6. HUTANG & PIUTANG ---------------- */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
            <div className="p-3.5 flex items-center justify-between">
              <button
                type="button"
                onClick={() => toggleModule('debts')}
                className="flex items-center gap-3 flex-1 text-left cursor-pointer"
              >
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                    modules.debts
                      ? 'bg-sky-600 text-white'
                      : 'border-2 border-slate-300 dark:border-slate-600 text-transparent'
                  }`}
                >
                  <CheckSquare className="w-4 h-4" />
                </div>
                <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                  <AppIcon name="lainnya-hutangpiutang" className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white block">
                    6. Hutang & Piutang
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                    Kewajiban bayar & hak tagih ke pihak lain
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  setExpandedSettings(expandedSettings === 'debts' ? null : 'debts')
                }
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                {expandedSettings === 'debts' ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            </div>

            {expandedSettings === 'debts' && (
              <div className="px-4 pb-3.5 pt-1 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-800/40 text-xs space-y-2">
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="debtsFilter"
                      checked={debtsFilter === 'all'}
                      onChange={() => setDebtsFilter('all')}
                      className="text-sky-600"
                    />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Hutang & Piutang</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="debtsFilter"
                      checked={debtsFilter === 'debts_only'}
                      onChange={() => setDebtsFilter('debts_only')}
                      className="text-sky-600"
                    />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Hanya Hutang Saya</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="debtsFilter"
                      checked={debtsFilter === 'receivables_only'}
                      onChange={() => setDebtsFilter('receivables_only')}
                      className="text-sky-600"
                    />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Hanya Piutang</span>
                  </label>
                </div>

                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={debtsStatusFilter === 'unpaid_only'}
                    onChange={(e) =>
                      setDebtsStatusFilter(e.target.checked ? 'unpaid_only' : 'all')
                    }
                    className="rounded text-sky-600"
                  />
                  <span className="text-slate-700 dark:text-slate-300">
                    Sembunyikan yang sudah lunas (Hanya yang masih ada sisa)
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* ---------------- 7. TRANSAKSI ---------------- */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
            <div className="p-3.5 flex items-center justify-between">
              <button
                type="button"
                onClick={() => toggleModule('transactions')}
                className="flex items-center gap-3 flex-1 text-left cursor-pointer"
              >
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                    modules.transactions
                      ? 'bg-sky-600 text-white'
                      : 'border-2 border-slate-300 dark:border-slate-600 text-transparent'
                  }`}
                >
                  <CheckSquare className="w-4 h-4" />
                </div>
                <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <AppIcon name="lainnya-transaksi" className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white block">
                    7. Daftar Transaksi Terperinci
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                    Tabel mutasi buku kas sesuai rentang tanggal
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  setExpandedSettings(expandedSettings === 'transactions' ? null : 'transactions')
                }
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                {expandedSettings === 'transactions' ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            </div>

            {expandedSettings === 'transactions' && (
              <div className="px-4 pb-3.5 pt-1 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-800/40 text-xs space-y-2.5">
                {/* Jenis Transaksi */}
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Jenis Transaksi:
                  </span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { id: 'all', label: 'Semua' },
                      { id: 'expense', label: 'Pengeluaran' },
                      { id: 'income', label: 'Pemasukan' },
                      { id: 'transfer', label: 'Transfer' },
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTransactionsTypeFilter(t.id as any)}
                        className={`py-1 px-2 rounded-lg text-[11px] font-bold transition-all text-center cursor-pointer ${
                          transactionsTypeFilter === t.id
                            ? 'bg-amber-500 text-white shadow-2xs'
                            : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Urutan Transaksi */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Urutan Tanggal:
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setTransactionsSort('desc')}
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
                        transactionsSort === 'desc'
                          ? 'bg-sky-600 text-white'
                          : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      Terbaru di Atas
                    </button>
                    <button
                      type="button"
                      onClick={() => setTransactionsSort('asc')}
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
                        transactionsSort === 'asc'
                          ? 'bg-sky-600 text-white'
                          : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      Terlama di Atas
                    </button>
                  </div>
                </div>

                {/* Filter Akun untuk Transaksi */}
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Filter Akun Transaksi:
                  </span>
                  <select
                    value={transactionsAccountId}
                    onChange={(e) => setTransactionsAccountId(e.target.value)}
                    className="w-full text-xs font-semibold p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="all">Semua Akun / Dompet</option>
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* DEDICATED INLINE ACTION CARD (PREVIEW PDF & EXPORT PDF) */}
        {/* ========================================================================= */}
        <div className="bg-gradient-to-br from-white via-sky-50/70 to-blue-50/90 dark:from-slate-900 dark:via-slate-800/90 dark:to-slate-900 rounded-3xl p-5 border-2 border-sky-300/80 dark:border-sky-700/60 shadow-lg shadow-sky-500/10 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-white flex items-center justify-center shadow-md shadow-sky-500/30 shrink-0">
              <Download className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                Siap Cetak &amp; Simpan Dokumen PDF
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                {selectedCount > 0
                  ? `${selectedCount} modul aktif dipilih. Format rapi berstandar A4 siap cetak.`
                  : 'Pilih minimal 1 modul di atas untuk mulai membuat laporan PDF.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Tombol Preview PDF */}
            <button
              type="button"
              disabled={selectedCount === 0 || isGenerating}
              onClick={handlePreviewPDF}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-extrabold text-sm border-2 border-slate-200 dark:border-slate-700 shadow-xs hover:border-sky-400 dark:hover:border-sky-500 active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Eye className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0" />
              <span>Preview PDF</span>
            </button>

            {/* Tombol Export PDF */}
            <button
              type="button"
              disabled={selectedCount === 0 || isGenerating}
              onClick={handleDownloadPDF}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-sky-600 via-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-extrabold text-sm shadow-lg shadow-sky-500/30 active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Menyiapkan PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5 shrink-0" />
                  <span>Export PDF ({selectedCount} Modul)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>


      {/* ========================================================================= */}
      {/* MODAL PRATINJAU PDF BERBASIS CANVAS (KOMPATIBEL ANDROID & iOS CHROME) */}
      {/* ========================================================================= */}
      {previewPdfData && (
        <PdfCanvasViewer
          pdfData={previewPdfData}
          filename={previewFilename}
          onDownload={handleDownloadPDF}
          onClose={closePreview}
        />
      )}

      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs sm:text-sm font-bold animate-in slide-in-from-top-4 fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
          <span>Laporan PDF berhasil diunduh ke perangkat Anda!</span>
        </div>
      )}
    </div>
  );
};

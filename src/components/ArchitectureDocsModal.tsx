import React, { useState } from 'react';
import {
  X,
  Database,
  GitMerge,
  FolderTree,
  FileCode2,
  Copy,
  Check,
  Shield,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface ArchitectureDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureDocsModal: React.FC<ArchitectureDocsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'schema' | 'sync' | 'folders' | 'code'>('schema');
  const [copied, setCopied] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const sqlSchemaCode = `-- ============================================================================
-- SKEMA DATABASE RELASIONAL SUPABASE (POSTGRESQL) - KELUARGA FIN PWA
-- ============================================================================

-- Aktifkan ekstensi UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABEL WORKSPACES (Buku Kas Bersama Keluarga)
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  currency VARCHAR(10) DEFAULT 'IDR',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABEL USERS (Profil Suami & Istri terhubung ke workspace)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('husband', 'wife', 'admin')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABEL ACCOUNTS (Rekening Bank, E-Wallet, Dompet Tunai)
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(30) NOT NULL CHECK (type IN ('bank', 'ewallet', 'cash', 'investment')),
  account_number VARCHAR(50),
  balance NUMERIC(15, 2) NOT NULL DEFAULT 0,
  color VARCHAR(20) DEFAULT '#2563EB',
  is_active BOOLEAN DEFAULT TRUE,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABEL CATEGORIES (Hirarki Parent-Child Category)
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(50) DEFAULT 'Tag',
  color VARCHAR(20) DEFAULT '#3B82F6',
  type VARCHAR(20) NOT NULL CHECK (type IN ('expense', 'income')),
  is_system BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABEL TRANSACTIONS (Pencatatan Transaksi Finansial)
CREATE TABLE transactions (
  id UUID PRIMARY KEY, -- Digenerate di client via crypto.randomUUID()
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
  type VARCHAR(20) NOT NULL CHECK (type IN ('expense', 'income', 'transfer')),
  target_account_id UUID REFERENCES accounts(id) ON DELETE RESTRICT,
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  transaction_date TIMESTAMPTZ NOT NULL,
  is_guilt_free BOOLEAN DEFAULT FALSE, -- Dompet Pribadi Suami/Istri
  guilt_free_owner VARCHAR(20) CHECK (guilt_free_owner IN ('husband', 'wife')),
  client_created_at TIMESTAMPTZ NOT NULL,
  server_received_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  version INT DEFAULT 1,
  is_deleted BOOLEAN DEFAULT FALSE
);

-- 6. TABEL BUDGETS (Anggaran Bulanan & Rollover Engine)
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  period_month VARCHAR(7) NOT NULL, -- Format: 'YYYY-MM'
  limit_amount NUMERIC(15, 2) NOT NULL CHECK (limit_amount >= 0),
  rollover_amount NUMERIC(15, 2) DEFAULT 0,
  rollover_action VARCHAR(20) DEFAULT 'rollover' CHECK (rollover_action IN ('rollover', 'savings', 'reset')),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_category_budget_month UNIQUE (workspace_id, category_id, period_month)
);

-- 7. TABEL SHARED_GOALS (Target Tabungan Bersama)
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  target_amount NUMERIC(15, 2) NOT NULL CHECK (target_amount > 0),
  current_amount NUMERIC(15, 2) DEFAULT 0,
  target_date DATE,
  icon VARCHAR(50) DEFAULT 'Target',
  notes TEXT,
  is_completed BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. TABEL SYNC_AUDIT_LOG (Audit antrean mutasi untuk debugging)
CREATE TABLE sync_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  entity_table VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  operation VARCHAR(20) NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  payload JSONB NOT NULL,
  client_timestamp TIMESTAMPTZ NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'processed'
);

-- ============================================================================
-- INDEXES & ROW LEVEL SECURITY (RLS)
-- ============================================================================
CREATE INDEX idx_transactions_workspace ON transactions(workspace_id, transaction_date DESC);
CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_updated_at ON transactions(updated_at DESC);
CREATE INDEX idx_accounts_workspace ON accounts(workspace_id);
CREATE INDEX idx_budgets_period ON budgets(workspace_id, period_month);

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

-- Helper Function: Ambil workspace_id dari user login
CREATE OR REPLACE FUNCTION get_user_workspace_id()
RETURNS UUID AS $$
  SELECT workspace_id FROM users WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Kebijakan RLS Transaksi (Suami & Istri satu workspace dapat membaca & menulis)
CREATE POLICY "Akses Transaksi Bersama Workspace"
ON transactions FOR ALL
USING (workspace_id = get_user_workspace_id())
WITH CHECK (workspace_id = get_user_workspace_id());

-- ============================================================================
-- STORED PROCEDURE: BATCH SYNC DENGAN LAST-WRITE-WINS (LWW)
-- ============================================================================
CREATE OR REPLACE FUNCTION process_sync_batch(
  p_mutations JSONB
)
RETURNS JSONB AS $$
DECLARE
  v_mutation JSONB;
  v_processed INT := 0;
BEGIN
  FOR v_mutation IN SELECT * FROM jsonb_array_elements(p_mutations)
  LOOP
    IF (v_mutation->>'entityTable') = 'transactions' THEN
      IF (v_mutation->>'operation') = 'INSERT' THEN
        INSERT INTO transactions (
          id, workspace_id, account_id, category_id, user_id, amount,
          type, target_account_id, tags, notes, transaction_date,
          is_guilt_free, guilt_free_owner, client_created_at, updated_at, version, is_deleted
        )
        VALUES (
          (v_mutation->'payload'->>'id')::UUID,
          (v_mutation->'payload'->>'workspaceId')::UUID,
          (v_mutation->'payload'->>'accountId')::UUID,
          (v_mutation->'payload'->>'categoryId')::UUID,
          (v_mutation->'payload'->>'userId')::UUID,
          (v_mutation->'payload'->>'amount')::NUMERIC,
          (v_mutation->'payload'->>'type')::VARCHAR,
          (v_mutation->'payload'->>'targetAccountId')::UUID,
          ARRAY(SELECT jsonb_array_elements_text(v_mutation->'payload'->'tags')),
          v_mutation->'payload'->>'notes',
          (v_mutation->'payload'->>'transactionDate')::TIMESTAMPTZ,
          COALESCE((v_mutation->'payload'->>'isGuiltFree')::BOOLEAN, FALSE),
          v_mutation->'payload'->>'guiltFreeOwner',
          (v_mutation->'payload'->>'clientCreatedAt')::TIMESTAMPTZ,
          (v_mutation->'payload'->>'updatedAt')::TIMESTAMPTZ,
          COALESCE((v_mutation->'payload'->>'version')::INT, 1),
          FALSE
        )
        ON CONFLICT (id) DO UPDATE
        -- Konflik LWW: Perbarui hanya jika timestamp payload lebih baru
        SET
          amount = EXCLUDED.amount,
          notes = EXCLUDED.notes,
          tags = EXCLUDED.tags,
          updated_at = EXCLUDED.updated_at,
          version = transactions.version + 1
        WHERE EXCLUDED.updated_at >= transactions.updated_at;

      ELSIF (v_mutation->>'operation') = 'DELETE' THEN
        UPDATE transactions
        SET is_deleted = TRUE, updated_at = NOW()
        WHERE id = (v_mutation->'payload'->>'id')::UUID;
      END IF;
      v_processed := v_processed + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object('success', true, 'processedCount', v_processed);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;`;

  const folderStructureText = `keluargafin-pwa/
├── app/                              # Next.js App Router (v14/15+)
│   ├── (auth)/                       # Rute Otentikasi
│   │   ├── login/page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/                  # Rute Utama Aplikasi (Protected)
│   │   ├── layout.tsx                # Shell Layout (Navigasi & PWA status)
│   │   ├── page.tsx                  # Dashboard Ikhtisar & Saldo
│   │   ├── transactions/
│   │   │   ├── page.tsx              # Riwayat Transaksi & Filter
│   │   │   └── new/page.tsx          # Form Input Transaksi Cepat
│   │   ├── budgets/
│   │   │   └── page.tsx              # Anggaran & Rollover Manager
│   │   ├── goals/
│   │   │   └── page.tsx              # Target Tabungan Bersama
│   │   ├── guilt-free/
│   │   │   └── page.tsx              # Dompet Jajan Suami/Istri
│   │   └── settings/
│   │       └── page.tsx              # Kelola Rekening, PIN & Anggota
│   ├── api/
│   │   └── sync/
│   │       └── route.ts              # API Route penanganan batch sync
│   ├── manifest.ts                   # Metadata PWA Web App Manifest
│   └── layout.tsx                    # Root Layout (Font, Provider)
├── components/                       # Reusable UI & Fitur
│   ├── dashboard/
│   │   ├── AccountCards.tsx          # Card Saldo Bank & E-Wallet
│   │   ├── NetWorthCard.tsx          # Ringkasan Total Harta Bersih
│   │   └── CashflowChart.tsx         # Grafik Pemasukan vs Pengeluaran
│   ├── transactions/
│   │   ├── TransactionForm.tsx       # Form Non-Blocking Instant Input
│   │   ├── CategoryPicker.tsx        # Parent & Sub-Category Selector
│   │   └── TagInput.tsx              # Tagging ("Anak Laki-laki", dll)
│   ├── sync/
│   │   ├── SyncStatusBar.tsx         # Indikator Online/Offline/Syncing
│   │   └── SyncQueueDrawer.tsx       # Inspeksi Antrean Mutasi Lokal
│   ├── security/
│   │   └── PinLockShield.tsx         # Proteksi PIN lokal / Biometrik
│   └── ui/                           # Komponen Primitif (Button, Modal, Input)
├── lib/
│   ├── db/
│   │   ├── indexedDb.ts              # Schema & Adapter IndexedDB Klien (idb/Dexie)
│   │   └── syncQueue.ts              # Engine Antrean Mutasi Offline
│   ├── supabase/
│   │   ├── client.ts                 # Supabase Client Browser SDK
│   │   ├── server.ts                 # Supabase Server Client (SSR)
│   │   └── rpc.ts                    # Wrapper Pemanggilan RPC Database
│   ├── hooks/
│   │   ├── useNetworkStatus.ts       # Hook Deteksi Online/Offline
│   │   ├── useSyncEngine.ts          # Hook Pengelola Antrean & Trigger Sync
│   │   └── useAppLock.ts             # Hook Proteksi PIN Session Timeout
│   └── utils/
│       ├── formatters.ts             # Format Rupiah & Tanggal Indonesia
│       └── uuid.ts                   # Client-side UUID generator
├── public/
│   ├── sw.js                         # Service Worker (Cache & Background Sync)
│   ├── icons/                        # PWA Icons (192x192, 512x512)
│   └── favicon.ico
├── supabase/
│   └── migrations/
│       └── 20261013000000_init_keluarga_fin.sql  # Skema Lengkap Supabase
├── types/
│   ├── database.types.ts             # Tipe Auto-Generated Supabase
│   └── finance.ts                    # Domain Models & DTOs
├── next.config.mjs                   # Konfigurasi Next.js & PWA
├── package.json
└── tsconfig.json`;

  const syncArchitectureText = `1. FILOSOFI OFFLINE-FIRST: "WRITE LOCALLY, SYNC EVENTUALLY"
-------------------------------------------------------------------------------
Di aplikasi finansial modern (seperti StarJar / S'lesai), pengguna tidak boleh 
terhenti oleh loading spinner atau jaringan 3G yang buruk. Seluruh operasi tulis 
(Write Operation) disimpan ke IndexedDB klien terlebih dahulu dalam < 10ms.

2. ANATOMI CLIENT-SIDE UUID & TIMESTAMPS
-------------------------------------------------------------------------------
* Mengapa UUID di Client?
  Jika menggunakan ID Auto-Increment (1, 2, 3) di database server, klien offline 
  tidak tahu nomor ID berikutnya. Menghasilkan 'crypto.randomUUID()' di browser 
  menjamin ID transaksi sudah valid secara global sejak detik pertama disimpan.
  
* Format Waktu:
  - client_created_at: Waktu lokal saat pengguna menekan tombol Simpan (ISO-8601 UTC).
  - updated_at: Waktu modifikasi terakhir (digunakan untuk resolusi konflik LWW).
  - server_received_at: Waktu server Supabase menerima paket sinkronisasi.

3. SIKLUS HIDUP ANTREAN MUTASI (SYNC QUEUE)
-------------------------------------------------------------------------------
[User Submit Transaksi]
        │
        ▼
[Simpan ke IndexedDB 'transactions'] (Optimistic UI: saldo langsung berubah)
        │
        ▼
[Catat ke IndexedDB 'sync_queue'] 
  - status: 'pending'
  - operation: 'INSERT' | 'UPDATE' | 'DELETE'
  - payload: { id, amount, category_id, ... }
        │
        ├────────────────────────┬────────────────────────┐
        ▼ (Jika Browser Online)   ▼ (Jika Browser Offline)  ▼ (Background Sync SW)
[Kirim Batch ke Supabase]      [Tahan di IndexedDB]    [Service Worker daftarkan 'sync' event]
        │                                 │                       │
        │                                 └── Saat Online ────────┘
        ▼
[Supabase RPC 'process_sync_batch']
        │
        ▼
[Resolusi Konflik: Last-Write-Wins (LWW)]
  - Jika timestamp klien >= timestamp server: Update diterima.
  - Jika timestamp server lebih baru: Versi server dipertahankan.
        │
        ▼
[Response Sukses] ──> [Hapus / Tandai 'synced' pada 'sync_queue' lokal]`;

  const transactionFormComponentCode = `// components/transactions/TransactionForm.tsx
'use client';

import React, { useState } from 'react';
import { db } from '@/lib/db/indexedDb';
import { syncQueue } from '@/lib/db/syncQueue';
import { formatRupiah } from '@/lib/utils/formatters';

interface TransactionFormProps {
  workspaceId: string;
  userId: string;
  accounts: Array<{ id: string; name: string; balance: number }>;
  categories: Array<{ id: string; name: string; parentId?: string | null }>;
  onSuccess?: () => void;
}

export function TransactionForm({
  workspaceId,
  userId,
  accounts,
  categories,
  onSuccess,
}: TransactionFormProps) {
  const [amount, setAmount] = useState<string>('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [accountId, setAccountId] = useState<string>(accounts[0]?.id || '');
  const [categoryId, setCategoryId] = useState<string>(categories[0]?.id || '');
  const [notes, setNotes] = useState<string>('');
  const [tags, setTags] = useState<string[]>(['Operasional Rumah']);
  const [isGuiltFree, setIsGuiltFree] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(amount.replace(/[^0-9]/g, ''));
    if (!numericAmount || numericAmount <= 0) return;

    setIsSubmitting(true);

    try {
      // 1. Generate UUID v4 secara instan di klien
      const transactionId = crypto.randomUUID();
      const now = new Date().toISOString();

      const newTransaction = {
        id: transactionId,
        workspaceId,
        accountId,
        categoryId,
        userId,
        amount: numericAmount,
        type,
        tags,
        notes,
        transactionDate: now,
        isGuiltFree,
        guiltFreeOwner: isGuiltFree ? 'husband' : null,
        clientCreatedAt: now,
        updatedAt: now,
        version: 1,
        isDeleted: false,
      };

      // 2. Simpan secara atomik ke IndexedDB lokal (Zero Blocking)
      await db.transactions.add(newTransaction);

      // 3. Masukkan ke Antrean Sinkronisasi (Sync Queue)
      await syncQueue.enqueue({
        id: crypto.randomUUID(),
        entityTable: 'transactions',
        entityId: transactionId,
        operation: 'INSERT',
        payload: newTransaction,
        clientTimestamp: now,
        status: 'pending',
        retryCount: 0,
      });

      // 4. Update saldo rekening lokal secara instan (Optimistic)
      await db.accounts.updateBalance(accountId, numericAmount, type);

      // 5. Trigger sinkronisasi jika online (Background execution, tidak memblokir UI)
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        syncQueue.triggerProcess().catch(console.error);
      }

      // Reset form & panggil callback
      setAmount('');
      setNotes('');
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Gagal mencatat transaksi ke IndexedDB:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Input Nominal Cepat */}
      <div>
        <label className="text-xs font-semibold text-slate-500">Nominal (Rp)</label>
        <input
          type="text"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0"
          required
          className="w-full text-2xl font-bold p-3 border rounded-xl font-mono tabular-nums focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Pilihan Rekening */}
      <div>
        <label className="text-xs font-semibold text-slate-500">Sumber Rekening</label>
        <select
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          className="w-full p-2.5 border rounded-lg text-sm bg-white"
        >
          {accounts.map((acc) => (
            <option key={acc.id} value={acc.id}>
              {acc.name} ({formatRupiah(acc.balance)})
            </option>
          ))}
        </select>
      </div>

      {/* Pilihan Kategori */}
      <div>
        <label className="text-xs font-semibold text-slate-500">Kategori</label>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full p-2.5 border rounded-lg text-sm bg-white"
        >
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Tombol Simpan Instan */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors shadow-sm"
      >
        Simpan Transaksi (Offline-Ready)
      </button>
    </form>
  );
}`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-900 text-white rounded-lg">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">
                Blueprint Arsitektur & Skema Supabase
              </h2>
              <p className="text-xs text-slate-500">
                Spesifikasi teknis arsitektur Offline-First PWA KeluargaFin untuk Next.js & Supabase
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-6 border-b border-slate-200 bg-white">
          <button
            onClick={() => setActiveTab('schema')}
            className={`flex items-center gap-2 py-3 px-3.5 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'schema'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>1. Skema Database Supabase</span>
          </button>

          <button
            onClick={() => setActiveTab('sync')}
            className={`flex items-center gap-2 py-3 px-3.5 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'sync'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <GitMerge className="w-3.5 h-3.5" />
            <span>2. Strategi Offline-Sync & LWW</span>
          </button>

          <button
            onClick={() => setActiveTab('folders')}
            className={`flex items-center gap-2 py-3 px-3.5 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'folders'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FolderTree className="w-3.5 h-3.5" />
            <span>3. Struktur Folder Next.js</span>
          </button>

          <button
            onClick={() => setActiveTab('code')}
            className={`flex items-center gap-2 py-3 px-3.5 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'code'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileCode2 className="w-3.5 h-3.5" />
            <span>4. Kode Form Input Transaksi</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {activeTab === 'schema' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    DDL SQL Supabase (PostgreSQL 15+)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Mencakup 8 tabel relasional, foreign keys, RLS security policies, dan stored procedure batching
                  </p>
                </div>
                <button
                  onClick={() => handleCopy(sqlSchemaCode, 'schema')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition-colors shadow-xs"
                >
                  {copied === 'schema' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin SQL Lengkap</span>
                    </>
                  )}
                </button>
              </div>

              <div className="bg-slate-900 text-slate-100 rounded-xl p-4 text-xs font-mono overflow-x-auto shadow-inner border border-slate-800">
                <pre>{sqlSchemaCode}</pre>
              </div>
            </div>
          )}

          {activeTab === 'sync' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Logika & Strategi Sinkronisasi Offline-ke-Online
                  </h3>
                  <p className="text-xs text-slate-500">
                    Arsitektur Last-Write-Wins (LWW), Client UUID, dan Antrean Mutasi
                  </p>
                </div>
                <button
                  onClick={() => handleCopy(syncArchitectureText, 'sync')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition-colors"
                >
                  {copied === 'sync' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Salin Panduan</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-white rounded-xl border border-slate-200">
                  <div className="text-xs font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[11px]">1</span>
                    Client UUID v4
                  </div>
                  <p className="text-xs text-slate-600">
                    Semua transaksi digenerate menggunakan <code>crypto.randomUUID()</code> di browser agar siap direferensikan tanpa round-trip jaringan.
                  </p>
                </div>

                <div className="p-4 bg-white rounded-xl border border-slate-200">
                  <div className="text-xs font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[11px]">2</span>
                    Antrean Mutasi Lokal
                  </div>
                  <p className="text-xs text-slate-600">
                    Setiap mutasi masuk ke tabel lokal <code>sync_queue</code> di IndexedDB. Saat online terdeteksi, antrean dikirim secara batch.
                  </p>
                </div>

                <div className="p-4 bg-white rounded-xl border border-slate-200">
                  <div className="text-xs font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-[11px]">3</span>
                    Last-Write-Wins (LWW)
                  </div>
                  <p className="text-xs text-slate-600">
                    Konflik antar perangkat (suami vs istri) diselesaikan dengan membandingkan <code>updated_at</code> secara atomik di database Postgres.
                  </p>
                </div>
              </div>

              <div className="bg-slate-900 text-slate-100 rounded-xl p-4 text-xs font-mono overflow-x-auto shadow-inner border border-slate-800">
                <pre>{syncArchitectureText}</pre>
              </div>
            </div>
          )}

          {activeTab === 'folders' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Struktur Folder Next.js (App Router) yang Direkomendasikan
                  </h3>
                  <p className="text-xs text-slate-500">
                    Struktur folder berorientasi domain, PWA service worker, dan clean separation of concerns
                  </p>
                </div>
                <button
                  onClick={() => handleCopy(folderStructureText, 'folders')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition-colors"
                >
                  {copied === 'folders' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Salin Struktur</span>
                </button>
              </div>

              <div className="bg-slate-900 text-emerald-300 rounded-xl p-4 text-xs font-mono overflow-x-auto shadow-inner border border-slate-800">
                <pre>{folderStructureText}</pre>
              </div>
            </div>
          )}

          {activeTab === 'code' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Komponen Form Input Transaksi (Next.js + TypeScript + IndexedDB)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Form instan tanpa spinner blocking, langsung mengupdate saldo lokal & memasukkan payload ke Sync Queue
                  </p>
                </div>
                <button
                  onClick={() => handleCopy(transactionFormComponentCode, 'code')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition-colors"
                >
                  {copied === 'code' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Salin Kode Komponen</span>
                </button>
              </div>

              <div className="bg-slate-900 text-slate-100 rounded-xl p-4 text-xs font-mono overflow-x-auto shadow-inner border border-slate-800">
                <pre>{transactionFormComponentCode}</pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-white border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span>Mendukung multi-user husband & wife shared workspace dengan Row Level Security</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

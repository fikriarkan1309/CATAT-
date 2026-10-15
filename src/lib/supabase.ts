import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Local storage key for dynamic configuration
const SUPABASE_CONFIG_KEY = 'keluarga_fin_supabase_config';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

// Get saved credentials from environment or localStorage
export function getSupabaseConfig(): SupabaseConfig {
  // Check localStorage first (user runtime configuration)
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(SUPABASE_CONFIG_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.url && parsed.anonKey) {
          return { url: parsed.url.trim(), anonKey: parsed.anonKey.trim() };
        }
      }
    } catch {
      // fallback
    }
  }

  // Fallback to Vite environment variables or user provided default credentials
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const defaultUrl = 'https://zhytgblrjzhfajsbfreh.supabase.co';
  const defaultKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpoeXRnYmxyanpoZmFqc2JmcmVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE5NjcwMzgsImV4cCI6MjEwNzU0MzAzOH0.aEFthPU4-E6W0xsPFFwGtxwTnb95IWzF4cm_gkUFLn4';

  return {
    url: typeof envUrl === 'string' && envUrl.trim() ? envUrl.trim() : defaultUrl,
    anonKey: typeof envKey === 'string' && envKey.trim() ? envKey.trim() : defaultKey,
  };
}

let cachedClient: SupabaseClient | null = null;
let currentClientKey = '';

export function getSupabaseClient(): SupabaseClient | null {
  const config = getSupabaseConfig();
  if (!config.url || !config.anonKey) {
    return null;
  }

  const key = `${config.url}_${config.anonKey}`;
  if (cachedClient && currentClientKey === key) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
    currentClientKey = key;
    return cachedClient;
  } catch (err) {
    console.warn('Failed to initialize Supabase client:', err);
    return null;
  }
}

export function isSupabaseConfigured(): boolean {
  const config = getSupabaseConfig();
  return Boolean(config.url && config.anonKey && config.url.startsWith('https://'));
}

export function saveSupabaseConfig(url: string, anonKey: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    let cleanUrl = url.trim();
    // Remove /rest/v1/ or any trailing slash if present
    cleanUrl = cleanUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
    const cleanKey = anonKey.trim();
    if (!cleanUrl || !cleanKey) {
      localStorage.removeItem(SUPABASE_CONFIG_KEY);
    } else {
      localStorage.setItem(
        SUPABASE_CONFIG_KEY,
        JSON.stringify({ url: cleanUrl, anonKey: cleanKey })
      );
    }
    // Invalidate cached client to recreate on next call
    cachedClient = null;
    currentClientKey = '';
    return true;
  } catch {
    return false;
  }
}

export function clearSupabaseConfig(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SUPABASE_CONFIG_KEY);
    cachedClient = null;
    currentClientKey = '';
  }
}

// Test connection to Supabase
export async function testSupabaseConnection(url?: string, anonKey?: string): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const targetUrl = url || getSupabaseConfig().url;
    const targetKey = anonKey || getSupabaseConfig().anonKey;

    if (!targetUrl || !targetKey) {
      return {
        success: false,
        message: 'Project URL atau Anon Key Supabase masih kosong.',
      };
    }

    if (!targetUrl.startsWith('https://')) {
      return {
        success: false,
        message: 'Project URL harus dimulai dengan https:// (contoh: https://xyz.supabase.co)',
      };
    }

    const testClient = createClient(targetUrl, targetKey);
    // Ping auth session or basic endpoint
    const { error } = await testClient.auth.getSession();
    if (error && error.message && !error.message.includes('Auth session missing')) {
      return {
        success: false,
        message: `Koneksi gagal: ${error.message}`,
      };
    }

    return {
      success: true,
      message: 'Koneksi ke Supabase berhasil! Database dan otentikasi siap digunakan.',
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Gagal menghubungi server Supabase: ${err?.message || 'Periksa URL dan kunci'}`,
    };
  }
}

// Full SQL Schema migration ready to execute in Supabase SQL Editor
export const SUPABASE_SQL_SCHEMA = `-- =========================================================================
-- KELUARGAFIN DATABASE SCHEMA FOR SUPABASE (POSTGRESQL)
-- Siap di-copy dan di-paste langsung ke SQL Editor di Dashboard Supabase
-- =========================================================================

-- 1. Tabel Profil Akun Keluarga (Terkoneksi ke auth.users Supabase)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  account_name TEXT NOT NULL DEFAULT 'Akun Keluarga',
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabel Rekening & Dompet
CREATE TABLE IF NOT EXISTS public.accounts (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  workspace_id TEXT DEFAULT 'ws-default',
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'bank',
  currency TEXT DEFAULT 'IDR',
  account_number TEXT DEFAULT '',
  balance NUMERIC NOT NULL DEFAULT 0,
  initial_balance NUMERIC NOT NULL DEFAULT 0,
  color TEXT DEFAULT '#2563EB',
  is_archived BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabel Kategori Keuangan
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  workspace_id TEXT DEFAULT 'ws-default',
  parent_id TEXT,
  name TEXT NOT NULL,
  icon TEXT DEFAULT 'tag',
  color TEXT DEFAULT '#64748B',
  type TEXT NOT NULL, -- 'expense' atau 'income'
  is_system BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE
);

-- 4. Tabel Transaksi Keuangan
CREATE TABLE IF NOT EXISTS public.transactions (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  workspace_id TEXT DEFAULT 'ws-default',
  account_id TEXT NOT NULL,
  category_id TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  type TEXT NOT NULL, -- 'expense', 'income', 'transfer'
  target_account_id TEXT,
  party_from TEXT,
  party_to TEXT,
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  transaction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_guilt_free BOOLEAN DEFAULT FALSE,
  guilt_free_owner TEXT,
  client_created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  version INT DEFAULT 1,
  is_deleted BOOLEAN DEFAULT FALSE
);

-- 5. Tabel Anggaran (Budget)
CREATE TABLE IF NOT EXISTS public.budgets (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  workspace_id TEXT DEFAULT 'ws-default',
  category_id TEXT NOT NULL,
  account_id TEXT DEFAULT 'all',
  duration TEXT DEFAULT '1_month',
  start_date TEXT,
  end_date TEXT,
  period_month TEXT,
  limit_amount NUMERIC NOT NULL DEFAULT 0,
  rollover_amount NUMERIC NOT NULL DEFAULT 0,
  rollover_action TEXT DEFAULT 'rollover',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE
);

-- 6. Tabel Target Tabungan Bersama (Shared Goals)
CREATE TABLE IF NOT EXISTS public.goals (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  workspace_id TEXT DEFAULT 'ws-default',
  name TEXT NOT NULL,
  target_amount NUMERIC NOT NULL,
  current_amount NUMERIC NOT NULL DEFAULT 0,
  target_date TEXT,
  icon TEXT DEFAULT 'target',
  color TEXT DEFAULT '#3B82F6',
  notes TEXT,
  is_completed BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Tabel Tagihan Rutin (Recurring Bills)
CREATE TABLE IF NOT EXISTS public.bills (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  workspace_id TEXT DEFAULT 'ws-default',
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  category_id TEXT,
  account_id TEXT,
  due_day INT DEFAULT 1,
  frequency TEXT DEFAULT 'monthly',
  notes TEXT,
  paid_months TEXT[] DEFAULT '{}',
  last_paid_date TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE
);

-- 8. Tabel Hutang & Piutang (Debts & Loans)
CREATE TABLE IF NOT EXISTS public.debts (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  workspace_id TEXT DEFAULT 'ws-default',
  type TEXT NOT NULL, -- 'debt' (Hutang Saya) atau 'receivable' (Piutang Saya)
  person_name TEXT NOT NULL,
  phone TEXT,
  total_amount NUMERIC NOT NULL,
  paid_amount NUMERIC NOT NULL DEFAULT 0,
  start_date TEXT NOT NULL,
  due_date TEXT,
  notes TEXT,
  status TEXT DEFAULT 'active',
  payments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE
);

-- =========================================================================
-- AKTIFKAN ROW LEVEL SECURITY (RLS) & POLICY KEAMANAN
-- Memastikan setiap akun keluarga hanya bisa mengakses data mereka sendiri
-- =========================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;

-- Kebijakan RLS: User hanya dapat SELECT, INSERT, UPDATE, DELETE data miliknya
DROP POLICY IF EXISTS "profiles_policy" ON public.profiles;
CREATE POLICY "profiles_policy" ON public.profiles FOR ALL USING (auth.uid() = id);

DROP POLICY IF EXISTS "accounts_policy" ON public.accounts;
CREATE POLICY "accounts_policy" ON public.accounts FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "categories_policy" ON public.categories;
CREATE POLICY "categories_policy" ON public.categories FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "transactions_policy" ON public.transactions;
CREATE POLICY "transactions_policy" ON public.transactions FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "budgets_policy" ON public.budgets;
CREATE POLICY "budgets_policy" ON public.budgets FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "goals_policy" ON public.goals;
CREATE POLICY "goals_policy" ON public.goals FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "bills_policy" ON public.bills;
CREATE POLICY "bills_policy" ON public.bills FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "debts_policy" ON public.debts;
CREATE POLICY "debts_policy" ON public.debts FOR ALL USING (auth.uid() = user_id);

-- Trigger otomatis membuat profile saat user mendaftar via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, account_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'account_name', 'Akun Keluarga')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
`;

import {
  Account,
  Budget,
  BudgetDuration,
  Category,
  DebtItem,
  DebtPayment,
  RecurringBill,
  SharedGoal,
  SyncQueueItem,
  Transaction,
  UserRole,
} from '../types/finance';
import {
  INITIAL_ACCOUNTS,
  INITIAL_BILLS,
  INITIAL_BUDGETS,
  INITIAL_CATEGORIES,
  INITIAL_DEBTS,
  INITIAL_GOALS,
  INITIAL_GUILT_FREE,
  INITIAL_TRANSACTIONS,
} from './constants';
import { getSupabaseClient, isSupabaseConfigured } from './supabase';

const DB_NAME = 'keluarga_fin_offline_db';
const DB_VERSION = 1;

export interface RegisteredUser {
  accountName: string;
  email: string;
  password?: string;
  createdAt?: string;
}

interface StorageState {
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  goals: SharedGoal[];
  bills: RecurringBill[];
  debts: DebtItem[];
  syncQueue: SyncQueueItem[];
  guiltFree: typeof INITIAL_GUILT_FREE;
  activeRole: UserRole;
  userAccount: RegisteredUser;
  isAuthenticated: boolean;
  currentUserEmail?: string;
  isSimulatedOffline: boolean;
  isLocked: boolean;
  pin: string;
}

class OfflineStorageEngine {
  private db: IDBDatabase | null = null;
  private state: StorageState;
  private listeners: Set<() => void> = new Set();
  private isSyncing = false;
  private realtimeChannel: any = null;
  private heartbeatTimer: any = null;

  constructor() {
    this.state = {
      accounts: INITIAL_ACCOUNTS,
      categories: INITIAL_CATEGORIES,
      transactions: INITIAL_TRANSACTIONS,
      budgets: INITIAL_BUDGETS,
      goals: INITIAL_GOALS,
      bills: INITIAL_BILLS,
      debts: INITIAL_DEBTS,
      syncQueue: [],
      guiltFree: INITIAL_GUILT_FREE,
      activeRole: 'husband',
      userAccount: {
        accountName: '',
        email: '',
        password: '',
        createdAt: '',
      },
      isAuthenticated: false,
      currentUserEmail: '',
      isSimulatedOffline: false,
      isLocked: false,
      pin: '',
    };

    this.init();
  }

  private async syncAndPull(userId: string) {
    const supabase = getSupabaseClient();
    if (supabase && isSupabaseConfigured() && this.isOnline()) {
      await this.triggerSync();
      await this.pullFromSupabase(supabase, userId);
      this.setupRealtimeSubscription(userId);
    }
  }

  public async syncAndPullActiveUser() {
    const supabase = getSupabaseClient();
    if (!supabase || !isSupabaseConfigured() || !this.isOnline()) return;

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      if (userId) {
        await this.syncAndPull(userId);
      }
    } catch {}
  }

  private async init() {
    try {
      const activeEmail = localStorage.getItem('keluarga_fin_current_user');
      if (activeEmail) {
        const saved = localStorage.getItem(`keluarga_fin_state_${activeEmail}`);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            let userAccount = parsed.userAccount;
            if (!userAccount || !userAccount.email) {
              try {
                const usersRaw = localStorage.getItem('keluarga_fin_users');
                if (usersRaw) {
                  const users = JSON.parse(usersRaw);
                  if (users[activeEmail]) {
                    userAccount = {
                      email: activeEmail,
                      accountName: users[activeEmail].accountName,
                      password: users[activeEmail].password,
                      createdAt: users[activeEmail].createdAt || '',
                    };
                  }
                }
              } catch {}
            }

            this.state = {
              ...this.state,
              ...parsed,
              userAccount: userAccount || {
                accountName: '',
                email: activeEmail,
                password: '',
              },
              isAuthenticated: true,
              currentUserEmail: activeEmail,
              isSimulatedOffline: false,
              bills: Array.isArray(parsed.bills) ? parsed.bills : INITIAL_BILLS,
              debts: Array.isArray(parsed.debts) ? parsed.debts : INITIAL_DEBTS,
            };
            this.recalculateAccountBalances();
          } catch {
            // fallback
          }
        }
      }

      if (typeof window !== 'undefined' && 'indexedDB' in window) {
        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event: any) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains('transactions')) {
            db.createObjectStore('transactions', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('sync_queue')) {
            db.createObjectStore('sync_queue', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('accounts')) {
            db.createObjectStore('accounts', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('categories')) {
            db.createObjectStore('categories', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('budgets')) {
            db.createObjectStore('budgets', { keyPath: 'id' });
          }
        };

        request.onsuccess = (event: any) => {
          this.db = event.target.result;
        };
      }

      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('keluarga_fin_supabase_config');
        if (stored && stored.includes('/rest/v1')) {
          localStorage.removeItem('keluarga_fin_supabase_config');
          window.location.reload();
        }

        window.addEventListener('online', () => {
          this.notify();
          const supabase = getSupabaseClient();
          if (supabase && isSupabaseConfigured()) {
            supabase.auth.getUser().then(({ data }) => {
              if (data?.user) {
                this.syncAndPull(data.user.id);
              }
            });
          }
        });

        window.addEventListener('offline', () => {
          this.notify();
        });

        // Event saat kembali membuka tab / aplikasi (mendukung iPad / iPhone Safari)
        window.addEventListener('focus', () => {
          this.syncAndPullActiveUser();
        });

        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            this.syncAndPullActiveUser();
          }
        });

        // Heartbeat sinkronisasi latar belakang otomatis setiap 6 detik
        if (this.heartbeatTimer) {
          clearInterval(this.heartbeatTimer);
        }
        this.heartbeatTimer = setInterval(() => {
          if (this.isOnline() && !this.isSyncing) {
            this.syncAndPullActiveUser();
          }
        }, 6000);

        const supabase = getSupabaseClient();
        if (supabase && isSupabaseConfigured()) {
          supabase.auth.getSession().then(({ data }) => {
            if (data?.session?.user) {
              const u = data.session.user;
              const email = u.email || this.state.userAccount?.email || '';
              const accountName =
                u.user_metadata?.account_name ||
                this.state.userAccount?.accountName ||
                'Akun Keluarga';
              this.state.userAccount = {
                accountName,
                email,
                password: '••••••••',
                createdAt: u.created_at,
              };
              this.state.isAuthenticated = true;
              this.state.currentUserEmail = email;
              this.persist();
              this.syncAndPull(u.id);
            }
          }).catch(() => {});

          supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
              this.state.isAuthenticated = true;
              this.state.currentUserEmail = session.user.email || '';
              this.persist();
              this.setupRealtimeSubscription(session.user.id);
              this.syncAndPull(session.user.id);
            }
          });
        }
      }
    } catch {
      // storage unavailable
    }
  }

  private persist() {
    try {
      if (this.state.currentUserEmail) {
        localStorage.setItem(`keluarga_fin_state_${this.state.currentUserEmail}`, JSON.stringify(this.state));
        localStorage.setItem('keluarga_fin_current_user', this.state.currentUserEmail);
      }
      localStorage.setItem('keluarga_fin_state', JSON.stringify(this.state));
    } catch {
      // ignore
    }
    this.notify();
  }

  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  public getState(): StorageState {
    return { ...this.state };
  }

  public isOnline(): boolean {
    if (this.state.isSimulatedOffline) return false;
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }

  public isSyncInProgress(): boolean {
    return this.isSyncing;
  }

  public toggleSimulatedOffline() {
    this.state.isSimulatedOffline = !this.state.isSimulatedOffline;
    this.persist();
    if (this.isOnline()) {
      this.triggerSync();
    }
  }

  public setActiveRole(role: UserRole) {
    this.state.activeRole = role;
    this.persist();
  }

  public async signUp(input: {
    accountName: string;
    email: string;
    password?: string;
  }): Promise<{ success: boolean; message?: string }> {
    const cleanEmail = input.email.trim().toLowerCase();
    const cleanName = input.accountName.trim() || 'Akun Keluarga';
    const cleanPassword = input.password || 'password123';

    try {
      const usersRaw = localStorage.getItem('keluarga_fin_users');
      const users = usersRaw ? JSON.parse(usersRaw) : {};
      users[cleanEmail] = {
        email: cleanEmail,
        password: cleanPassword,
        accountName: cleanName,
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem('keluarga_fin_users', JSON.stringify(users));
    } catch {}

    const supabase = getSupabaseClient();
    if (supabase && isSupabaseConfigured() && this.isOnline()) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password: cleanPassword,
          options: {
            data: {
              account_name: cleanName,
            },
          },
        });

        if (error) {
          if (error.message.toLowerCase().includes('already registered')) {
            return {
              success: false,
              message: 'Email ini sudah terdaftar di Supabase. Silakan langsung masuk (login).',
            };
          }
          return {
            success: false,
            message: `Pendaftaran Supabase gagal: ${error.message}`,
          };
        }

        if (data.user) {
          try {
            await supabase.from('profiles').upsert({
              id: data.user.id,
              account_name: cleanName,
              email: cleanEmail,
              updated_at: new Date().toISOString(),
            });
          } catch {}
        }
      } catch (err: any) {
        return {
          success: false,
          message: `Koneksi Supabase error: ${err?.message || 'Gagal mendaftar'}`,
        };
      }
    }

    this.state = {
      ...this.state,
      accounts: [],
      categories: INITIAL_CATEGORIES,
      transactions: [],
      budgets: [],
      goals: [],
      bills: [],
      debts: [],
      syncQueue: [],
      userAccount: {
        accountName: cleanName,
        email: cleanEmail,
        password: cleanPassword,
        createdAt: new Date().toISOString(),
      },
      isAuthenticated: true,
      currentUserEmail: cleanEmail,
    };
    this.persist();
    return { success: true };
  }

  public async login(
    email: string,
    password?: string
  ): Promise<{ success: boolean; message?: string }> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password || 'password123';
    // =========================================================
    // =========================================================
    // BLOK MODE DEMO (demo@catatin.com) - MOCK DATA LENGKAP & KAYA
    // =========================================================
    if (cleanEmail === 'demo@catatin.com') {
      const today = new Date();
      const now = today.toISOString();
      const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
      
      const fmtDate = (daysAgo: number, timeStr = '12:00:00.000Z') => {
        const d = new Date(today);
        d.setDate(d.getDate() - daysAgo);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}T${timeStr}`;
      };

      const dayDateOnly = (daysAgo: number) => {
        const d = new Date(today);
        d.setDate(d.getDate() - daysAgo);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
      };

      this.state = {
        ...this.state,
        isAuthenticated: true,
        currentUserEmail: 'demo@catatin.com',
        userAccount: {
          accountName: 'Keluarga Bahagia (Demo)',
          email: 'demo@catatin.com',
          password: 'demo',
          createdAt: now,
        },
        isSimulatedOffline: false,
        accounts: [
          { id: 'acc-bca', workspaceId: 'ws-demo', name: 'BCA Rekening Utama', type: 'bank', currency: 'IDR', accountNumber: '8830192831', balance: 14850000, initialBalance: 10000000, color: '#2563EB', isArchived: false, updatedAt: now },
          { id: 'acc-mandiri', workspaceId: 'ws-demo', name: 'Bank Mandiri Tabungan', type: 'bank', currency: 'IDR', accountNumber: '137001928310', balance: 28500000, initialBalance: 25000000, color: '#0284C7', isArchived: false, updatedAt: now },
          { id: 'acc-cash-suami', workspaceId: 'ws-demo', name: 'Dompet Tunai Suami', type: 'cash', currency: 'IDR', balance: 1250000, initialBalance: 1500000, color: '#10B981', isArchived: false, updatedAt: now },
          { id: 'acc-cash-istri', workspaceId: 'ws-demo', name: 'Dompet Tunai Istri', type: 'cash', currency: 'IDR', balance: 2100000, initialBalance: 2000000, color: '#F59E0B', isArchived: false, updatedAt: now },
          { id: 'acc-gopay', workspaceId: 'ws-demo', name: 'GoPay & OVO Digital', type: 'ewallet', currency: 'IDR', balance: 850000, initialBalance: 500000, color: '#06B6D4', isArchived: false, updatedAt: now },
          { id: 'acc-bibit', workspaceId: 'ws-demo', name: 'Investasi Bibit (Reksadana & SBN)', type: 'investment', currency: 'IDR', balance: 45000000, initialBalance: 40000000, color: '#8B5CF6', isArchived: false, updatedAt: now },
        ],
        categories: [
          // 1. Kebutuhan Pokok & Sub-kategori
          { id: 'cat-pokok', workspaceId: 'ws-demo', parentId: null, name: 'Kebutuhan Pokok', icon: 'ShoppingBag', color: '#2563EB', type: 'expense', isSystem: true, isDeleted: false },
          { id: 'sub-belanja', workspaceId: 'ws-demo', parentId: 'cat-pokok', name: 'Belanja Bulanan Supermarket', icon: 'ShoppingCart', color: '#3B82F6', type: 'expense', isSystem: true, isDeleted: false },
          { id: 'sub-sayur', workspaceId: 'ws-demo', parentId: 'cat-pokok', name: 'Sayur & Daging Segar', icon: 'Apple', color: '#60A5FA', type: 'expense', isSystem: true, isDeleted: false },
          { id: 'sub-listrik', workspaceId: 'ws-demo', parentId: 'cat-pokok', name: 'Listrik, Air & Gas Rumah', icon: 'Zap', color: '#93C5FD', type: 'expense', isSystem: true, isDeleted: false },

          // 2. Makanan & Minuman & Sub-kategori
          { id: 'cat-makan', workspaceId: 'ws-demo', parentId: null, name: 'Makanan & Minuman', icon: 'Coffee', color: '#F59E0B', type: 'expense', isSystem: true, isDeleted: false },
          { id: 'sub-makan-luar', workspaceId: 'ws-demo', parentId: 'cat-makan', name: 'Restoran & Makan Luar', icon: 'Utensils', color: '#FBBF24', type: 'expense', isSystem: true, isDeleted: false },
          { id: 'sub-kopi', workspaceId: 'ws-demo', parentId: 'cat-makan', name: 'Kopi & Camilan Senja', icon: 'Coffee', color: '#FCD34D', type: 'expense', isSystem: true, isDeleted: false },
          { id: 'sub-delivery', workspaceId: 'ws-demo', parentId: 'cat-makan', name: 'Pesan Makanan Online', icon: 'Bike', color: '#FDE68A', type: 'expense', isSystem: true, isDeleted: false },

          // 3. Transportasi & Sub-kategori
          { id: 'cat-trans', workspaceId: 'ws-demo', parentId: null, name: 'Transportasi', icon: 'Car', color: '#6366F1', type: 'expense', isSystem: true, isDeleted: false },
          { id: 'sub-bensin', workspaceId: 'ws-demo', parentId: 'cat-trans', name: 'Bensin & BBM Kendaraan', icon: 'Fuel', color: '#818CF8', type: 'expense', isSystem: true, isDeleted: false },
          { id: 'sub-tol', workspaceId: 'ws-demo', parentId: 'cat-trans', name: 'Tol, Parkir & MRT', icon: 'Navigation', color: '#A5B4FC', type: 'expense', isSystem: true, isDeleted: false },
          { id: 'sub-servis', workspaceId: 'ws-demo', parentId: 'cat-trans', name: 'Servis Mobil & Motor', icon: 'Wrench', color: '#C7D2FE', type: 'expense', isSystem: true, isDeleted: false },

          // 4. Hiburan & Rekreasi & Sub-kategori
          { id: 'cat-hiburan', workspaceId: 'ws-demo', parentId: null, name: 'Hiburan & Rekreasi', icon: 'Film', color: '#EC4899', type: 'expense', isSystem: true, isDeleted: false },
          { id: 'sub-bioskop', workspaceId: 'ws-demo', parentId: 'cat-hiburan', name: 'Tiket Bioskop & Event', icon: 'Film', color: '#F472B6', type: 'expense', isSystem: true, isDeleted: false },
          { id: 'sub-streaming', workspaceId: 'ws-demo', parentId: 'cat-hiburan', name: 'Netflix & Spotify Family', icon: 'Tv', color: '#FBCFE8', type: 'expense', isSystem: true, isDeleted: false },
          { id: 'sub-wisata', workspaceId: 'ws-demo', parentId: 'cat-hiburan', name: 'Wisata Akhir Pekan', icon: 'Compass', color: '#FDA4AF', type: 'expense', isSystem: true, isDeleted: false },

          // 5. Pendidikan & Anak & Sub-kategori
          { id: 'cat-pendidikan', workspaceId: 'ws-demo', parentId: null, name: 'Pendidikan & Anak', icon: 'GraduationCap', color: '#8B5CF6', type: 'expense', isSystem: true, isDeleted: false },
          { id: 'sub-spp', workspaceId: 'ws-demo', parentId: 'cat-pendidikan', name: 'SPP & Iuran Sekolah', icon: 'School', color: '#A78BFA', type: 'expense', isSystem: true, isDeleted: false },
          { id: 'sub-les', workspaceId: 'ws-demo', parentId: 'cat-pendidikan', name: 'Buku & Les Privat', icon: 'BookOpen', color: '#C4B5FD', type: 'expense', isSystem: true, isDeleted: false },
          { id: 'sub-mainan', workspaceId: 'ws-demo', parentId: 'cat-pendidikan', name: 'Kebutuhan & Mainan Anak', icon: 'Smile', color: '#DDD6FE', type: 'expense', isSystem: true, isDeleted: false },

          // 6. Kesehatan & Perawatan & Sub-kategori
          { id: 'cat-kesehatan', workspaceId: 'ws-demo', parentId: null, name: 'Kesehatan & Perawatan', icon: 'HeartPulse', color: '#14B8A6', type: 'expense', isSystem: true, isDeleted: false },
          { id: 'sub-dokter', workspaceId: 'ws-demo', parentId: 'cat-kesehatan', name: 'Dokter, Klinik & Resep', icon: 'Stethoscope', color: '#2DD4BF', type: 'expense', isSystem: true, isDeleted: false },
          { id: 'sub-vitamin', workspaceId: 'ws-demo', parentId: 'cat-kesehatan', name: 'Vitamin, Madu & Suplemen', icon: 'Pill', color: '#5EEAD4', type: 'expense', isSystem: true, isDeleted: false },

          // 7. Pemasukan / Pendapatan & Sub-kategori
          { id: 'cat-income', workspaceId: 'ws-demo', parentId: null, name: 'Pemasukan Keluarga', icon: 'Wallet', color: '#10B981', type: 'income', isSystem: true, isDeleted: false },
          { id: 'sub-gaji-suami', workspaceId: 'ws-demo', parentId: 'cat-income', name: 'Gaji Pokok Suami', icon: 'Briefcase', color: '#34D399', type: 'income', isSystem: true, isDeleted: false },
          { id: 'sub-bisnis-istri', workspaceId: 'ws-demo', parentId: 'cat-income', name: 'Usaha Online Shop Istri', icon: 'ShoppingBag', color: '#6EE7B7', type: 'income', isSystem: true, isDeleted: false },
          { id: 'sub-freelance', workspaceId: 'ws-demo', parentId: 'cat-income', name: 'Proyek Tambahan & Freelance', icon: 'Laptop', color: '#A7F3D0', type: 'income', isSystem: true, isDeleted: false },
          { id: 'sub-dividen', workspaceId: 'ws-demo', parentId: 'cat-income', name: 'Dividen & Return Investasi', icon: 'TrendingUp', color: '#D1FAE5', type: 'income', isSystem: true, isDeleted: false },
        ],
        transactions: [
          // Hari Ini (0 days ago)
          { id: 'tx-demo-1', workspaceId: 'ws-demo', accountId: 'acc-bca', categoryId: 'sub-makan-luar', userId: 'demo', amount: 285000, type: 'expense', partyTo: 'Resto Sari Bundo', tags: ['Makan', 'Keluarga'], notes: 'Makan siang bareng keluarga', transactionDate: fmtDate(0, '12:30:00.000Z'), isGuiltFree: false, guiltFreeOwner: null, clientCreatedAt: now, updatedAt: now, version: 1, isDeleted: false },
          { id: 'tx-demo-2', workspaceId: 'ws-demo', accountId: 'acc-mandiri', categoryId: 'sub-bensin', userId: 'demo', amount: 250000, type: 'expense', partyTo: 'SPBU Pertamina', tags: ['BBM', 'Mobil'], notes: 'Isi Pertamax full tank', transactionDate: fmtDate(0, '08:15:00.000Z'), isGuiltFree: false, guiltFreeOwner: null, clientCreatedAt: now, updatedAt: now, version: 1, isDeleted: false },
          { id: 'tx-demo-3', workspaceId: 'ws-demo', accountId: 'acc-cash-suami', categoryId: 'sub-kopi', userId: 'demo', amount: 45000, type: 'expense', partyTo: 'Kopi Kenangan', tags: ['Ngopi'], notes: 'Ngopi santai sepulang kantor', transactionDate: fmtDate(0, '17:00:00.000Z'), isGuiltFree: true, guiltFreeOwner: 'husband', clientCreatedAt: now, updatedAt: now, version: 1, isDeleted: false },

          // Kemarin (1 day ago)
          { id: 'tx-demo-4', workspaceId: 'ws-demo', accountId: 'acc-bca', categoryId: 'sub-belanja', userId: 'demo', amount: 680000, type: 'expense', partyTo: 'Superindo Mall', tags: ['Belanja', 'Dapur'], notes: 'Belanja mingguan kebutuhan rumah', transactionDate: fmtDate(1, '19:20:00.000Z'), isGuiltFree: false, guiltFreeOwner: null, clientCreatedAt: now, updatedAt: now, version: 1, isDeleted: false },
          { id: 'tx-demo-5', workspaceId: 'ws-demo', accountId: 'acc-cash-istri', categoryId: 'sub-kopi', userId: 'demo', amount: 55000, type: 'expense', partyTo: 'Indomaret Point', tags: ['Jajan'], notes: 'Beli camilan & es krim sore', transactionDate: fmtDate(1, '16:10:00.000Z'), isGuiltFree: true, guiltFreeOwner: 'wife', clientCreatedAt: now, updatedAt: now, version: 1, isDeleted: false },

          // 2 Hari Lalu (2 days ago)
          { id: 'tx-demo-6', workspaceId: 'ws-demo', accountId: 'acc-bca', categoryId: 'sub-listrik', userId: 'demo', amount: 500000, type: 'expense', partyTo: 'PLN Mobile', tags: ['Listrik'], notes: 'Beli token listrik rumah', transactionDate: fmtDate(2, '10:00:00.000Z'), isGuiltFree: false, guiltFreeOwner: null, clientCreatedAt: now, updatedAt: now, version: 1, isDeleted: false },
          { id: 'tx-demo-7', workspaceId: 'ws-demo', accountId: 'acc-mandiri', categoryId: 'sub-tol', userId: 'demo', amount: 150000, type: 'expense', partyTo: 'Gerbang Tol Dalam Kota', tags: ['Tol'], notes: 'Isi saldo e-Toll', transactionDate: fmtDate(2, '14:30:00.000Z'), isGuiltFree: false, guiltFreeOwner: null, clientCreatedAt: now, updatedAt: now, version: 1, isDeleted: false },

          // 3 Hari Lalu (3 days ago)
          { id: 'tx-demo-8', workspaceId: 'ws-demo', accountId: 'acc-gopay', categoryId: 'sub-bioskop', userId: 'demo', amount: 160000, type: 'expense', partyTo: 'XXI Cinema Grand Indonesia', tags: ['Hiburan', 'Date'], notes: 'Nonton film animasi bareng anak', transactionDate: fmtDate(3, '18:45:00.000Z'), isGuiltFree: false, guiltFreeOwner: null, clientCreatedAt: now, updatedAt: now, version: 1, isDeleted: false },
          { id: 'tx-demo-9', workspaceId: 'ws-demo', accountId: 'acc-bca', categoryId: 'sub-les', userId: 'demo', amount: 120000, type: 'expense', partyTo: 'Gramedia Book Store', tags: ['Sekolah'], notes: 'Beli buku bacaan edukasi anak', transactionDate: fmtDate(3, '15:15:00.000Z'), isGuiltFree: false, guiltFreeOwner: null, clientCreatedAt: now, updatedAt: now, version: 1, isDeleted: false },

          // 4 Hari Lalu (4 days ago)
          { id: 'tx-demo-10', workspaceId: 'ws-demo', accountId: 'acc-cash-istri', categoryId: 'sub-sayur', userId: 'demo', amount: 185000, type: 'expense', partyTo: 'Pasar Segar Modern', tags: ['Dapur', 'Sayur'], notes: 'Beli sayuran segar & lauk seminggu', transactionDate: fmtDate(4, '07:30:00.000Z'), isGuiltFree: false, guiltFreeOwner: null, clientCreatedAt: now, updatedAt: now, version: 1, isDeleted: false },
          { id: 'tx-demo-11', workspaceId: 'ws-demo', accountId: 'acc-bca', categoryId: 'sub-vitamin', userId: 'demo', amount: 140000, type: 'expense', partyTo: 'Apotek Kimia Farma', tags: ['Kesehatan'], notes: 'Vitamin C & minyak ikan anak', transactionDate: fmtDate(4, '11:20:00.000Z'), isGuiltFree: false, guiltFreeOwner: null, clientCreatedAt: now, updatedAt: now, version: 1, isDeleted: false },

          // 5 Hari Lalu (5 days ago)
          { id: 'tx-demo-12', workspaceId: 'ws-demo', accountId: 'acc-bca', targetAccountId: 'acc-gopay', categoryId: 'sub-belanja', userId: 'demo', amount: 500000, type: 'transfer', partyTo: 'GoPay', tags: ['Transfer'], notes: 'Top up saldo e-wallet dompet digital', transactionDate: fmtDate(5, '09:00:00.000Z'), isGuiltFree: false, guiltFreeOwner: null, clientCreatedAt: now, updatedAt: now, version: 1, isDeleted: false },
          { id: 'tx-demo-13', workspaceId: 'ws-demo', accountId: 'acc-cash-suami', categoryId: 'sub-servis', userId: 'demo', amount: 220000, type: 'expense', partyTo: 'Bengkel Resmi Motor', tags: ['Perawatan'], notes: 'Ganti oli mesin & servis motor', transactionDate: fmtDate(5, '15:40:00.000Z'), isGuiltFree: false, guiltFreeOwner: null, clientCreatedAt: now, updatedAt: now, version: 1, isDeleted: false },

          // 6 Hari Lalu (6 days ago)
          { id: 'tx-demo-14', workspaceId: 'ws-demo', accountId: 'acc-gopay', categoryId: 'sub-delivery', userId: 'demo', amount: 135000, type: 'expense', partyTo: 'GrabFood', tags: ['Makan Malam'], notes: 'Pesan martabak manis & asin', transactionDate: fmtDate(6, '20:10:00.000Z'), isGuiltFree: false, guiltFreeOwner: null, clientCreatedAt: now, updatedAt: now, version: 1, isDeleted: false },
          { id: 'tx-demo-15', workspaceId: 'ws-demo', accountId: 'acc-mandiri', categoryId: 'sub-bisnis-istri', userId: 'demo', amount: 1850000, type: 'income', partyFrom: 'Shopee & Marketplace', tags: ['Omset', 'Bisnis'], notes: 'Penarikan saldo hasil jualan busana muslim', transactionDate: fmtDate(6, '14:00:00.000Z'), isGuiltFree: false, guiltFreeOwner: null, clientCreatedAt: now, updatedAt: now, version: 1, isDeleted: false },

          // Awal Bulan (Income & Pengeluaran Besar Rutin)
          { id: 'tx-demo-16', workspaceId: 'ws-demo', accountId: 'acc-bca', categoryId: 'sub-gaji-suami', userId: 'demo', amount: 18500000, type: 'income', partyFrom: 'PT Teknologi Nusantara', tags: ['Gaji'], notes: 'Payroll Gaji Pokok Suami Bulan Ini', transactionDate: `${currentMonth}-01T08:00:00.000Z`, isGuiltFree: false, guiltFreeOwner: null, clientCreatedAt: now, updatedAt: now, version: 1, isDeleted: false },
          { id: 'tx-demo-17', workspaceId: 'ws-demo', accountId: 'acc-mandiri', categoryId: 'sub-freelance', userId: 'demo', amount: 4500000, type: 'income', partyFrom: 'Klien Desain Studio', tags: ['Sampingan'], notes: 'Pelunasan fee pembuatan website & desain', transactionDate: `${currentMonth}-03T11:00:00.000Z`, isGuiltFree: false, guiltFreeOwner: null, clientCreatedAt: now, updatedAt: now, version: 1, isDeleted: false },
          { id: 'tx-demo-18', workspaceId: 'ws-demo', accountId: 'acc-bca', categoryId: 'sub-spp', userId: 'demo', amount: 1200000, type: 'expense', partyTo: 'Sekolah Islam Terpadu', tags: ['Pendidikan', 'SPP'], notes: 'Pembayaran SPP dan uang kegiatan anak', transactionDate: `${currentMonth}-05T10:00:00.000Z`, isGuiltFree: false, guiltFreeOwner: null, clientCreatedAt: now, updatedAt: now, version: 1, isDeleted: false },
        ],
        budgets: [
          { id: 'bdg-pokok', workspaceId: 'ws-demo', categoryId: 'cat-pokok', accountId: 'all', duration: '1_month', startDate: `${currentMonth}-01`, endDate: `${currentMonth}-31`, periodMonth: currentMonth, limitAmount: 4500000, rolloverAmount: 250000, rolloverAction: 'rollover', updatedAt: now, isDeleted: false },
          { id: 'bdg-makan', workspaceId: 'ws-demo', categoryId: 'cat-makan', accountId: 'all', duration: '1_month', startDate: `${currentMonth}-01`, endDate: `${currentMonth}-31`, periodMonth: currentMonth, limitAmount: 3000000, rolloverAmount: 0, rolloverAction: 'rollover', updatedAt: now, isDeleted: false },
          { id: 'bdg-trans', workspaceId: 'ws-demo', categoryId: 'cat-trans', accountId: 'all', duration: '1_month', startDate: `${currentMonth}-01`, endDate: `${currentMonth}-31`, periodMonth: currentMonth, limitAmount: 1800000, rolloverAmount: 100000, rolloverAction: 'rollover', updatedAt: now, isDeleted: false },
          { id: 'bdg-hiburan', workspaceId: 'ws-demo', categoryId: 'cat-hiburan', accountId: 'all', duration: '1_month', startDate: `${currentMonth}-01`, endDate: `${currentMonth}-31`, periodMonth: currentMonth, limitAmount: 1200000, rolloverAmount: 0, rolloverAction: 'rollover', updatedAt: now, isDeleted: false },
          { id: 'bdg-pendidikan', workspaceId: 'ws-demo', categoryId: 'cat-pendidikan', accountId: 'all', duration: '1_month', startDate: `${currentMonth}-01`, endDate: `${currentMonth}-31`, periodMonth: currentMonth, limitAmount: 2500000, rolloverAmount: 0, rolloverAction: 'rollover', updatedAt: now, isDeleted: false },
          { id: 'bdg-kesehatan', workspaceId: 'ws-demo', categoryId: 'cat-kesehatan', accountId: 'all', duration: '1_month', startDate: `${currentMonth}-01`, endDate: `${currentMonth}-31`, periodMonth: currentMonth, limitAmount: 1000000, rolloverAmount: 200000, rolloverAction: 'rollover', updatedAt: now, isDeleted: false },
        ],
        goals: [
          { id: 'gl-darurat', workspaceId: 'ws-demo', name: 'Dana Darurat 6 Bulan', targetAmount: 35000000, currentAmount: 28000000, targetDate: '2026-12-31', icon: 'Shield', color: '#10B981', notes: 'Alokasi 6x pengeluaran pokok keluarga', isCompleted: false, updatedAt: now },
          { id: 'gl-liburan', workspaceId: 'ws-demo', name: 'Liburan Akhir Tahun ke Bali', targetAmount: 12000000, currentAmount: 8500000, targetDate: '2026-12-20', icon: 'Plane', color: '#3B82F6', notes: 'Tiket pesawat & penginapan sekeluarga', isCompleted: false, updatedAt: now },
          { id: 'gl-renov', workspaceId: 'ws-demo', name: 'Renovasi Dapur & Taman Belakang', targetAmount: 25000000, currentAmount: 11200000, targetDate: '2027-03-31', icon: 'Home', color: '#F59E0B', notes: 'Beli keramik, kanopi & kitchen set', isCompleted: false, updatedAt: now },
          { id: 'gl-pendidikan', workspaceId: 'ws-demo', name: 'Uang Pangkal SD Kakak', targetAmount: 18000000, currentAmount: 15000000, targetDate: '2027-06-15', icon: 'GraduationCap', color: '#8B5CF6', notes: 'Tabungan uang masuk sekolah dasar', isCompleted: false, updatedAt: now },
          { id: 'gl-laptop', workspaceId: 'ws-demo', name: 'Laptop Kerja Baru Suami', targetAmount: 15000000, currentAmount: 9750000, targetDate: '2026-11-30', icon: 'Laptop', color: '#EC4899', notes: 'Upgrade perangkat kerja remote WFH', isCompleted: false, updatedAt: now },
          { id: 'gl-qurban', workspaceId: 'ws-demo', name: 'Tabungan Qurban Sapi 1/7', targetAmount: 4200000, currentAmount: 4200000, targetDate: '2026-06-01', icon: 'Heart', color: '#14B8A6', notes: 'Target tercapai dan siap ditunaikan', isCompleted: true, updatedAt: now },
        ],
        bills: [
          { id: 'bl-1', workspaceId: 'ws-demo', name: 'Internet WiFi IndiHome Fiber 50Mbps', amount: 385000, categoryId: 'sub-listrik', accountId: 'acc-bca', dueDay: 15, frequency: 'monthly', paidMonths: [], createdAt: now, updatedAt: now, isDeleted: false },
          { id: 'bl-2', workspaceId: 'ws-demo', name: 'Listrik PLN Pascabayar', amount: 750000, categoryId: 'sub-listrik', accountId: 'acc-bca', dueDay: 20, frequency: 'monthly', paidMonths: [], createdAt: now, updatedAt: now, isDeleted: false },
          { id: 'bl-3', workspaceId: 'ws-demo', name: 'BPJS Kesehatan Mandiri (4 Jiwa)', amount: 600000, categoryId: 'cat-kesehatan', accountId: 'acc-mandiri', dueDay: 10, frequency: 'monthly', paidMonths: [], createdAt: now, updatedAt: now, isDeleted: false },
          { id: 'bl-4', workspaceId: 'ws-demo', name: 'Langganan Netflix & Spotify Family', amount: 236000, categoryId: 'sub-streaming', accountId: 'acc-gopay', dueDay: 25, frequency: 'monthly', paidMonths: [], createdAt: now, updatedAt: now, isDeleted: false },
          { id: 'bl-5', workspaceId: 'ws-demo', name: 'Iuran Kebersihan & Keamanan Cluster', amount: 200000, categoryId: 'cat-pokok', accountId: 'acc-cash-suami', dueDay: 5, frequency: 'monthly', paidMonths: [], createdAt: now, updatedAt: now, isDeleted: false },
          { id: 'bl-6', workspaceId: 'ws-demo', name: 'Iuran Air Bersih PAM / PDAM', amount: 165000, categoryId: 'sub-listrik', accountId: 'acc-bca', dueDay: 18, frequency: 'monthly', paidMonths: [], createdAt: now, updatedAt: now, isDeleted: false },
        ],
        debts: [
          {
            id: 'dbt-1',
            workspaceId: 'ws-demo',
            type: 'debt',
            personName: 'BCA Finance (Kredit Mobil)',
            phone: '081299887766',
            totalAmount: 18000000,
            paidAmount: 9000000,
            startDate: '2026-01-10',
            dueDate: '2027-01-10',
            status: 'active',
            notes: 'Cicilan bulanan kendaraan keluarga',
            payments: [
              { id: 'pay-1', date: dayDateOnly(60), amount: 3000000, accountId: 'acc-bca', notes: 'Cicilan ke-8 via auto debit' },
              { id: 'pay-2', date: dayDateOnly(30), amount: 3000000, accountId: 'acc-bca', notes: 'Cicilan ke-9 via auto debit' },
              { id: 'pay-3', date: dayDateOnly(5), amount: 3000000, accountId: 'acc-bca', notes: 'Cicilan ke-10 via auto debit' },
            ],
            createdAt: now,
            updatedAt: now,
            isDeleted: false,
          },
          {
            id: 'dbt-2',
            workspaceId: 'ws-demo',
            type: 'debt',
            personName: 'Koperasi Mandiri Berkah',
            phone: '082133445566',
            totalAmount: 10000000,
            paidAmount: 4000000,
            startDate: '2026-04-15',
            dueDate: '2026-12-15',
            status: 'active',
            notes: 'Pinjaman tanpa bunga renovasi',
            payments: [
              { id: 'pay-4', date: dayDateOnly(35), amount: 2000000, accountId: 'acc-mandiri', notes: 'Angsuran tahap 1' },
              { id: 'pay-5', date: dayDateOnly(8), amount: 2000000, accountId: 'acc-mandiri', notes: 'Angsuran tahap 2' },
            ],
            createdAt: now,
            updatedAt: now,
            isDeleted: false,
          },
          {
            id: 'dbt-3',
            workspaceId: 'ws-demo',
            type: 'debt',
            personName: 'Toko Elektronik Makmur',
            phone: '081122334455',
            totalAmount: 4500000,
            paidAmount: 4500000,
            startDate: '2026-05-01',
            dueDate: '2026-09-01',
            status: 'settled',
            notes: 'Cicilan kulkas 2 pintu (Lunas)',
            payments: [
              { id: 'pay-6', date: dayDateOnly(45), amount: 1500000, accountId: 'acc-bca', notes: 'Pelunasan terakhir' },
            ],
            createdAt: now,
            updatedAt: now,
            isDeleted: false,
          },
          {
            id: 'dbt-4',
            workspaceId: 'ws-demo',
            type: 'receivable',
            personName: 'Mas Dimas (Sepupu)',
            phone: '085712345678',
            totalAmount: 6000000,
            paidAmount: 3500000,
            startDate: '2026-09-10',
            dueDate: '2026-11-20',
            status: 'active',
            notes: 'Talangan tiket liburan keluarga besar',
            payments: [
              { id: 'pay-7', date: dayDateOnly(12), amount: 3500000, accountId: 'acc-bca', notes: 'Transfer via BCA Mobile' },
            ],
            createdAt: now,
            updatedAt: now,
            isDeleted: false,
          },
          {
            id: 'dbt-5',
            workspaceId: 'ws-demo',
            type: 'receivable',
            personName: 'PT Teknologi Nusantara (Klaim Kantor)',
            phone: '02155667788',
            totalAmount: 2850000,
            paidAmount: 0,
            startDate: dayDateOnly(10),
            dueDate: dayDateOnly(-15),
            status: 'active',
            notes: 'Reimbursement tiket pesawat & hotel dinas',
            payments: [],
            createdAt: now,
            updatedAt: now,
            isDeleted: false,
          },
          {
            id: 'dbt-6',
            workspaceId: 'ws-demo',
            type: 'receivable',
            personName: 'Bu Siti (Katering Arisan)',
            phone: '081344556677',
            totalAmount: 3000000,
            paidAmount: 1000000,
            startDate: '2026-08-20',
            dueDate: '2026-12-20',
            status: 'active',
            notes: 'Talangan modal bahan katering',
            payments: [
              { id: 'pay-8', date: dayDateOnly(22), amount: 1000000, accountId: 'acc-mandiri', notes: 'Cicilan pengembalian ke-1' },
            ],
            createdAt: now,
            updatedAt: now,
            isDeleted: false,
          },
        ],
        syncQueue: [],
      };
      
      this.persist();
      return { success: true };
    }
    // =========================================================

    // Biarkan kode asli Supabase di bawah ini tetap utuh, tidak perlu dihapus
    const supabase = getSupabaseClient();
    if (supabase && isSupabaseConfigured() && this.isOnline()) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: cleanPassword,
        });

        if (error) {
          return {
            success: false,
            message: `Gagal masuk Supabase: ${error.message}`,
          };
        }

        if (data.user) {
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', data.user.id)
              .maybeSingle();

            const accountName =
              profile?.account_name ||
              data.user.user_metadata?.account_name ||
              'Akun Keluarga';

            this.state.userAccount = {
              accountName,
              email: cleanEmail,
              password: '••••••••',
              createdAt: data.user.created_at || new Date().toISOString(),
            };
          } catch {}

          await this.triggerSync();
          await this.pullFromSupabase(supabase, data.user.id);
        }
      } catch (err: any) {
        return {
          success: false,
          message: `Koneksi Supabase error: ${err?.message || 'Gagal login'}`,
        };
      }
    } else {
      let users: Record<string, { email: string; password: string; accountName: string; createdAt?: string }> = {};
      try {
        const usersRaw = localStorage.getItem('keluarga_fin_users');
        if (usersRaw) {
          users = JSON.parse(usersRaw);
        }
      } catch {}

      if (!users[cleanEmail]) {
        if (cleanEmail === 'fikriarkan1309@gmail.com' || cleanEmail === 'tes1@gmail.com') {
          users[cleanEmail] = {
            email: cleanEmail,
            password: cleanPassword,
            accountName: cleanEmail === 'fikriarkan1309@gmail.com' ? 'Akun Fikri' : 'Akun Tes 1',
            createdAt: new Date().toISOString(),
          };
          localStorage.setItem('keluarga_fin_users', JSON.stringify(users));
        } else {
          return {
            success: false,
            message: 'Email belum terdaftar. Silakan daftar terlebih dahulu.',
          };
        }
      }

      const registeredUser = users[cleanEmail];
      if (cleanPassword !== registeredUser.password) {
        return {
          success: false,
          message: 'Kata sandi tidak sesuai. Silakan periksa kembali.',
        };
      }

      const scopedStateRaw = localStorage.getItem(`keluarga_fin_state_${cleanEmail}`);
      if (scopedStateRaw) {
        try {
          const parsed = JSON.parse(scopedStateRaw);
          this.state = {
            ...this.state,
            ...parsed,
            userAccount: {
              accountName: registeredUser.accountName,
              email: cleanEmail,
              password: registeredUser.password,
              createdAt: registeredUser.createdAt || '',
            },
            isAuthenticated: true,
            currentUserEmail: cleanEmail,
          };
        } catch {}
      } else {
        this.state = {
          ...this.state,
          accounts: [],
          categories: INITIAL_CATEGORIES,
          transactions: [],
          budgets: [],
          goals: [],
          bills: [],
          debts: [],
          syncQueue: [],
          userAccount: {
            accountName: registeredUser.accountName,
            email: cleanEmail,
            password: registeredUser.password,
            createdAt: registeredUser.createdAt || '',
          },
          isAuthenticated: true,
          currentUserEmail: cleanEmail,
        };
      }
    }

    this.persist();
    return { success: true };
  }

  public updateUserAccount(updates: { accountName?: string; password?: string }): void {
    if (!this.state.userAccount) return;
    this.state.userAccount = {
      ...this.state.userAccount,
      ...(updates.accountName ? { accountName: updates.accountName.trim() } : {}),
      ...(updates.password ? { password: updates.password } : {}),
    };

    try {
      const usersRaw = localStorage.getItem('keluarga_fin_users');
      if (usersRaw) {
        const users = JSON.parse(usersRaw);
        if (this.state.currentUserEmail && users[this.state.currentUserEmail]) {
          if (updates.accountName) users[this.state.currentUserEmail].accountName = updates.accountName.trim();
          if (updates.password) users[this.state.currentUserEmail].password = updates.password;
          localStorage.setItem('keluarga_fin_users', JSON.stringify(users));
        }
      }
    } catch {}

    this.persist();

    const supabase = getSupabaseClient();
    if (supabase && isSupabaseConfigured() && this.isOnline() && updates.accountName) {
      supabase.auth.getSession().then(({ data }) => {
        if (data?.session?.user) {
          supabase
            .from('profiles')
            .upsert({
              id: data.session.user.id,
              account_name: updates.accountName,
              updated_at: new Date().toISOString(),
            })
            .then(() => {});
        }
      });
    }
  }

  public async logout(): Promise<void> {
    const supabase = getSupabaseClient();
    if (supabase && isSupabaseConfigured()) {
      try {
        await supabase.auth.signOut();
      } catch {}
    }
    this.persist();
    this.state.isAuthenticated = false;
    try {
      if (this.state.currentUserEmail) {
        localStorage.removeItem(`keluarga_fin_state_${this.state.currentUserEmail}`);
      }
      localStorage.removeItem('keluarga_fin_current_user');
    } catch {}
    this.state = {
      ...this.state,
      currentUserEmail: '',
      accounts: INITIAL_ACCOUNTS,
      categories: INITIAL_CATEGORIES,
      transactions: INITIAL_TRANSACTIONS,
      budgets: INITIAL_BUDGETS,
      goals: INITIAL_GOALS,
      bills: INITIAL_BILLS,
      debts: INITIAL_DEBTS,
      syncQueue: [],
      guiltFree: INITIAL_GUILT_FREE,
    };
    this.persist();
  }

  public setLocked(locked: boolean) {
    this.state.isLocked = locked;
    this.persist();
  }

  public verifyPin(inputPin: string): boolean {
    if (inputPin === this.state.pin) {
      this.state.isLocked = false;
      this.persist();
      return true;
    }
    return false;
  }

  public setPin(newPin: string) {
    this.state.pin = newPin;
    this.persist();
  }

  public generateUUID(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  // --- ACCOUNTS MANAGEMENT ---
  public addAccount(input: {
    name: string;
    currency: string;
    initialBalance: number;
    color?: string;
    type?: Account['type'];
    accountNumber?: string;
  }): Account {
    const now = new Date().toISOString();
    const id = this.generateUUID();
    const newAccount: Account = {
      id,
      workspaceId: this.state.accounts[0]?.workspaceId || 'ws-default',
      name: input.name,
      currency: input.currency || 'IDR',
      initialBalance: input.initialBalance || 0,
      balance: input.initialBalance || 0,
      color: input.color || '#2563EB',
      type: input.type || 'bank',
      accountNumber: input.accountNumber || '',
      isArchived: false,
      updatedAt: now,
    };

    this.state.accounts = [...this.state.accounts, newAccount];

    this.state.syncQueue.push({
      id: this.generateUUID(),
      entityTable: 'accounts',
      entityId: id,
      operation: 'INSERT',
      payload: newAccount,
      clientTimestamp: now,
      status: 'pending',
      retryCount: 0,
    });

    this.persist();
    if (this.isOnline()) this.triggerSync();
    return newAccount;
  }

  public updateAccount(id: string, updates: Partial<Account>) {
    const now = new Date().toISOString();
    this.state.accounts = this.state.accounts.map((acc) =>
      acc.id === id ? { ...acc, ...updates, updatedAt: now } : acc
    );

    const updated = this.state.accounts.find((a) => a.id === id);
    if (updated) {
      this.state.syncQueue.push({
        id: this.generateUUID(),
        entityTable: 'accounts',
        entityId: id,
        operation: 'UPDATE',
        payload: updated,
        clientTimestamp: now,
        status: 'pending',
        retryCount: 0,
      });
    }

    this.recalculateAccountBalances();
    this.persist();
    if (this.isOnline()) this.triggerSync();
  }

  public toggleArchiveAccount(id: string) {
    const acc = this.state.accounts.find((a) => a.id === id);
    if (!acc) return;
    this.updateAccount(id, { isArchived: !acc.isArchived });
  }

  public deleteAccount(id: string) {
    this.state.accounts = this.state.accounts.filter((a) => a.id !== id);
    this.state.syncQueue.push({
      id: this.generateUUID(),
      entityTable: 'accounts',
      entityId: id,
      operation: 'DELETE',
      payload: { id, isDeleted: true },
      clientTimestamp: new Date().toISOString(),
      status: 'pending',
      retryCount: 0,
    });
    this.persist();
    if (this.isOnline()) this.triggerSync();
  }

  // --- TRANSACTIONS ---
  public addTransaction(input: {
    accountId: string;
    categoryId: string;
    userId: string;
    amount: number;
    type: 'expense' | 'income' | 'transfer';
    targetAccountId?: string | null;
    partyFrom?: string;
    partyTo?: string;
    tags: string[];
    notes?: string;
    transactionDate?: string;
    isGuiltFree?: boolean;
    guiltFreeOwner?: UserRole | null;
  }): Transaction {
    const now = new Date().toISOString();
    const id = this.generateUUID();

    const transaction: Transaction = {
      id,
      workspaceId: this.state.accounts[0]?.workspaceId || 'ws-default',
      accountId: input.accountId,
      categoryId: input.categoryId,
      userId: input.userId,
      amount: input.amount,
      type: input.type,
      targetAccountId: input.targetAccountId || null,
      partyFrom: input.partyFrom || '',
      partyTo: input.partyTo || '',
      tags: input.tags,
      notes: input.notes || '',
      transactionDate: input.transactionDate || now,
      isGuiltFree: !!input.isGuiltFree,
      guiltFreeOwner: input.guiltFreeOwner || null,
      clientCreatedAt: now,
      updatedAt: now,
      version: 1,
      isDeleted: false,
    };

    this.state.transactions = [transaction, ...this.state.transactions];

    this.updateAccountBalance(
      input.accountId,
      input.amount,
      input.type,
      input.targetAccountId
    );

    if (input.isGuiltFree && input.guiltFreeOwner) {
      this.state.guiltFree[input.guiltFreeOwner].spent += input.amount;
    }

    const queueItem: SyncQueueItem = {
      id: this.generateUUID(),
      entityTable: 'transactions',
      entityId: id,
      operation: 'INSERT',
      payload: transaction,
      clientTimestamp: now,
      status: 'pending',
      retryCount: 0,
    };
    this.state.syncQueue.push(queueItem);

    this.recalculateAccountBalances();
    this.persist();
    if (this.isOnline()) {
      this.triggerSync();
    }

    return transaction;
  }

  public updateTransaction(id: string, updates: Partial<Transaction>) {
    const oldTxn = this.state.transactions.find((t) => t.id === id);
    if (!oldTxn) return;

    if (oldTxn.type === 'expense') {
      this.revertBalance(oldTxn.accountId, oldTxn.amount, 'income');
    } else if (oldTxn.type === 'income') {
      this.revertBalance(oldTxn.accountId, oldTxn.amount, 'expense');
    } else if (oldTxn.type === 'transfer' && oldTxn.targetAccountId) {
      this.revertBalance(oldTxn.accountId, oldTxn.amount, 'income');
      this.revertBalance(oldTxn.targetAccountId, oldTxn.amount, 'expense');
    }

    const now = new Date().toISOString();
    const updatedTxn: Transaction = {
      ...oldTxn,
      ...updates,
      updatedAt: now,
      version: oldTxn.version + 1,
    };

    this.updateAccountBalance(
      updatedTxn.accountId,
      updatedTxn.amount,
      updatedTxn.type,
      updatedTxn.targetAccountId
    );

    this.state.transactions = this.state.transactions.map((t) =>
      t.id === id ? updatedTxn : t
    );

    this.state.syncQueue.push({
      id: this.generateUUID(),
      entityTable: 'transactions',
      entityId: id,
      operation: 'UPDATE',
      payload: updatedTxn,
      clientTimestamp: now,
      status: 'pending',
      retryCount: 0,
    });

    this.recalculateAccountBalances();
    this.persist();
    if (this.isOnline()) this.triggerSync();
  }

  public deleteTransaction(id: string) {
    const txn = this.state.transactions.find((t) => t.id === id);
    if (!txn) return;

    if (txn.type === 'expense') {
      this.revertBalance(txn.accountId, txn.amount, 'income');
    } else if (txn.type === 'income') {
      this.revertBalance(txn.accountId, txn.amount, 'expense');
    } else if (txn.type === 'transfer' && txn.targetAccountId) {
      this.revertBalance(txn.accountId, txn.amount, 'income');
      this.revertBalance(txn.targetAccountId, txn.amount, 'expense');
    }

    if (txn.isGuiltFree && txn.guiltFreeOwner) {
      this.state.guiltFree[txn.guiltFreeOwner].spent = Math.max(
        0,
        this.state.guiltFree[txn.guiltFreeOwner].spent - txn.amount
      );
    }

    this.state.transactions = this.state.transactions.filter((t) => t.id !== id);

    const queueItem: SyncQueueItem = {
      id: this.generateUUID(),
      entityTable: 'transactions',
      entityId: id,
      operation: 'DELETE',
      payload: { id, isDeleted: true },
      clientTimestamp: new Date().toISOString(),
      status: 'pending',
      retryCount: 0,
    };
    this.state.syncQueue.push(queueItem);

    this.recalculateAccountBalances();
    this.persist();
    if (this.isOnline()) {
      this.triggerSync();
    }
  }

  private updateAccountBalance(
    sourceAccountId: string,
    amount: number,
    type: 'expense' | 'income' | 'transfer',
    targetAccountId?: string | null
  ) {
    const now = new Date().toISOString();
    this.state.accounts = this.state.accounts.map((acc) => {
      if (acc.id === sourceAccountId) {
        if (type === 'expense' || type === 'transfer') {
          return { ...acc, balance: acc.balance - amount, updatedAt: now };
        } else if (type === 'income') {
          return { ...acc, balance: acc.balance + amount, updatedAt: now };
        }
      }
      if (type === 'transfer' && targetAccountId && acc.id === targetAccountId) {
        return { ...acc, balance: acc.balance + amount, updatedAt: now };
      }
      return acc;
    });

    const sourceAcc = this.state.accounts.find((a) => a.id === sourceAccountId);
    if (sourceAcc) this.queueAccountUpsert(sourceAcc);
    if (targetAccountId) {
      const targetAcc = this.state.accounts.find((a) => a.id === targetAccountId);
      if (targetAcc) this.queueAccountUpsert(targetAcc);
    }
  }

  private revertBalance(accountId: string, amount: number, direction: 'expense' | 'income') {
    const now = new Date().toISOString();
    this.state.accounts = this.state.accounts.map((acc) => {
      if (acc.id === accountId) {
        return {
          ...acc,
          balance: direction === 'income' ? acc.balance + amount : acc.balance - amount,
          updatedAt: now,
        };
      }
      return acc;
    });

    const acc = this.state.accounts.find((a) => a.id === accountId);
    if (acc) this.queueAccountUpsert(acc);
  }

  private queueAccountUpsert(acc: Account) {
    const existingIndex = this.state.syncQueue.findIndex(
      (q) => q.entityTable === 'accounts' && q.entityId === acc.id && (q.status === 'pending' || q.status === 'syncing')
    );
    const now = new Date().toISOString();
    if (existingIndex >= 0) {
      this.state.syncQueue[existingIndex] = {
        ...this.state.syncQueue[existingIndex],
        payload: { ...acc },
        clientTimestamp: now,
        status: 'pending',
      };
    } else {
      this.state.syncQueue.push({
        id: this.generateUUID(),
        entityTable: 'accounts',
        entityId: acc.id,
        operation: 'UPDATE',
        payload: { ...acc },
        clientTimestamp: now,
        status: 'pending',
        retryCount: 0,
      });
    }
  }

  public recalculateAccountBalances() {
    const nonDeletedTxns = this.state.transactions.filter((t) => !t.isDeleted);
    
    let changed = false;
    this.state.accounts = this.state.accounts.map((acc) => {
      let netDelta = 0;
      for (const t of nonDeletedTxns) {
        const amt = Number(t.amount) || 0;
        if (t.accountId === acc.id) {
          if (t.type === 'expense') {
            netDelta -= amt;
          } else if (t.type === 'income') {
            netDelta += amt;
          } else if (t.type === 'transfer') {
            netDelta -= amt;
          }
        }
        if (t.type === 'transfer' && t.targetAccountId === acc.id) {
          netDelta += amt;
        }
      }

      const initial = Number(acc.initialBalance) || 0;
      const accurateBalance = initial + netDelta;

      if (acc.balance !== accurateBalance) {
        changed = true;
        const updated = {
          ...acc,
          balance: accurateBalance,
          updatedAt: new Date().toISOString(),
        };
        this.queueAccountUpsert(updated);
        return updated;
      }
      return acc;
    });

    if (changed) {
      this.persist();
      this.notify();
    }
  }

  // --- CATEGORIES MANAGEMENT ---
  public addCategory(input: {
    name: string;
    parentId?: string | null;
    icon: string;
    color: string;
    type: 'expense' | 'income';
  }): Category {
    const now = new Date().toISOString();
    const id = this.generateUUID();
    const newCat: Category = {
      id,
      workspaceId: this.state.accounts[0]?.workspaceId || 'ws-default',
      name: input.name,
      parentId: input.parentId || null,
      icon: input.icon || 'Tag',
      color: input.color || '#3B82F6',
      type: input.type,
      isSystem: false,
    };

    this.state.categories = [...this.state.categories, newCat];

    this.state.syncQueue.push({
      id: this.generateUUID(),
      entityTable: 'categories',
      entityId: id,
      operation: 'INSERT',
      payload: newCat,
      clientTimestamp: now,
      status: 'pending',
      retryCount: 0,
    });

    this.persist();
    if (this.isOnline()) this.triggerSync();
    return newCat;
  }

  public updateCategory(id: string, updates: Partial<Category>) {
    const now = new Date().toISOString();
    this.state.categories = this.state.categories.map((c) =>
      c.id === id ? { ...c, ...updates } : c
    );

    const updated = this.state.categories.find((c) => c.id === id);
    if (updated) {
      this.state.syncQueue.push({
        id: this.generateUUID(),
        entityTable: 'categories',
        entityId: id,
        operation: 'UPDATE',
        payload: updated,
        clientTimestamp: now,
        status: 'pending',
        retryCount: 0,
      });
    }

    this.persist();
    if (this.isOnline()) this.triggerSync();
  }

  public deleteCategory(id: string) {
    const now = new Date().toISOString();
    this.state.categories = this.state.categories.filter((c) => c.id !== id && c.parentId !== id);

    this.state.syncQueue.push({
      id: this.generateUUID(),
      entityTable: 'categories',
      entityId: id,
      operation: 'DELETE',
      payload: { id, isDeleted: true },
      clientTimestamp: now,
      status: 'pending',
      retryCount: 0,
    });

    this.persist();
    if (this.isOnline()) this.triggerSync();
  }

// --- BUDGETS MANAGEMENT ---
  public addBudget(input: {
    categoryId: string;
    accountId?: string;
    limitAmount: number;
    duration: BudgetDuration;
    startDate: string;
    endDate: string;
  }): Budget {
    const now = new Date().toISOString();
    const id = this.generateUUID();
    const newBudget: Budget = {
      id,
      workspaceId: this.state.accounts[0]?.workspaceId || 'ws-default',
      categoryId: input.categoryId,
      accountId: input.accountId || 'all',
      duration: input.duration || '1_month',
      startDate: input.startDate,
      endDate: input.endDate,
      periodMonth: input.startDate.slice(0, 7),
      limitAmount: input.limitAmount,
      rolloverAmount: 0,
      rolloverAction: 'rollover',
      updatedAt: now,
    };

    this.state.budgets = [...this.state.budgets, newBudget];

    this.state.syncQueue.push({
      id: this.generateUUID(),
      entityTable: 'budgets',
      entityId: id,
      operation: 'INSERT',
      payload: newBudget,
      clientTimestamp: now,
      status: 'pending',
      retryCount: 0,
    });

    this.persist();
    if (this.isOnline()) this.triggerSync();
    return newBudget;
  }

  public updateBudget(id: string, updates: Partial<Budget>) {
    const now = new Date().toISOString();
    this.state.budgets = this.state.budgets.map((b) =>
      b.id === id ? { ...b, ...updates, updatedAt: now } : b
    );

    const updated = this.state.budgets.find((b) => b.id === id);
    if (updated) {
      this.state.syncQueue.push({
        id: this.generateUUID(),
        entityTable: 'budgets',
        entityId: id,
        operation: 'UPDATE',
        payload: updated,
        clientTimestamp: now,
        status: 'pending',
        retryCount: 0,
      });
    }

    this.persist();
    if (this.isOnline()) this.triggerSync();
  }

  public deleteBudget(id: string) {
    const now = new Date().toISOString();
    this.state.budgets = this.state.budgets.filter((b) => b.id !== id);
    this.state.syncQueue.push({
      id: this.generateUUID(),
      entityTable: 'budgets',
      entityId: id,
      operation: 'DELETE',
      payload: { id, isDeleted: true },
      clientTimestamp: now,
      status: 'pending',
      retryCount: 0,
    });
    this.persist();
    if (this.isOnline()) this.triggerSync();
  }

  // --- GOALS MUTATIONS ---
  public depositToGoal(goalId: string, amount: number, sourceAccountId: string) {
    const goal = this.state.goals.find((g) => g.id === goalId);
    if (!goal) return;

    this.state.accounts = this.state.accounts.map((acc) => {
      if (acc.id === sourceAccountId) {
        return { ...acc, balance: acc.balance - amount, updatedAt: new Date().toISOString() };
      }
      return acc;
    });

    const updatedGoal = {
      ...goal,
      currentAmount: goal.currentAmount + amount,
      isCompleted: goal.currentAmount + amount >= goal.targetAmount,
      updatedAt: new Date().toISOString(),
    };

    this.state.goals = this.state.goals.map((g) => (g.id === goalId ? updatedGoal : g));

    const now = new Date().toISOString();
    const txn: Transaction = {
      id: this.generateUUID(),
      workspaceId: this.state.accounts[0]?.workspaceId || 'ws-default',
      accountId: sourceAccountId,
      categoryId: 'cat-kebutuhan-pokok',
      userId: this.state.activeRole === 'husband' ? 'usr-husband-fikri-01' : 'usr-wife-alya-02',
      amount,
      type: 'expense',
      tags: ['Investasi', 'Target Bersama'],
      notes: `Alokasi Tabungan: ${goal.name}`,
      transactionDate: now,
      clientCreatedAt: now,
      updatedAt: now,
      version: 1,
    };
    this.state.transactions = [txn, ...this.state.transactions];

    this.state.syncQueue.push({
      id: this.generateUUID(),
      entityTable: 'goals',
      entityId: goalId,
      operation: 'UPDATE',
      payload: updatedGoal,
      clientTimestamp: now,
      status: 'pending',
      retryCount: 0,
    });

    this.persist();
    if (this.isOnline()) {
      this.triggerSync();
    }
  }
  public addGoal(input: {
    name: string;
    targetAmount: number;
    targetDate: string;
    icon?: string;
    color?: string;
    notes?: string;
    initialAmount?: number;
  }): SharedGoal {
    const now = new Date().toISOString();
    const id = this.generateUUID();
    const newGoal: SharedGoal = {
      id,
      workspaceId: this.state.accounts[0]?.workspaceId || 'ws-default',
      name: input.name,
      targetAmount: input.targetAmount,
      currentAmount: input.initialAmount || 0,
      targetDate: input.targetDate,
      icon: input.icon || 'Target',
      color: input.color || '#10B981',
      notes: input.notes,
      isCompleted: (input.initialAmount || 0) >= input.targetAmount,
      updatedAt: now,
    };

    this.state.goals = [...this.state.goals, newGoal];

    this.state.syncQueue.push({
      id: this.generateUUID(),
      entityTable: 'goals',
      entityId: id,
      operation: 'INSERT',
      payload: newGoal,
      clientTimestamp: now,
      status: 'pending',
      retryCount: 0,
    });

    this.persist();
    if (this.isOnline()) this.triggerSync();
    return newGoal;
  }

  public updateGoal(id: string, updates: Partial<SharedGoal>) {
    const now = new Date().toISOString();
    let updatedGoal: SharedGoal | undefined;
    this.state.goals = this.state.goals.map((g) => {
      if (g.id === id) {
        const updated = { ...g, ...updates, updatedAt: now };
        updated.isCompleted = updated.currentAmount >= updated.targetAmount;
        updatedGoal = updated;
        return updated;
      }
      return g;
    });

    if (updatedGoal) {
      this.state.syncQueue.push({
        id: this.generateUUID(),
        entityTable: 'goals',
        entityId: id,
        operation: 'UPDATE',
        payload: updatedGoal,
        clientTimestamp: now,
        status: 'pending',
        retryCount: 0,
      });
    }

    this.persist();
    if (this.isOnline()) this.triggerSync();
  }

  public deleteGoal(id: string) {
    const now = new Date().toISOString();
    this.state.goals = this.state.goals.filter((g) => g.id !== id);

    this.state.syncQueue.push({
      id: this.generateUUID(),
      entityTable: 'goals',
      entityId: id,
      operation: 'DELETE',
      payload: { id, isDeleted: true },
      clientTimestamp: now,
      status: 'pending',
      retryCount: 0,
    });

    this.persist();
    if (this.isOnline()) this.triggerSync();
  }

  public withdrawFromGoal(goalId: string, amount: number, targetAccountId: string, notes?: string) {
    const goal = this.state.goals.find((g) => g.id === goalId);
    if (!goal || goal.currentAmount < amount) return;

    this.state.accounts = this.state.accounts.map((acc) => {
      if (acc.id === targetAccountId) {
        return { ...acc, balance: acc.balance + amount, updatedAt: new Date().toISOString() };
      }
      return acc;
    });

    const updatedGoal = {
      ...goal,
      currentAmount: goal.currentAmount - amount,
      isCompleted: goal.currentAmount - amount >= goal.targetAmount,
      updatedAt: new Date().toISOString(),
    };

    this.state.goals = this.state.goals.map((g) => (g.id === goalId ? updatedGoal : g));

    const now = new Date().toISOString();
    const txn: Transaction = {
      id: this.generateUUID(),
      workspaceId: this.state.accounts[0]?.workspaceId || 'ws-default',
      accountId: targetAccountId,
      categoryId: 'sub-gaji-bulanan',
      userId: this.state.activeRole === 'husband' ? 'usr-husband-fikri-01' : 'usr-wife-alya-02',
      amount,
      type: 'income',
      tags: ['Tarik Tabungan', goal.name],
      notes: notes || `Pencairan Tabungan Impian: ${goal.name}`,
      transactionDate: now,
      clientCreatedAt: now,
      updatedAt: now,
      version: 1,
    };
    this.state.transactions = [txn, ...this.state.transactions];

    this.persist();
  }

  // --- RECURRING BILLS MANAGEMENT ---
  // --- RECURRING BILLS MANAGEMENT ---
  public addBill(input: {
    name: string;
    amount: number;
    categoryId: string;
    accountId?: string;
    dueDay: number;
    frequency?: 'monthly' | 'weekly' | 'yearly';
    notes?: string;
  }): RecurringBill {
    const now = new Date().toISOString();
    const id = this.generateUUID();
    const newBill: RecurringBill = {
      id,
      workspaceId: this.state.accounts[0]?.workspaceId || 'ws-default',
      name: input.name,
      amount: input.amount,
      categoryId: input.categoryId,
      accountId: input.accountId || this.state.accounts[0]?.id,
      dueDay: input.dueDay || 1,
      frequency: input.frequency || 'monthly',
      notes: input.notes,
      paidMonths: [],
      createdAt: now,
      updatedAt: now,
    };

    this.state.bills = [...this.state.bills, newBill];

    this.state.syncQueue.push({
      id: this.generateUUID(),
      entityTable: 'bills',
      entityId: id,
      operation: 'INSERT',
      payload: newBill,
      clientTimestamp: now,
      status: 'pending',
      retryCount: 0,
    });

    this.persist();
    if (this.isOnline()) this.triggerSync();
    return newBill;
  }

  public updateBill(id: string, updates: Partial<RecurringBill>) {
    const now = new Date().toISOString();
    let updatedBill: RecurringBill | undefined;
    this.state.bills = this.state.bills.map((b) => {
      if (b.id === id) {
        updatedBill = { ...b, ...updates, updatedAt: now };
        return updatedBill;
      }
      return b;
    });

    if (updatedBill) {
      this.state.syncQueue.push({
        id: this.generateUUID(),
        entityTable: 'bills',
        entityId: id,
        operation: 'UPDATE',
        payload: updatedBill,
        clientTimestamp: now,
        status: 'pending',
        retryCount: 0,
      });
    }

    this.persist();
    if (this.isOnline()) this.triggerSync();
  }

  public deleteBill(id: string) {
    const now = new Date().toISOString();
    this.state.bills = this.state.bills.filter((b) => b.id !== id);

    this.state.syncQueue.push({
      id: this.generateUUID(),
      entityTable: 'bills',
      entityId: id,
      operation: 'DELETE',
      payload: { id, isDeleted: true },
      clientTimestamp: now,
      status: 'pending',
      retryCount: 0,
    });

    this.persist();
    if (this.isOnline()) this.triggerSync();
  }

  public payBill(billId: string, accountId: string, customNotes?: string) {
    const bill = this.state.bills.find((b) => b.id === billId);
    if (!bill) return;

    const currentMonth = new Date().toISOString().slice(0, 7);
    if (!bill.paidMonths.includes(currentMonth)) {
      bill.paidMonths.push(currentMonth);
    }
    const now = new Date().toISOString();
    bill.lastPaidDate = now;
    bill.updatedAt = now;

    this.state.accounts = this.state.accounts.map((acc) => {
      if (acc.id === accountId) {
        return { ...acc, balance: acc.balance - bill.amount, updatedAt: now };
      }
      return acc;
    });

    const txn: Transaction = {
      id: this.generateUUID(),
      workspaceId: this.state.accounts[0]?.workspaceId || 'ws-default',
      accountId: accountId,
      categoryId: bill.categoryId,
      userId: this.state.activeRole === 'husband' ? 'usr-husband-fikri-01' : 'usr-wife-alya-02',
      amount: bill.amount,
      type: 'expense',
      tags: ['Tagihan Rutin', bill.name],
      notes: customNotes || `Pembayaran Tagihan Rutin: ${bill.name}`,
      partyTo: bill.name,
      transactionDate: now,
      clientCreatedAt: now,
      updatedAt: now,
      version: 1,
    };
    this.state.transactions = [txn, ...this.state.transactions];

    this.state.syncQueue.push({
      id: this.generateUUID(),
      entityTable: 'bills',
      entityId: billId,
      operation: 'UPDATE',
      payload: bill,
      clientTimestamp: now,
      status: 'pending',
      retryCount: 0,
    });

    this.persist();
    if (this.isOnline()) this.triggerSync();
  }

  public unpayBill(billId: string, monthStr?: string) {
    const targetMonth = monthStr || new Date().toISOString().slice(0, 7);
    this.state.bills = this.state.bills.map((b) => {
      if (b.id === billId) {
        return {
          ...b,
          paidMonths: b.paidMonths.filter((m) => m !== targetMonth),
          updatedAt: new Date().toISOString(),
        };
      }
      return b;
    });
    this.persist();
  }

  // --- DEBTS & LOANS MANAGEMENT ---
  // --- DEBTS & LOANS MANAGEMENT ---
  public addDebt(input: {
    type: 'debt' | 'receivable';
    personName: string;
    phone?: string;
    totalAmount: number;
    startDate?: string;
    dueDate?: string;
    notes?: string;
    initialPaid?: number;
    accountId?: string;
  }): DebtItem {
    const now = new Date().toISOString();
    const id = this.generateUUID();
    const initialPaid = input.initialPaid || 0;

    const payments: DebtPayment[] = [];
    if (initialPaid > 0) {
      payments.push({
        id: this.generateUUID(),
        date: input.startDate || now.slice(0, 10),
        amount: initialPaid,
        accountId: input.accountId,
        notes: 'Pembayaran / Cicilan Awal',
      });
    }

    const newDebt: DebtItem = {
      id,
      workspaceId: this.state.accounts[0]?.workspaceId || 'ws-default',
      type: input.type,
      personName: input.personName,
      phone: input.phone,
      totalAmount: input.totalAmount,
      paidAmount: initialPaid,
      startDate: input.startDate || now.slice(0, 10),
      dueDate: input.dueDate,
      notes: input.notes,
      status: initialPaid >= input.totalAmount ? 'settled' : 'active',
      payments,
      createdAt: now,
      updatedAt: now,
    };

    this.state.debts = [...this.state.debts, newDebt];

    this.state.syncQueue.push({
      id: this.generateUUID(),
      entityTable: 'debts',
      entityId: id,
      operation: 'INSERT',
      payload: newDebt,
      clientTimestamp: now,
      status: 'pending',
      retryCount: 0,
    });

    this.persist();
    if (this.isOnline()) this.triggerSync();
    return newDebt;
  }

  public updateDebt(id: string, updates: Partial<DebtItem>) {
    const now = new Date().toISOString();
    let updatedDebt: DebtItem | undefined;
    this.state.debts = this.state.debts.map((d) => {
      if (d.id === id) {
        const updated = { ...d, ...updates, updatedAt: now };
        updated.status = updated.paidAmount >= updated.totalAmount ? 'settled' : 'active';
        updatedDebt = updated;
        return updated;
      }
      return d;
    });

    if (updatedDebt) {
      this.state.syncQueue.push({
        id: this.generateUUID(),
        entityTable: 'debts',
        entityId: id,
        operation: 'UPDATE',
        payload: updatedDebt,
        clientTimestamp: now,
        status: 'pending',
        retryCount: 0,
      });
    }

    this.persist();
    if (this.isOnline()) this.triggerSync();
  }

  public deleteDebt(id: string) {
    const now = new Date().toISOString();
    this.state.debts = this.state.debts.filter((d) => d.id !== id);

    this.state.syncQueue.push({
      id: this.generateUUID(),
      entityTable: 'debts',
      entityId: id,
      operation: 'DELETE',
      payload: { id, isDeleted: true },
      clientTimestamp: now,
      status: 'pending',
      retryCount: 0,
    });

    this.persist();
    if (this.isOnline()) this.triggerSync();
  }

  public recordDebtPayment(
    debtId: string,
    payment: { amount: number; accountId?: string; notes?: string; date?: string }
  ) {
    const debt = this.state.debts.find((d) => d.id === debtId);
    if (!debt) return;

    const paymentAmount = payment.amount;
    const paymentDate = payment.date || new Date().toISOString();
    const paymentId = this.generateUUID();

    const newPayment: DebtPayment = {
      id: paymentId,
      date: paymentDate,
      amount: paymentAmount,
      accountId: payment.accountId,
      notes: payment.notes || 'Pembayaran cicilan',
    };

    const newPaidTotal = debt.paidAmount + paymentAmount;
    const isSettled = newPaidTotal >= debt.totalAmount;
    const now = new Date().toISOString();

    if (payment.accountId) {
      this.state.accounts = this.state.accounts.map((acc) => {
        if (acc.id === payment.accountId) {
          const delta = debt.type === 'debt' ? -paymentAmount : paymentAmount;
          return { ...acc, balance: acc.balance + delta, updatedAt: now };
        }
        return acc;
      });

      const isExpense = debt.type === 'debt';
      const txn: Transaction = {
        id: this.generateUUID(),
        workspaceId: this.state.accounts[0]?.workspaceId || 'ws-default',
        accountId: payment.accountId,
        categoryId: isExpense ? 'cat-kebutuhan-pokok' : 'cat-pendapatan-tetap',
        userId: this.state.activeRole === 'husband' ? 'usr-husband-fikri-01' : 'usr-wife-alya-02',
        amount: paymentAmount,
        type: isExpense ? 'expense' : 'income',
        tags: [isExpense ? 'Bayar Hutang' : 'Terima Piutang', debt.personName],
        notes: `${isExpense ? 'Cicilan Hutang ke' : 'Terima Piutang dari'} ${debt.personName}: ${payment.notes || ''}`,
        partyTo: isExpense ? debt.personName : undefined,
        partyFrom: !isExpense ? debt.personName : undefined,
        transactionDate: now,
        clientCreatedAt: now,
        updatedAt: now,
        version: 1,
      };
      this.state.transactions = [txn, ...this.state.transactions];
    }

    let updatedDebt: DebtItem | undefined;
    this.state.debts = this.state.debts.map((d) => {
      if (d.id === debtId) {
        updatedDebt = {
          ...d,
          paidAmount: newPaidTotal,
          status: isSettled ? 'settled' : 'active',
          payments: [newPayment, ...d.payments],
          updatedAt: now,
        };
        return updatedDebt;
      }
      return d;
    });

    if (updatedDebt) {
      this.state.syncQueue.push({
        id: this.generateUUID(),
        entityTable: 'debts',
        entityId: debtId,
        operation: 'UPDATE',
        payload: updatedDebt,
        clientTimestamp: now,
        status: 'pending',
        retryCount: 0,
      });
    }

    this.persist();
    if (this.isOnline()) this.triggerSync();
  }

  // --- DATA BACKUP, RESTORE & EXPORT ---
  public exportAllDataJSON(): string {
    const exportPayload = {
      exportDate: new Date().toISOString(),
      appVersion: '2.0.0',
      state: this.state,
    };
    return JSON.stringify(exportPayload, null, 2);
  }

  public importAllDataJSON(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      const importedState = data.state || data;
      if (!importedState.accounts || !importedState.transactions) {
        throw new Error('Format file cadangan tidak valid');
      }

      this.state = {
        ...this.state,
        accounts: importedState.accounts,
        categories: importedState.categories || INITIAL_CATEGORIES,
        transactions: importedState.transactions,
        budgets: importedState.budgets || INITIAL_BUDGETS,
        goals: importedState.goals || INITIAL_GOALS,
        bills: importedState.bills || INITIAL_BILLS,
        debts: importedState.debts || INITIAL_DEBTS,
        guiltFree: importedState.guiltFree || INITIAL_GUILT_FREE,
      };
      this.persist();
      return true;
    } catch (e) {
      console.error('Import failed', e);
      return false;
    }
  }

  public exportTransactionsCSV(): string {
    const headers = ['Tanggal', 'Jenis', 'Rekening', 'Kategori', 'Nominal', 'Dari', 'Ke', 'Catatan', 'Tags'];
    const rows = this.state.transactions.map((t) => {
      const acc = this.state.accounts.find((a) => a.id === t.accountId)?.name || t.accountId;
      const cat = this.state.categories.find((c) => c.id === t.categoryId)?.name || t.categoryId;
      const typeLabel = t.type === 'expense' ? 'Pengeluaran' : t.type === 'income' ? 'Pemasukan' : 'Transfer';
      const dateFormatted = t.transactionDate.slice(0, 10);
      const escape = (val?: string) => `"${(val || '').replace(/"/g, '""')}"`;

      return [
        escape(dateFormatted),
        escape(typeLabel),
        escape(acc),
        escape(cat),
        t.amount,
        escape(t.partyFrom),
        escape(t.partyTo),
        escape(t.notes),
        escape(t.tags.join('; ')),
      ].join(',');
    });

    return '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  }

  // --- BUDGET & ROLLOVER ENGINE ---
  public processBudgetRollover(
    budgetId: string,
    action: 'rollover' | 'savings' | 'reset',
    targetGoalId?: string
  ) {
    const budget = this.state.budgets.find((b) => b.id === budgetId);
    if (!budget) return;

    const catTransactions = this.state.transactions.filter(
      (t) =>
        (t.categoryId === budget.categoryId || this.isSubcategory(t.categoryId, budget.categoryId)) &&
        t.type === 'expense'
    );
    const spent = catTransactions.reduce((acc, t) => acc + t.amount, 0);
    const remaining = Math.max(0, budget.limitAmount + budget.rolloverAmount - spent);

    let newRolloverAmount = 0;
    if (action === 'rollover') {
      newRolloverAmount = remaining;
    } else if (action === 'savings' && targetGoalId && remaining > 0) {
      this.depositToGoal(targetGoalId, remaining, this.state.accounts[0].id);
      newRolloverAmount = 0;
    } else {
      newRolloverAmount = 0;
    }

    const updatedBudget: Budget = {
      ...budget,
      rolloverAmount: newRolloverAmount,
      rolloverAction: action,
      updatedAt: new Date().toISOString(),
    };

    this.state.budgets = this.state.budgets.map((b) => (b.id === budgetId ? updatedBudget : b));

    this.state.syncQueue.push({
      id: this.generateUUID(),
      entityTable: 'budgets',
      entityId: budgetId,
      operation: 'UPDATE',
      payload: updatedBudget,
      clientTimestamp: new Date().toISOString(),
      status: 'pending',
      retryCount: 0,
    });

    this.persist();
    if (this.isOnline()) {
      this.triggerSync();
    }
  }

  public updateGuiltFreeSpent(role: UserRole, deltaAmount: number) {
    this.state.guiltFree[role].spent += deltaAmount;
    this.persist();
  }

  private isSubcategory(childCatId: string, parentCatId: string): boolean {
    const cat = this.state.categories.find((c) => c.id === childCatId);
    return cat?.parentId === parentCatId;
  }

  // --- SUPABASE PULL & PUSH SYNC ENGINE ---
  public async pullFromSupabase(supabase: any, userId: string): Promise<boolean> {
    try {
      const [accRes, catRes, txnRes, budRes, goalRes, billRes, debtRes] = await Promise.all([
        supabase.from('accounts').select('*').eq('user_id', userId),
        supabase.from('categories').select('*').eq('user_id', userId),
        supabase.from('transactions').select('*').eq('user_id', userId),
        supabase.from('budgets').select('*').eq('user_id', userId),
        supabase.from('goals').select('*').eq('user_id', userId),
        supabase.from('bills').select('*').eq('user_id', userId),
        supabase.from('debts').select('*').eq('user_id', userId),
      ]);

      const pendingMap = new Map<string, SyncQueueItem>();
      for (const q of this.state.syncQueue) {
        if (q.status === 'pending' || q.status === 'syncing') {
          pendingMap.set(q.entityId, q);
        }
      }

      // 1. ACCOUNTS MERGE
      if (accRes.data) {
        const remoteAccs: Account[] = accRes.data.map((r: any) => ({
          id: r.id,
          workspaceId: r.workspace_id || 'ws-default',
          name: r.name,
          type: r.type,
          currency: r.currency || 'IDR',
          accountNumber: r.account_number || '',
          balance: Number(r.balance),
          initialBalance: Number(r.initial_balance),
          color: r.color,
          isArchived: Boolean(r.is_archived),
          isDeleted: Boolean(r.is_deleted),
          updatedAt: r.updated_at,
        })).filter((a: Account) => !a.isDeleted);

        const accMap = new Map<string, Account>();
        for (const ra of remoteAccs) {
          const pending = pendingMap.get(ra.id);
          if (pending && pending.operation === 'DELETE') continue;
          if (pending && (pending.operation === 'UPDATE' || pending.operation === 'INSERT')) {
            accMap.set(ra.id, pending.payload as Account);
          } else {
            accMap.set(ra.id, ra);
          }
        }
        for (const la of this.state.accounts) {
          if (la.isDeleted) continue;
          const pending = pendingMap.get(la.id);
          if (pending && pending.operation === 'DELETE') continue;
          if (!accMap.has(la.id) || pending) {
            accMap.set(la.id, la);
          }
        }
        this.state.accounts = Array.from(accMap.values());
      }

      // 2. CATEGORIES MERGE
      if (catRes.data) {
        const remoteCats: Category[] = catRes.data.map((r: any) => ({
          id: r.id,
          workspaceId: r.workspace_id || 'ws-default',
          parentId: r.parent_id,
          name: r.name,
          icon: r.icon,
          color: r.color,
          type: r.type,
          isSystem: Boolean(r.is_system),
          isDeleted: Boolean(r.is_deleted),
        })).filter((c: Category) => !c.isDeleted);

        const catMap = new Map<string, Category>();
        for (const rc of remoteCats) {
          const pending = pendingMap.get(rc.id);
          if (pending && pending.operation === 'DELETE') continue;
          if (pending && (pending.operation === 'UPDATE' || pending.operation === 'INSERT')) {
            catMap.set(rc.id, pending.payload as Category);
          } else {
            catMap.set(rc.id, rc);
          }
        }
        for (const lc of this.state.categories) {
          if (lc.isDeleted) continue;
          const pending = pendingMap.get(lc.id);
          if (pending && pending.operation === 'DELETE') continue;
          if (!catMap.has(lc.id) || pending) {
            catMap.set(lc.id, lc);
          }
        }
        this.state.categories = Array.from(catMap.values());
      }

      // 3. TRANSACTIONS MERGE
      if (txnRes.data) {
        const remoteTxs: Transaction[] = txnRes.data.map((r: any) => ({
          id: r.id,
          workspaceId: r.workspace_id || 'ws-default',
          accountId: r.account_id,
          categoryId: r.category_id,
          userId: r.user_id,
          amount: Number(r.amount),
          type: r.type,
          targetAccountId: r.target_account_id,
          partyFrom: r.party_from || '',
          partyTo: r.party_to || '',
          tags: r.tags || [],
          notes: r.notes || '',
          transactionDate: r.transaction_date,
          isGuiltFree: Boolean(r.is_guilt_free),
          guiltFreeOwner: r.guilt_free_owner,
          clientCreatedAt: r.client_created_at || r.updated_at,
          updatedAt: r.updated_at,
          version: r.version || 1,
          isDeleted: Boolean(r.is_deleted),
        })).filter((t: Transaction) => !t.isDeleted);

        const txMap = new Map<string, Transaction>();
        for (const rt of remoteTxs) {
          const pending = pendingMap.get(rt.id);
          if (pending && pending.operation === 'DELETE') continue;
          if (pending && (pending.operation === 'UPDATE' || pending.operation === 'INSERT')) {
            txMap.set(rt.id, pending.payload as Transaction);
          } else {
            txMap.set(rt.id, rt);
          }
        }
        for (const lt of this.state.transactions) {
          if (lt.isDeleted) continue;
          const pending = pendingMap.get(lt.id);
          if (pending && pending.operation === 'DELETE') continue;
          if (!txMap.has(lt.id) || pending) {
            txMap.set(lt.id, lt);
          }
        }
        this.state.transactions = Array.from(txMap.values()).sort(
          (a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()
        );
      }

      // 4. BUDGETS MERGE
      if (budRes.data) {
        const remoteBudgets: Budget[] = budRes.data.map((r: any) => ({
          id: r.id,
          workspaceId: r.workspace_id || 'ws-default',
          categoryId: r.category_id,
          accountId: r.account_id,
          duration: r.duration,
          startDate: r.start_date,
          endDate: r.end_date,
          periodMonth: r.period_month,
          limitAmount: Number(r.limit_amount),
          rolloverAmount: Number(r.rollover_amount),
          rolloverAction: r.rollover_action,
          updatedAt: r.updated_at,
          isDeleted: Boolean(r.is_deleted),
        })).filter((b: Budget) => !b.isDeleted);

        const bMap = new Map<string, Budget>();
        for (const rb of remoteBudgets) {
          const pending = pendingMap.get(rb.id);
          if (pending && pending.operation === 'DELETE') continue;
          if (pending && (pending.operation === 'UPDATE' || pending.operation === 'INSERT')) {
            bMap.set(rb.id, pending.payload as Budget);
          } else {
            bMap.set(rb.id, rb);
          }
        }
        for (const lb of this.state.budgets) {
          if (lb.isDeleted) continue;
          const pending = pendingMap.get(lb.id);
          if (pending && pending.operation === 'DELETE') continue;
          if (!bMap.has(lb.id) || pending) {
            bMap.set(lb.id, lb);
          }
        }
        this.state.budgets = Array.from(bMap.values());
      }

      // 5. GOALS MERGE
      if (goalRes.data) {
        const remoteGoals: SharedGoal[] = goalRes.data.map((r: any) => ({
          id: r.id,
          workspaceId: r.workspace_id || 'ws-default',
          name: r.name,
          targetAmount: Number(r.target_amount),
          currentAmount: Number(r.current_amount),
          targetDate: r.target_date,
          icon: r.icon,
          color: r.color,
          notes: r.notes,
          isCompleted: Boolean(r.is_completed),
          updatedAt: r.updated_at,
        }));

        const gMap = new Map<string, SharedGoal>();
        for (const rg of remoteGoals) {
          const pending = pendingMap.get(rg.id);
          if (pending && pending.operation === 'DELETE') continue;
          if (pending && (pending.operation === 'UPDATE' || pending.operation === 'INSERT')) {
            gMap.set(rg.id, pending.payload as SharedGoal);
          } else {
            gMap.set(rg.id, rg);
          }
        }
        for (const lg of this.state.goals) {
          const pending = pendingMap.get(lg.id);
          if (pending && pending.operation === 'DELETE') continue;
          if (!gMap.has(lg.id) || pending) {
            gMap.set(lg.id, lg);
          }
        }
        this.state.goals = Array.from(gMap.values());
      }

      // 6. BILLS MERGE
      if (billRes.data) {
        const remoteBills: RecurringBill[] = billRes.data.map((r: any) => ({
          id: r.id,
          workspaceId: r.workspace_id || 'ws-default',
          name: r.name,
          amount: Number(r.amount),
          categoryId: r.category_id,
          accountId: r.account_id,
          dueDay: r.due_day,
          frequency: r.frequency,
          notes: r.notes,
          paidMonths: r.paid_months || [],
          lastPaidDate: r.last_paid_date,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
          isDeleted: Boolean(r.is_deleted),
        })).filter((b: RecurringBill) => !b.isDeleted);

        const billMap = new Map<string, RecurringBill>();
        for (const rBill of remoteBills) {
          const pending = pendingMap.get(rBill.id);
          if (pending && pending.operation === 'DELETE') continue;
          if (pending && (pending.operation === 'UPDATE' || pending.operation === 'INSERT')) {
            billMap.set(rBill.id, pending.payload as RecurringBill);
          } else {
            billMap.set(rBill.id, rBill);
          }
        }
        for (const lBill of this.state.bills) {
          if (lBill.isDeleted) continue;
          const pending = pendingMap.get(lBill.id);
          if (pending && pending.operation === 'DELETE') continue;
          if (!billMap.has(lBill.id) || pending) {
            billMap.set(lBill.id, lBill);
          }
        }
        this.state.bills = Array.from(billMap.values());
      }

      // 7. DEBTS MERGE
      if (debtRes.data) {
        const remoteDebts: DebtItem[] = debtRes.data.map((r: any) => ({
          id: r.id,
          workspaceId: r.workspace_id || 'ws-default',
          type: r.type,
          personName: r.person_name,
          phone: r.phone,
          totalAmount: Number(r.total_amount),
          paidAmount: Number(r.paid_amount),
          startDate: r.start_date,
          dueDate: r.due_date,
          notes: r.notes,
          status: r.status,
          payments: r.payments || [],
          createdAt: r.created_at,
          updatedAt: r.updated_at,
          isDeleted: Boolean(r.is_deleted),
        })).filter((d: DebtItem) => !d.isDeleted);

        const dMap = new Map<string, DebtItem>();
        for (const rd of remoteDebts) {
          const pending = pendingMap.get(rd.id);
          if (pending && pending.operation === 'DELETE') continue;
          if (pending && (pending.operation === 'UPDATE' || pending.operation === 'INSERT')) {
            dMap.set(rd.id, pending.payload as DebtItem);
          } else {
            dMap.set(rd.id, rd);
          }
        }
        for (const ld of this.state.debts) {
          if (ld.isDeleted) continue;
          const pending = pendingMap.get(ld.id);
          if (pending && pending.operation === 'DELETE') continue;
          if (!dMap.has(ld.id) || pending) {
            dMap.set(ld.id, ld);
          }
        }
        this.state.debts = Array.from(dMap.values());
      }

      // Selalu kalkulasi ulang saldo rekening agar sesuai dengan seluruh transaksi yang masuk
      this.recalculateAccountBalances();
      this.persist();
      return true;
    } catch (e) {
      console.warn('Failed to pull data from Supabase:', e);
      return false;
    }
  }

  // --- SUPABASE REALTIME LIVE SYNC SUBSCRIPTION ---
  public setupRealtimeSubscription(userId: string) {
    const supabase = getSupabaseClient();
    if (!supabase || !isSupabaseConfigured() || !userId) return;

    if (this.realtimeChannel) {
      try {
        supabase.removeChannel(this.realtimeChannel);
      } catch {}
      this.realtimeChannel = null;
    }

    try {
      this.realtimeChannel = supabase
        .channel(`realtime-sync-${userId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${userId}` },
          (payload: any) => this.handleRealtimeTransaction(payload)
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'accounts', filter: `user_id=eq.${userId}` },
          (payload: any) => this.handleRealtimeAccount(payload)
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'categories', filter: `user_id=eq.${userId}` },
          (payload: any) => this.handleRealtimeCategory(payload)
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'budgets', filter: `user_id=eq.${userId}` },
          (payload: any) => this.handleRealtimeBudget(payload)
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'goals', filter: `user_id=eq.${userId}` },
          (payload: any) => this.handleRealtimeGoal(payload)
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'bills', filter: `user_id=eq.${userId}` },
          (payload: any) => this.handleRealtimeBill(payload)
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'debts', filter: `user_id=eq.${userId}` },
          (payload: any) => this.handleRealtimeDebt(payload)
        )
        .subscribe((status: string) => {
          if (status === 'SUBSCRIBED') {
            console.log('[Supabase Realtime] Live sync active for user:', userId);
          }
        });
    } catch (err) {
      console.warn('Realtime subscription setup failed:', err);
    }
  }

  private handleRealtimeTransaction(payload: any) {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    if (eventType === 'DELETE') {
      const id = oldRecord?.id;
      if (id) {
        this.state.transactions = this.state.transactions.filter((t) => t.id !== id);
        this.recalculateAccountBalances();
        this.persist();
      }
    } else if (eventType === 'INSERT' || eventType === 'UPDATE') {
      if (!newRecord) return;
      if (newRecord.is_deleted) {
        this.state.transactions = this.state.transactions.filter((t) => t.id !== newRecord.id);
        this.recalculateAccountBalances();
        this.persist();
        return;
      }

      // Abaikan jika item ini masih dalam proses syncQueue lokal agar tidak overwrite
      const isPending = this.state.syncQueue.some(
        (q) => q.entityTable === 'transactions' && q.entityId === newRecord.id && q.status === 'pending'
      );
      if (isPending) return;

      const tx: Transaction = {
        id: newRecord.id,
        workspaceId: newRecord.workspace_id || 'ws-default',
        accountId: newRecord.account_id,
        categoryId: newRecord.category_id,
        userId: newRecord.user_id,
        amount: Number(newRecord.amount),
        type: newRecord.type,
        targetAccountId: newRecord.target_account_id,
        partyFrom: newRecord.party_from || '',
        partyTo: newRecord.party_to || '',
        tags: newRecord.tags || [],
        notes: newRecord.notes || '',
        transactionDate: newRecord.transaction_date,
        isGuiltFree: Boolean(newRecord.is_guilt_free),
        guiltFreeOwner: newRecord.guilt_free_owner,
        clientCreatedAt: newRecord.client_created_at || newRecord.updated_at,
        updatedAt: newRecord.updated_at,
        version: newRecord.version || 1,
        isDeleted: Boolean(newRecord.is_deleted),
      };

      const existingIndex = this.state.transactions.findIndex((t) => t.id === tx.id);
      if (existingIndex >= 0) {
        this.state.transactions[existingIndex] = tx;
      } else {
        this.state.transactions = [tx, ...this.state.transactions].sort(
          (a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()
        );
      }

      this.recalculateAccountBalances();
      this.persist();
    }
  }

  private handleRealtimeAccount(payload: any) {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    if (eventType === 'DELETE') {
      const id = oldRecord?.id;
      if (id) {
        this.state.accounts = this.state.accounts.filter((a) => a.id !== id);
        this.recalculateAccountBalances();
        this.persist();
      }
    } else if (eventType === 'INSERT' || eventType === 'UPDATE') {
      if (!newRecord || newRecord.is_deleted) {
        if (newRecord?.id) {
          this.state.accounts = this.state.accounts.filter((a) => a.id !== newRecord.id);
          this.recalculateAccountBalances();
          this.persist();
        }
        return;
      }

      const isPending = this.state.syncQueue.some(
        (q) => q.entityTable === 'accounts' && q.entityId === newRecord.id && q.status === 'pending'
      );
      if (isPending) return;

      const acc: Account = {
        id: newRecord.id,
        workspaceId: newRecord.workspace_id || 'ws-default',
        name: newRecord.name,
        type: newRecord.type,
        currency: newRecord.currency || 'IDR',
        accountNumber: newRecord.account_number || '',
        balance: Number(newRecord.balance),
        initialBalance: Number(newRecord.initial_balance),
        color: newRecord.color,
        isArchived: Boolean(newRecord.is_archived),
        isDeleted: Boolean(newRecord.is_deleted),
        updatedAt: newRecord.updated_at,
      };

      const existingIndex = this.state.accounts.findIndex((a) => a.id === acc.id);
      if (existingIndex >= 0) {
        this.state.accounts[existingIndex] = acc;
      } else {
        this.state.accounts = [...this.state.accounts, acc];
      }

      this.recalculateAccountBalances();
      this.persist();
    }
  }

  private handleRealtimeCategory(payload: any) {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    if (eventType === 'DELETE') {
      const id = oldRecord?.id;
      if (id) {
        this.state.categories = this.state.categories.filter((c) => c.id !== id);
        this.persist();
      }
    } else if (eventType === 'INSERT' || eventType === 'UPDATE') {
      if (!newRecord || newRecord.is_deleted) {
        if (newRecord?.id) {
          this.state.categories = this.state.categories.filter((c) => c.id !== newRecord.id);
          this.persist();
        }
        return;
      }

      const isPending = this.state.syncQueue.some(
        (q) => q.entityTable === 'categories' && q.entityId === newRecord.id && q.status === 'pending'
      );
      if (isPending) return;

      const cat: Category = {
        id: newRecord.id,
        workspaceId: newRecord.workspace_id || 'ws-default',
        parentId: newRecord.parent_id,
        name: newRecord.name,
        icon: newRecord.icon,
        color: newRecord.color,
        type: newRecord.type,
        isSystem: Boolean(newRecord.is_system),
        isDeleted: Boolean(newRecord.is_deleted),
      };

      const existingIndex = this.state.categories.findIndex((c) => c.id === cat.id);
      if (existingIndex >= 0) {
        this.state.categories[existingIndex] = cat;
      } else {
        this.state.categories = [...this.state.categories, cat];
      }
      this.persist();
    }
  }

  private handleRealtimeBudget(payload: any) {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    if (eventType === 'DELETE') {
      const id = oldRecord?.id;
      if (id) {
        this.state.budgets = this.state.budgets.filter((b) => b.id !== id);
        this.persist();
      }
    } else if (eventType === 'INSERT' || eventType === 'UPDATE') {
      if (!newRecord || newRecord.is_deleted) {
        if (newRecord?.id) {
          this.state.budgets = this.state.budgets.filter((b) => b.id !== newRecord.id);
          this.persist();
        }
        return;
      }
      const isPending = this.state.syncQueue.some(
        (q) => q.entityTable === 'budgets' && q.entityId === newRecord.id && q.status === 'pending'
      );
      if (isPending) return;

      const b: Budget = {
        id: newRecord.id,
        workspaceId: newRecord.workspace_id || 'ws-default',
        categoryId: newRecord.category_id,
        accountId: newRecord.account_id,
        duration: newRecord.duration,
        startDate: newRecord.start_date,
        endDate: newRecord.end_date,
        periodMonth: newRecord.period_month,
        limitAmount: Number(newRecord.limit_amount),
        rolloverAmount: Number(newRecord.rollover_amount),
        rolloverAction: newRecord.rollover_action,
        updatedAt: newRecord.updated_at,
        isDeleted: Boolean(newRecord.is_deleted),
      };

      const existingIndex = this.state.budgets.findIndex((item) => item.id === b.id);
      if (existingIndex >= 0) {
        this.state.budgets[existingIndex] = b;
      } else {
        this.state.budgets = [...this.state.budgets, b];
      }
      this.persist();
    }
  }

  private handleRealtimeGoal(payload: any) {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    if (eventType === 'DELETE') {
      const id = oldRecord?.id;
      if (id) {
        this.state.goals = this.state.goals.filter((g) => g.id !== id);
        this.persist();
      }
    } else if (eventType === 'INSERT' || eventType === 'UPDATE') {
      if (!newRecord) return;
      const isPending = this.state.syncQueue.some(
        (q) => q.entityTable === 'goals' && q.entityId === newRecord.id && q.status === 'pending'
      );
      if (isPending) return;

      const g: SharedGoal = {
        id: newRecord.id,
        workspaceId: newRecord.workspace_id || 'ws-default',
        name: newRecord.name,
        targetAmount: Number(newRecord.target_amount),
        currentAmount: Number(newRecord.current_amount),
        targetDate: newRecord.target_date,
        icon: newRecord.icon,
        color: newRecord.color,
        notes: newRecord.notes,
        isCompleted: Boolean(newRecord.is_completed),
        updatedAt: newRecord.updated_at,
      };

      const existingIndex = this.state.goals.findIndex((item) => item.id === g.id);
      if (existingIndex >= 0) {
        this.state.goals[existingIndex] = g;
      } else {
        this.state.goals = [...this.state.goals, g];
      }
      this.persist();
    }
  }

  private handleRealtimeBill(payload: any) {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    if (eventType === 'DELETE') {
      const id = oldRecord?.id;
      if (id) {
        this.state.bills = this.state.bills.filter((b) => b.id !== id);
        this.persist();
      }
    } else if (eventType === 'INSERT' || eventType === 'UPDATE') {
      if (!newRecord || newRecord.is_deleted) {
        if (newRecord?.id) {
          this.state.bills = this.state.bills.filter((b) => b.id !== newRecord.id);
          this.persist();
        }
        return;
      }
      const isPending = this.state.syncQueue.some(
        (q) => q.entityTable === 'bills' && q.entityId === newRecord.id && q.status === 'pending'
      );
      if (isPending) return;

      const bill: RecurringBill = {
        id: newRecord.id,
        workspaceId: newRecord.workspace_id || 'ws-default',
        name: newRecord.name,
        amount: Number(newRecord.amount),
        categoryId: newRecord.category_id,
        accountId: newRecord.account_id,
        dueDay: newRecord.due_day,
        frequency: newRecord.frequency,
        notes: newRecord.notes,
        paidMonths: newRecord.paid_months || [],
        lastPaidDate: newRecord.last_paid_date,
        createdAt: newRecord.created_at,
        updatedAt: newRecord.updated_at,
        isDeleted: Boolean(newRecord.is_deleted),
      };

      const existingIndex = this.state.bills.findIndex((item) => item.id === bill.id);
      if (existingIndex >= 0) {
        this.state.bills[existingIndex] = bill;
      } else {
        this.state.bills = [...this.state.bills, bill];
      }
      this.persist();
    }
  }

  private handleRealtimeDebt(payload: any) {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    if (eventType === 'DELETE') {
      const id = oldRecord?.id;
      if (id) {
        this.state.debts = this.state.debts.filter((d) => d.id !== id);
        this.persist();
      }
    } else if (eventType === 'INSERT' || eventType === 'UPDATE') {
      if (!newRecord || newRecord.is_deleted) {
        if (newRecord?.id) {
          this.state.debts = this.state.debts.filter((d) => d.id !== newRecord.id);
          this.persist();
        }
        return;
      }
      const isPending = this.state.syncQueue.some(
        (q) => q.entityTable === 'debts' && q.entityId === newRecord.id && q.status === 'pending'
      );
      if (isPending) return;

      const debt: DebtItem = {
        id: newRecord.id,
        workspaceId: newRecord.workspace_id || 'ws-default',
        type: newRecord.type,
        personName: newRecord.person_name,
        phone: newRecord.phone,
        totalAmount: Number(newRecord.total_amount),
        paidAmount: Number(newRecord.paid_amount),
        startDate: newRecord.start_date,
        dueDate: newRecord.due_date,
        notes: newRecord.notes,
        status: newRecord.status,
        payments: newRecord.payments || [],
        createdAt: newRecord.created_at,
        updatedAt: newRecord.updated_at,
        isDeleted: Boolean(newRecord.is_deleted),
      };

      const existingIndex = this.state.debts.findIndex((item) => item.id === debt.id);
      if (existingIndex >= 0) {
        this.state.debts[existingIndex] = debt;
      } else {
        this.state.debts = [...this.state.debts, debt];
      }
      this.persist();
    }
  }

  // --- SYNC ENGINE ---
  public async triggerSync(): Promise<number> {
    if (this.isSyncing || !this.isOnline()) {
      return 0;
    }

    const pendingItems = this.state.syncQueue.filter((q) => q.status === 'pending');
    if (pendingItems.length === 0) {
      return 0;
    }

    const supabase = getSupabaseClient();
    if (!supabase || !isSupabaseConfigured()) {
      return 0;
    }

    this.isSyncing = true;
    this.notify();

    const syncingIds = new Set(pendingItems.map((i) => i.id));
    this.state.syncQueue = this.state.syncQueue.map((item) =>
      syncingIds.has(item.id) ? { ...item, status: 'syncing' } : item
    );
    this.persist();

    const successfullySyncedIds = new Set<string>();

    try {
      let userId: string | undefined;
      const { data: sessionData } = await supabase.auth.getSession();
      userId = sessionData?.session?.user?.id;
      if (!userId) {
        const { data: userData } = await supabase.auth.getUser();
        userId = userData?.user?.id;
      }

      if (!userId) {
        console.warn('Sync aborted: No authenticated user ID found.');
        this.state.syncQueue = this.state.syncQueue.map((item) =>
          syncingIds.has(item.id) ? { ...item, status: 'pending' } : item
        );
        this.persist();
        return 0;
      }

      for (const item of pendingItems) {
        try {
          let error: any = null;

          if (item.entityTable === 'transactions') {
            if (item.operation === 'INSERT' || item.operation === 'UPDATE') {
              const tx = item.payload;
              const res = await supabase.from('transactions').upsert({
                id: tx.id,
                user_id: userId,
                workspace_id: tx.workspaceId || 'ws-default',
                account_id: tx.accountId,
                category_id: tx.categoryId,
                amount: tx.amount,
                type: tx.type,
                target_account_id: tx.targetAccountId || null,
                party_from: tx.partyFrom || null,
                party_to: tx.partyTo || null,
                tags: tx.tags || [],
                notes: tx.notes || null,
                transaction_date: tx.transactionDate,
                is_guilt_free: Boolean(tx.isGuiltFree),
                guilt_free_owner: tx.guiltFreeOwner || null,
                updated_at: tx.updatedAt || new Date().toISOString(),
                is_deleted: Boolean(tx.isDeleted),
              });
              error = res.error;
            } else if (item.operation === 'DELETE') {
              const res = await supabase.from('transactions').delete().eq('id', item.entityId);
              error = res.error;
            }
          } else if (item.entityTable === 'accounts') {
            if (item.operation === 'INSERT' || item.operation === 'UPDATE') {
              const acc = item.payload;
              const res = await supabase.from('accounts').upsert({
                id: acc.id,
                user_id: userId,
                workspace_id: acc.workspaceId || 'ws-default',
                name: acc.name,
                type: acc.type,
                currency: acc.currency || 'IDR',
                account_number: acc.accountNumber || '',
                balance: acc.balance,
                initial_balance: acc.initialBalance,
                color: acc.color,
                is_archived: Boolean(acc.isArchived),
                is_deleted: Boolean(acc.isDeleted),
                updated_at: acc.updatedAt || new Date().toISOString(),
              });
              error = res.error;
            } else if (item.operation === 'DELETE') {
              const res = await supabase.from('accounts').delete().eq('id', item.entityId);
              error = res.error;
            }
          } else if (item.entityTable === 'categories') {
            if (item.operation === 'INSERT' || item.operation === 'UPDATE') {
              const cat = item.payload;
              const res = await supabase.from('categories').upsert({
                id: cat.id,
                user_id: userId,
                workspace_id: cat.workspaceId || 'ws-default',
                parent_id: cat.parentId || null,
                name: cat.name,
                icon: cat.icon,
                color: cat.color,
                type: cat.type,
                is_system: Boolean(cat.isSystem),
                is_deleted: Boolean(cat.isDeleted),
              });
              error = res.error;
            } else if (item.operation === 'DELETE') {
              const res = await supabase.from('categories').delete().eq('id', item.entityId);
              error = res.error;
            }
          } else if (item.entityTable === 'budgets') {
            if (item.operation === 'INSERT' || item.operation === 'UPDATE') {
              const b = item.payload;
              const res = await supabase.from('budgets').upsert({
                id: b.id,
                user_id: userId,
                workspace_id: b.workspaceId || 'ws-default',
                category_id: b.categoryId,
                account_id: b.accountId || 'all',
                duration: b.duration || '1_month',
                start_date: b.startDate,
                end_date: b.endDate,
                period_month: b.periodMonth || null,
                limit_amount: b.limitAmount,
                rollover_amount: b.rolloverAmount || 0,
                rollover_action: b.rolloverAction || 'rollover',
                updated_at: b.updatedAt || new Date().toISOString(),
                is_deleted: Boolean(b.isDeleted),
              });
              error = res.error;
            } else if (item.operation === 'DELETE') {
              const res = await supabase.from('budgets').delete().eq('id', item.entityId);
              error = res.error;
            }
          } else if (item.entityTable === 'goals') {
            if (item.operation === 'INSERT' || item.operation === 'UPDATE') {
              const g = item.payload;
              const res = await supabase.from('goals').upsert({
                id: g.id,
                user_id: userId,
                workspace_id: g.workspaceId || 'ws-default',
                name: g.name,
                target_amount: g.targetAmount,
                current_amount: g.currentAmount,
                target_date: g.targetDate,
                icon: g.icon,
                color: g.color || '#3B82F6',
                notes: g.notes || null,
                is_completed: Boolean(g.isCompleted),
                updated_at: g.updatedAt || new Date().toISOString(),
              });
              error = res.error;
            } else if (item.operation === 'DELETE') {
              const res = await supabase.from('goals').delete().eq('id', item.entityId);
              error = res.error;
            }
          } else if (item.entityTable === 'bills') {
            if (item.operation === 'INSERT' || item.operation === 'UPDATE') {
              const bill = item.payload;
              const res = await supabase.from('bills').upsert({
                id: bill.id,
                user_id: userId,
                workspace_id: bill.workspaceId || 'ws-default',
                name: bill.name,
                amount: bill.amount,
                category_id: bill.categoryId,
                account_id: bill.accountId || null,
                due_day: bill.dueDay,
                frequency: bill.frequency || 'monthly',
                notes: bill.notes || null,
                paid_months: bill.paidMonths || [],
                last_paid_date: bill.lastPaidDate || null,
                created_at: bill.createdAt || new Date().toISOString(),
                updated_at: bill.updatedAt || new Date().toISOString(),
                is_deleted: Boolean(bill.isDeleted),
              });
              error = res.error;
            } else if (item.operation === 'DELETE') {
              const res = await supabase.from('bills').delete().eq('id', item.entityId);
              error = res.error;
            }
          } else if (item.entityTable === 'debts') {
            if (item.operation === 'INSERT' || item.operation === 'UPDATE') {
              const d = item.payload;
              const res = await supabase.from('debts').upsert({
                id: d.id,
                user_id: userId,
                workspace_id: d.workspaceId || 'ws-default',
                type: d.type,
                person_name: d.personName,
                phone: d.phone || null,
                total_amount: d.totalAmount,
                paid_amount: d.paidAmount || 0,
                start_date: d.startDate,
                due_date: d.dueDate || null,
                notes: d.notes || null,
                status: d.status || 'active',
                payments: d.payments || [],
                created_at: d.createdAt || new Date().toISOString(),
                updated_at: d.updatedAt || new Date().toISOString(),
                is_deleted: Boolean(d.isDeleted),
              });
              error = res.error;
            } else if (item.operation === 'DELETE') {
              const res = await supabase.from('debts').delete().eq('id', item.entityId);
              error = res.error;
            }
          }

          if (!error) {
            successfullySyncedIds.add(item.id);
          } else {
            console.warn(`Item ${item.id} sync failed:`, error);
          }
        } catch (syncErr) {
          console.warn(`Item ${item.id} sync exception:`, syncErr);
        }
      }

      this.state.syncQueue = this.state.syncQueue.map((item) => {
        if (syncingIds.has(item.id)) {
          return successfullySyncedIds.has(item.id)
            ? { ...item, status: 'synced' }
            : { ...item, status: 'pending', retryCount: item.retryCount + 1 };
        }
        return item;
      });

      this.persist();
      return successfullySyncedIds.size;
    } catch (err) {
      console.error('Trigger sync error:', err);
      this.state.syncQueue = this.state.syncQueue.map((item) =>
        syncingIds.has(item.id) ? { ...item, status: 'pending', retryCount: item.retryCount + 1 } : item
      );
      this.persist();
      return 0;
    } finally {
      this.isSyncing = false;
      this.notify();
    }
  }

  public clearSyncedQueue() {
    this.state.syncQueue = this.state.syncQueue.filter((q) => q.status !== 'synced');
    this.persist();
  }

  public resetToSampleData() {
    this.state = {
      accounts: INITIAL_ACCOUNTS,
      categories: INITIAL_CATEGORIES,
      transactions: INITIAL_TRANSACTIONS,
      budgets: INITIAL_BUDGETS,
      goals: INITIAL_GOALS,
      bills: INITIAL_BILLS,
      debts: INITIAL_DEBTS,
      syncQueue: [],
      guiltFree: INITIAL_GUILT_FREE,
      activeRole: 'husband',
      userAccount: {
        accountName: '',
        email: '',
        password: '',
        createdAt: '',
      },
      isAuthenticated: false,
      currentUserEmail: '',
      isSimulatedOffline: false,
      isLocked: false,
      pin: '',
    };
    this.persist();
  }
}

export const storageEngine = new OfflineStorageEngine();
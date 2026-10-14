export type UserRole = 'husband' | 'wife';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
}

export interface Workspace {
  id: string;
  name: string;
  currency: string;
  createdAt: string;
}

export type AccountType = 'bank' | 'ewallet' | 'cash' | 'investment';

export interface Account {
  id: string;
  workspaceId: string;
  name: string;
  type: AccountType;
  currency: string;
  accountNumber?: string;
  balance: number;
  initialBalance: number;
  color: string;
  isArchived?: boolean;
  updatedAt: string;
  isDeleted?: boolean;
}

export type TransactionType = 'expense' | 'income' | 'transfer';

export interface Category {
  id: string;
  workspaceId: string;
  parentId?: string | null;
  name: string;
  icon: string;
  color: string;
  type: 'expense' | 'income';
  isSystem?: boolean;
  isDeleted?: boolean;
}

export interface Transaction {
  id: string; // Client-generated UUID
  workspaceId: string;
  accountId: string;
  categoryId: string;
  userId: string;
  amount: number;
  type: TransactionType;
  targetAccountId?: string | null; // For transfers
  partyFrom?: string; // Sesuai flow isian "dari"
  partyTo?: string; // Sesuai flow isian "ke"
  tags: string[];
  notes?: string;
  transactionDate: string; // ISO string
  isGuiltFree?: boolean; // Dompet pribadi (uang jajan)
  guiltFreeOwner?: UserRole | null;
  clientCreatedAt: string;
  updatedAt: string;
  version: number;
  isDeleted?: boolean;
}

export type BudgetDuration = '1_week' | '1_month' | '1_year' | 'custom';
export type RolloverAction = 'rollover' | 'savings' | 'reset';

export interface Budget {
  id: string;
  workspaceId: string;
  categoryId: string;
  accountId: string; // 'all' atau specific account ID
  duration: BudgetDuration;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  periodMonth?: string; // 'YYYY-MM' (backward compatibility)
  limitAmount: number;
  rolloverAmount: number;
  rolloverAction?: RolloverAction;
  updatedAt: string;
  isDeleted?: boolean;
}

export interface SharedGoal {
  id: string;
  workspaceId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  icon: string;
  color?: string;
  notes?: string;
  isCompleted: boolean;
  updatedAt: string;
}

export interface RecurringBill {
  id: string;
  workspaceId: string;
  name: string;
  amount: number;
  categoryId: string;
  accountId?: string;
  dueDay: number; // 1-31 (tanggal jatuh tempo tiap bulan)
  frequency: 'monthly' | 'weekly' | 'yearly';
  notes?: string;
  paidMonths: string[]; // List of 'YYYY-MM' strings for paid status
  lastPaidDate?: string;
  createdAt: string;
  updatedAt: string;
  isDeleted?: boolean;
}

export type DebtType = 'debt' | 'receivable'; // 'debt' = Hutang Saya, 'receivable' = Piutang Saya

export interface DebtPayment {
  id: string;
  date: string;
  amount: number;
  accountId?: string;
  notes?: string;
}

export interface DebtItem {
  id: string;
  workspaceId: string;
  type: DebtType;
  personName: string;
  phone?: string;
  totalAmount: number;
  paidAmount: number;
  startDate: string;
  dueDate?: string;
  notes?: string;
  status: 'active' | 'settled';
  payments: DebtPayment[];
  createdAt: string;
  updatedAt: string;
  isDeleted?: boolean;
}

export interface GuiltFreeWallet {
  role: UserRole;
  allocatedAmount: number;
  spentAmount: number;
}

export type SyncOperation = 'INSERT' | 'UPDATE' | 'DELETE';
export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'conflict';

export interface SyncQueueItem {
  id: string;
  entityTable: 'accounts' | 'transactions' | 'budgets' | 'goals' | 'categories' | 'bills' | 'debts';
  entityId: string;
  operation: SyncOperation;
  payload: any;
  clientTimestamp: string;
  status: SyncStatus;
  retryCount: number;
  error?: string;
}


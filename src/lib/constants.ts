import { Account, Category, Budget, SharedGoal, Transaction, UserProfile, Workspace, RecurringBill, DebtItem } from '../types/finance';

export const CURRENT_WORKSPACE: Workspace = {
  id: 'ws-keluarga-pratama-001',
  name: 'Buku Kas Keluarga Pratama',
  currency: 'IDR',
  createdAt: '2026-01-01T00:00:00.000Z',
};

export const HUSBAND_USER: UserProfile | null = null;
export const WIFE_USER: UserProfile | null = null;

export const INITIAL_ACCOUNTS: Account[] = [];
export const INITIAL_CATEGORIES: Category[] = [];

export const AVAILABLE_TAGS: string[] = [];

export const INITIAL_TRANSACTIONS: Transaction[] = [];

export const INITIAL_BUDGETS: Budget[] = [];

export const INITIAL_GOALS: SharedGoal[] = [];

export const INITIAL_GUILT_FREE = {
  husband: {
    allocated: 0,
    spent: 0,
  },
  wife: {
    allocated: 0,
    spent: 0,
  },
};

export const INITIAL_BILLS: RecurringBill[] = [];

export const INITIAL_DEBTS: DebtItem[] = [];



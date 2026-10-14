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

const DB_NAME = 'keluarga_fin_offline_db';
const DB_VERSION = 1;

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
  isSimulatedOffline: boolean;
  isLocked: boolean;
  pin: string;
}

class OfflineStorageEngine {
  private db: IDBDatabase | null = null;
  private state: StorageState;
  private listeners: Set<() => void> = new Set();
  private isSyncing = false;

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
      isSimulatedOffline: false,
      isLocked: false,
      pin: '1234',
    };

    this.init();
  }

  private async init() {
    try {
      const saved = localStorage.getItem('keluarga_fin_state');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          this.state = {
            ...this.state,
            ...parsed,
            bills: Array.isArray(parsed.bills) ? parsed.bills : INITIAL_BILLS,
            debts: Array.isArray(parsed.debts) ? parsed.debts : INITIAL_DEBTS,
          };
        } catch {
          // fallback
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
        window.addEventListener('online', () => {
          this.notify();
          this.triggerSync();
        });
        window.addEventListener('offline', () => {
          this.notify();
        });
      }
    } catch {
      // storage unavailable
    }
  }

  private persist() {
    try {
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

    // 1. Optimistic Local Update: Update transaction list
    this.state.transactions = [transaction, ...this.state.transactions];

    // 2. Optimistic Balance Mutation
    this.updateAccountBalance(
      input.accountId,
      input.amount,
      input.type,
      input.targetAccountId
    );

    // 3. Guilt Free Spending update if toggled
    if (input.isGuiltFree && input.guiltFreeOwner) {
      this.state.guiltFree[input.guiltFreeOwner].spent += input.amount;
    }

    // 4. Enqueue into local Sync Queue
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

    this.persist();
    if (this.isOnline()) {
      this.triggerSync();
    }

    return transaction;
  }

  public updateTransaction(id: string, updates: Partial<Transaction>) {
    const oldTxn = this.state.transactions.find((t) => t.id === id);
    if (!oldTxn) return;

    // First revert old balance impact
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

    // Apply new balance impact
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

    this.persist();
    if (this.isOnline()) this.triggerSync();
  }

  public deleteTransaction(id: string) {
    const txn = this.state.transactions.find((t) => t.id === id);
    if (!txn) return;

    // Revert account balance
    if (txn.type === 'expense') {
      this.revertBalance(txn.accountId, txn.amount, 'income');
    } else if (txn.type === 'income') {
      this.revertBalance(txn.accountId, txn.amount, 'expense');
    } else if (txn.type === 'transfer' && txn.targetAccountId) {
      this.revertBalance(txn.accountId, txn.amount, 'income');
      this.revertBalance(txn.targetAccountId, txn.amount, 'expense');
    }

    // Revert guilt-free if applicable
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
    this.state.accounts = this.state.accounts.map((acc) => {
      if (acc.id === sourceAccountId) {
        if (type === 'expense' || type === 'transfer') {
          return { ...acc, balance: acc.balance - amount, updatedAt: new Date().toISOString() };
        } else if (type === 'income') {
          return { ...acc, balance: acc.balance + amount, updatedAt: new Date().toISOString() };
        }
      }
      if (type === 'transfer' && targetAccountId && acc.id === targetAccountId) {
        return { ...acc, balance: acc.balance + amount, updatedAt: new Date().toISOString() };
      }
      return acc;
    });
  }

  private revertBalance(accountId: string, amount: number, direction: 'expense' | 'income') {
    this.state.accounts = this.state.accounts.map((acc) => {
      if (acc.id === accountId) {
        return {
          ...acc,
          balance: direction === 'income' ? acc.balance + amount : acc.balance - amount,
          updatedAt: new Date().toISOString(),
        };
      }
      return acc;
    });
  }

  // --- CATEGORIES MANAGEMENT ---
  public addCategory(input: {
    name: string;
    parentId?: string | null;
    icon: string;
    color: string;
    type: 'expense' | 'income';
  }): Category {
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
    this.persist();
    return newCat;
  }

  public updateCategory(id: string, updates: Partial<Category>) {
    this.state.categories = this.state.categories.map((c) =>
      c.id === id ? { ...c, ...updates } : c
    );
    this.persist();
  }

  public deleteCategory(id: string) {
    this.state.categories = this.state.categories.filter((c) => c.id !== id && c.parentId !== id);
    this.persist();
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
    this.persist();
  }

  public deleteBudget(id: string) {
    this.state.budgets = this.state.budgets.filter((b) => b.id !== id);
    this.state.syncQueue.push({
      id: this.generateUUID(),
      entityTable: 'budgets',
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
    this.persist();
    return newGoal;
  }

  public updateGoal(id: string, updates: Partial<SharedGoal>) {
    const now = new Date().toISOString();
    this.state.goals = this.state.goals.map((g) => {
      if (g.id === id) {
        const updated = { ...g, ...updates, updatedAt: now };
        updated.isCompleted = updated.currentAmount >= updated.targetAmount;
        return updated;
      }
      return g;
    });
    this.persist();
  }

  public deleteGoal(id: string) {
    this.state.goals = this.state.goals.filter((g) => g.id !== id);
    this.persist();
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
    this.persist();
    return newBill;
  }

  public updateBill(id: string, updates: Partial<RecurringBill>) {
    const now = new Date().toISOString();
    this.state.bills = this.state.bills.map((b) =>
      b.id === id ? { ...b, ...updates, updatedAt: now } : b
    );
    this.persist();
  }

  public deleteBill(id: string) {
    this.state.bills = this.state.bills.filter((b) => b.id !== id);
    this.persist();
  }

  public payBill(billId: string, accountId: string, customNotes?: string) {
    const bill = this.state.bills.find((b) => b.id === billId);
    if (!bill) return;

    const currentMonth = new Date().toISOString().slice(0, 7); // 'YYYY-MM'
    if (!bill.paidMonths.includes(currentMonth)) {
      bill.paidMonths.push(currentMonth);
    }
    bill.lastPaidDate = new Date().toISOString();
    bill.updatedAt = new Date().toISOString();

    // Auto deduct account balance
    this.state.accounts = this.state.accounts.map((acc) => {
      if (acc.id === accountId) {
        return { ...acc, balance: acc.balance - bill.amount, updatedAt: new Date().toISOString() };
      }
      return acc;
    });

    // Record expense transaction
    const now = new Date().toISOString();
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

    this.persist();
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

  // --- DEBTS & LOANS (HUTANG PIUTANG) MANAGEMENT ---
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
    this.persist();
    return newDebt;
  }

  public updateDebt(id: string, updates: Partial<DebtItem>) {
    const now = new Date().toISOString();
    this.state.debts = this.state.debts.map((d) => {
      if (d.id === id) {
        const updated = { ...d, ...updates, updatedAt: now };
        updated.status = updated.paidAmount >= updated.totalAmount ? 'settled' : 'active';
        return updated;
      }
      return d;
    });
    this.persist();
  }

  public deleteDebt(id: string) {
    this.state.debts = this.state.debts.filter((d) => d.id !== id);
    this.persist();
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

    // Adjust account balance if accountId is provided
    if (payment.accountId) {
      this.state.accounts = this.state.accounts.map((acc) => {
        if (acc.id === payment.accountId) {
          // If debt (Hutang Saya): we pay out money -> expense / deduct balance
          // If receivable (Piutang Saya): person pays us money -> income / add balance
          const delta = debt.type === 'debt' ? -paymentAmount : paymentAmount;
          return { ...acc, balance: acc.balance + delta, updatedAt: new Date().toISOString() };
        }
        return acc;
      });

      // Record transaction
      const now = new Date().toISOString();
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

    this.state.debts = this.state.debts.map((d) => {
      if (d.id === debtId) {
        return {
          ...d,
          paidAmount: newPaidTotal,
          status: isSettled ? 'settled' : 'active',
          payments: [newPayment, ...d.payments],
          updatedAt: new Date().toISOString(),
        };
      }
      return d;
    });

    this.persist();
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

    // Add UTF-8 BOM so Excel opens it with Indonesian characters correctly
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

  // --- SYNC ENGINE ---
  public async triggerSync(): Promise<number> {
    if (this.isSyncing || !this.isOnline()) {
      return 0;
    }

    const pendingItems = this.state.syncQueue.filter((q) => q.status === 'pending');
    if (pendingItems.length === 0) {
      return 0;
    }

    this.isSyncing = true;
    this.notify();

    this.state.syncQueue = this.state.syncQueue.map((item) =>
      item.status === 'pending' ? { ...item, status: 'syncing' } : item
    );
    this.persist();

    try {
      await new Promise((resolve) => setTimeout(resolve, 400));

      this.state.syncQueue = this.state.syncQueue.map((item) =>
        item.status === 'syncing' ? { ...item, status: 'synced' } : item
      );

      this.persist();
      return pendingItems.length;
    } catch {
      this.state.syncQueue = this.state.syncQueue.map((item) =>
        item.status === 'syncing'
          ? { ...item, status: 'pending', retryCount: item.retryCount + 1 }
          : item
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
      isSimulatedOffline: false,
      isLocked: false,
      pin: '1234',
    };
    this.persist();
  }
}

export const storageEngine = new OfflineStorageEngine();

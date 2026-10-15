import { useState, useEffect } from 'react';
import { storageEngine } from '../lib/storage';
import { UserRole } from '../types/finance';

export function useFinanceStore() {
  const [state, setState] = useState(() => storageEngine.getState());
  const [isOnline, setIsOnline] = useState(() => storageEngine.isOnline());
  const [isSyncing, setIsSyncing] = useState(() => storageEngine.isSyncInProgress());

  useEffect(() => {
    const unsubscribe = storageEngine.subscribe(() => {
      setState(storageEngine.getState());
      setIsOnline(storageEngine.isOnline());
      setIsSyncing(storageEngine.isSyncInProgress());
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const pendingSyncCount = state.syncQueue.filter((q) => q.status === 'pending').length;

  return {
    ...state,
    isOnline,
    isSyncing,
    pendingSyncCount,
    // Actions
    login: (email: string, password?: string) => storageEngine.login(email, password),
    signUp: (input: { accountName: string; email: string; password?: string }) =>
      storageEngine.signUp(input),
    updateUserAccount: (updates: { accountName?: string; password?: string }) =>
      storageEngine.updateUserAccount(updates),
    logout: () => storageEngine.logout(),
    toggleSimulatedOffline: () => storageEngine.toggleSimulatedOffline(),
    setActiveRole: (role: UserRole) => storageEngine.setActiveRole(role),
    setLocked: (locked: boolean) => storageEngine.setLocked(locked),
    verifyPin: (pin: string) => storageEngine.verifyPin(pin),
    setPin: (pin: string) => storageEngine.setPin(pin),
    // Accounts
    addAccount: (input: Parameters<typeof storageEngine.addAccount>[0]) =>
      storageEngine.addAccount(input),
    updateAccount: (id: string, updates: Parameters<typeof storageEngine.updateAccount>[1]) =>
      storageEngine.updateAccount(id, updates),
    toggleArchiveAccount: (id: string) => storageEngine.toggleArchiveAccount(id),
    deleteAccount: (id: string) => storageEngine.deleteAccount(id),
    // Transactions
    addTransaction: (input: Parameters<typeof storageEngine.addTransaction>[0]) =>
      storageEngine.addTransaction(input),
    updateTransaction: (id: string, updates: Parameters<typeof storageEngine.updateTransaction>[1]) =>
      storageEngine.updateTransaction(id, updates),
    deleteTransaction: (id: string) => storageEngine.deleteTransaction(id),
    // Categories
    addCategory: (input: Parameters<typeof storageEngine.addCategory>[0]) =>
      storageEngine.addCategory(input),
    updateCategory: (id: string, updates: Parameters<typeof storageEngine.updateCategory>[1]) =>
      storageEngine.updateCategory(id, updates),
    deleteCategory: (id: string) => storageEngine.deleteCategory(id),
    // Budgets
    addBudget: (input: Parameters<typeof storageEngine.addBudget>[0]) =>
      storageEngine.addBudget(input),
    updateBudget: (id: string, updates: Parameters<typeof storageEngine.updateBudget>[1]) =>
      storageEngine.updateBudget(id, updates),
    deleteBudget: (id: string) => storageEngine.deleteBudget(id),
    // Goals
    addGoal: (input: Parameters<typeof storageEngine.addGoal>[0]) => storageEngine.addGoal(input),
    updateGoal: (id: string, updates: Parameters<typeof storageEngine.updateGoal>[1]) =>
      storageEngine.updateGoal(id, updates),
    deleteGoal: (id: string) => storageEngine.deleteGoal(id),
    depositToGoal: (goalId: string, amount: number, sourceAccountId: string) =>
      storageEngine.depositToGoal(goalId, amount, sourceAccountId),
    withdrawFromGoal: (goalId: string, amount: number, targetAccountId: string, notes?: string) =>
      storageEngine.withdrawFromGoal(goalId, amount, targetAccountId, notes),
    // Bills
    addBill: (input: Parameters<typeof storageEngine.addBill>[0]) => storageEngine.addBill(input),
    updateBill: (id: string, updates: Parameters<typeof storageEngine.updateBill>[1]) =>
      storageEngine.updateBill(id, updates),
    deleteBill: (id: string) => storageEngine.deleteBill(id),
    payBill: (billId: string, accountId: string, customNotes?: string) =>
      storageEngine.payBill(billId, accountId, customNotes),
    unpayBill: (billId: string, monthStr?: string) => storageEngine.unpayBill(billId, monthStr),
    // Debts & Loans
    addDebt: (input: Parameters<typeof storageEngine.addDebt>[0]) => storageEngine.addDebt(input),
    updateDebt: (id: string, updates: Parameters<typeof storageEngine.updateDebt>[1]) =>
      storageEngine.updateDebt(id, updates),
    deleteDebt: (id: string) => storageEngine.deleteDebt(id),
    recordDebtPayment: (
      debtId: string,
      payment: Parameters<typeof storageEngine.recordDebtPayment>[1]
    ) => storageEngine.recordDebtPayment(debtId, payment),
    // Backup & Export
    exportAllDataJSON: () => storageEngine.exportAllDataJSON(),
    importAllDataJSON: (jsonStr: string) => storageEngine.importAllDataJSON(jsonStr),
    exportTransactionsCSV: () => storageEngine.exportTransactionsCSV(),
    // Budget & Rollover
    processBudgetRollover: (
      budgetId: string,
      action: 'rollover' | 'savings' | 'reset',
      targetGoalId?: string
    ) => storageEngine.processBudgetRollover(budgetId, action, targetGoalId),
    updateGuiltFreeSpent: (role: UserRole, delta: number) =>
      storageEngine.updateGuiltFreeSpent(role, delta),
    // Sync
    triggerSync: () => storageEngine.triggerSync(),
    clearSyncedQueue: () => storageEngine.clearSyncedQueue(),
    resetToSampleData: () => storageEngine.resetToSampleData(),
  };
}

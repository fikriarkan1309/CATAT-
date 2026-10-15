/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useFinanceStore } from './hooks/useFinanceStore';
import { useTheme } from './hooks/useTheme';
import { Header, MainNavTab } from './components/Header';
import { DynamicFAB } from './components/DynamicFAB';
import { SyncQueueModal } from './components/SyncQueueModal';
import { ThemedTransactionModal } from './components/ThemedTransactionModal';
import { AccountManageModal } from './components/AccountManageModal';
import { BudgetManageModal } from './components/BudgetManageModal';
import { CategoryManagementView } from './components/CategoryManagementView';
import { HomeFiveKanbans } from './components/HomeFiveKanbans';
import { AccountsSavingsView } from './components/AccountsSavingsView';
import { BudgetBillsView } from './components/BudgetBillsView';
import { DebtsLoansView } from './components/DebtsLoansView';
import { SettingsMenuModal } from './components/SettingsMenuModal';
import { DataBackupModal } from './components/DataBackupModal';
import { UserAccountModal } from './components/UserAccountModal';
import { RecentTransactions } from './components/RecentTransactions';
import { MonthlyAnalysisView } from './components/MonthlyAnalysisView';
import { AuthLoginScreen } from './components/AuthLoginScreen';
import { Account, Budget, Transaction, TransactionType } from './types/finance';

export default function App() {
  const { theme, toggleTheme } = useTheme();

  const {
    isAuthenticated,
    userAccount,
    login,
    signUp,
    updateUserAccount,
    logout,
    accounts,
    categories,
    transactions,
    budgets,
    goals,
    bills,
    debts,
    syncQueue,
    activeRole,
    isOnline,
    isSyncing,
    pendingSyncCount,
    toggleSimulatedOffline,
    setActiveRole,
    addAccount,
    updateAccount,
    toggleArchiveAccount,
    deleteAccount,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addCategory,
    updateCategory,
    deleteCategory,
    addBudget,
    updateBudget,
    deleteBudget,
    processBudgetRollover,
    addGoal,
    updateGoal,
    deleteGoal,
    depositToGoal,
    withdrawFromGoal,
    addBill,
    updateBill,
    deleteBill,
    payBill,
    unpayBill,
    addDebt,
    updateDebt,
    deleteDebt,
    recordDebtPayment,
    exportAllDataJSON,
    importAllDataJSON,
    exportTransactionsCSV,
    resetToSampleData,
    triggerSync,
    clearSyncedQueue,
  } = useFinanceStore();

  // Navigation tab
  const [currentTab, setCurrentTab] = useState<MainNavTab>('home');

  // Menu & Settings Modals
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);
  const [isUserAccountModalOpen, setIsUserAccountModalOpen] = useState(false);

  // Transaction Modal State
  const [isTxnModalOpen, setIsTxnModalOpen] = useState(false);
  const [txnModalType, setTxnModalType] = useState<TransactionType>('expense');
  const [selectedAccountIdForTxn, setSelectedAccountIdForTxn] = useState<string | undefined>(undefined);


  // Edit Transaction Modal State
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [editAmountStr, setEditAmountStr] = useState('');
  const [editAccountId, setEditAccountId] = useState('');

  // Account Modal State
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  // Budget Modal State
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  // Category Form Trigger State
  const [externalOpenCategoryAdd, setExternalOpenCategoryAdd] = useState(false);

  // Sync Modal
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  // Triggers for Themed Transaction Form (Merah, Hijau, Biru)
  const handleOpenExpense = (accountId?: string) => {
    setTxnModalType('expense');
    setSelectedAccountIdForTxn(accountId);
    setIsTxnModalOpen(true);
  };

  const handleOpenIncome = (accountId?: string) => {
    setTxnModalType('income');
    setSelectedAccountIdForTxn(accountId);
    setIsTxnModalOpen(true);
  };

  const handleOpenTransfer = (accountId?: string) => {
    setTxnModalType('transfer');
    setSelectedAccountIdForTxn(accountId);
    setIsTxnModalOpen(true);
  };

  // Triggers for Account modal
  const handleStartAddAccount = () => {
    setEditingAccount(null);
    setIsAccountModalOpen(true);
  };

  const handleStartEditAccount = (acc: Account) => {
    setEditingAccount(acc);
    setIsAccountModalOpen(true);
  };

  const handleSaveAccount = (data: Parameters<typeof addAccount>[0]) => {
    if (editingAccount) {
      updateAccount(editingAccount.id, data);
    } else {
      addAccount(data);
    }
  };

  // Triggers for Budget modal
  const handleStartAddBudget = () => {
    setEditingBudget(null);
    setIsBudgetModalOpen(true);
  };

  const handleStartEditBudget = (b: Budget) => {
    setEditingBudget(b);
    setIsBudgetModalOpen(true);
  };

  const handleSaveBudget = (data: Parameters<typeof addBudget>[0]) => {
    if (editingBudget) {
      updateBudget(editingBudget.id, data);
    } else {
      addBudget(data);
    }
  };

  // Transaction Edit Handlers
  const handleStartEditTransaction = (t: Transaction) => {
    setEditingTransaction(t);
    setEditNotes(t.notes || '');
    setEditAmountStr(t.amount.toString());
    setEditAccountId(t.accountId);
  };

  const handleSaveEditTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransaction) return;
    const val = parseFloat(editAmountStr.replace(/[^0-9]/g, ''));
    if (!val || val <= 0) return;

    updateTransaction(editingTransaction.id, {
      amount: val,
      notes: editNotes.trim(),
      accountId: editAccountId,
    });
    setEditingTransaction(null);
  };

  if (!isAuthenticated) {
    return (
      <AuthLoginScreen
        onLogin={(em, pw) => login(em, pw)}
        onSignUp={(input) => signUp(input)}
        defaultEmail={userAccount?.email || 'fikriarkan1309@gmail.com'}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans text-slate-900 dark:text-slate-100 pb-20 overflow-x-hidden transition-colors">
      {/* Top Header Navigation (Dengan Home s/d Kategori di Head, Gerigi, Dark Mode) */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        isOnline={isOnline}
        isSyncing={isSyncing}
        pendingSyncCount={pendingSyncCount}
        onToggleOffline={toggleSimulatedOffline}
        onOpenSyncQueue={() => setIsSyncModalOpen(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenSettings={() => setIsSettingsMenuOpen(true)}
      />

      {/* Offline Alert Banner (Jika Offline) */}
      {!isOnline && (
        <div className="bg-amber-500 text-amber-950 px-4 py-1.5 text-xs font-semibold text-center border-b border-amber-600 flex items-center justify-center gap-2">
          <span>Mode Offline — Semua data tetap tersimpan instan di IndexedDB lokal.</span>
          <button
            onClick={toggleSimulatedOffline}
            className="underline hover:text-white transition-colors"
          >
            Aktifkan Online
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="max-w-[1600px] mx-auto px-3 sm:px-6 py-3 flex-1 w-full flex flex-col">
        {/* ========================================================================= */}
        {/* TAB 1: HOME VIEW — 5 KANBAN UTAMA TERLIHAT SEMUA TANPA PERLU SCROLL */}
        {/* ========================================================================= */}
        {currentTab === 'home' && (
          <HomeFiveKanbans
            accounts={accounts}
            categories={categories}
            transactions={transactions}
            budgets={budgets}
            onNavigateTab={setCurrentTab}
            onAddIncome={(accId) => handleOpenIncome(accId)}
            onAddExpense={(accId) => handleOpenExpense(accId)}
            onTransfer={(accId) => handleOpenTransfer(accId)}
            onEditAccount={handleStartEditAccount}
            onToggleArchiveAccount={toggleArchiveAccount}
            onDeleteAccount={deleteAccount}
            onAddNewAccount={handleStartAddAccount}
            onAddNewBudget={handleStartAddBudget}
            onEditBudget={handleStartEditBudget}
            onDeleteBudget={deleteBudget}
            onProcessRollover={(b) => processBudgetRollover(b.id, 'rollover')}
            onDeleteTransaction={deleteTransaction}
            onEditTransaction={handleStartEditTransaction}
          />
        )}

        {/* ========================================================================= */}
        {/* TAB 2: RINGKASAN & ANALISIS LENGKAP */}
        {/* ========================================================================= */}
        {currentTab === 'analysis' && (
          <div className="animate-in fade-in">
            <MonthlyAnalysisView
              transactions={transactions}
              categories={categories}
              accounts={accounts}
            />
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: REKENING & TARGET TABUNGAN (SUB TAB) */}
        {/* ========================================================================= */}
        {currentTab === 'accounts' && (
          <AccountsSavingsView
            accounts={accounts}
            transactions={transactions}
            categories={categories}
            goals={goals}
            onAddIncome={(accId) => handleOpenIncome(accId)}
            onAddExpense={(accId) => handleOpenExpense(accId)}
            onTransfer={(accId) => handleOpenTransfer(accId)}
            onEditAccount={handleStartEditAccount}
            onToggleArchive={toggleArchiveAccount}
            onDeleteAccount={deleteAccount}
            onAddNewAccount={handleStartAddAccount}
            onAddGoal={addGoal}
            onUpdateGoal={updateGoal}
            onDeleteGoal={deleteGoal}
            onDepositToGoal={depositToGoal}
            onWithdrawFromGoal={withdrawFromGoal}
          />
        )}

        {/* ========================================================================= */}
        {/* TAB 4: ANGGARAN & TAGIHAN RUTIN (SUB TAB) */}
        {/* ========================================================================= */}
        {currentTab === 'budgets' && (
          <BudgetBillsView
            budgets={budgets}
            categories={categories}
            transactions={transactions}
            goals={goals}
            accounts={accounts}
            bills={bills}
            onProcessRollover={processBudgetRollover}
            onAddNewBudget={handleStartAddBudget}
            onEditBudget={handleStartEditBudget}
            onDeleteBudget={deleteBudget}
            onAddBill={addBill}
            onUpdateBill={updateBill}
            onDeleteBill={deleteBill}
            onPayBill={payBill}
            onUnpayBill={unpayBill}
          />
        )}

        {/* ========================================================================= */}
        {/* TAB 5: HUTANG & PIUTANG (DI ANTARA ANGGARAN & TRANSAKSI) */}
        {/* ========================================================================= */}
        {currentTab === 'debts' && (
          <DebtsLoansView
            debts={debts}
            accounts={accounts}
            onAddDebt={addDebt}
            onUpdateDebt={updateDebt}
            onDeleteDebt={deleteDebt}
            onRecordPayment={recordDebtPayment}
          />
        )}

        {/* ========================================================================= */}
        {/* TAB 6: TRANSAKSI LENGKAP */}
        {/* ========================================================================= */}
        {currentTab === 'transactions' && (
          <div className="space-y-4 animate-in fade-in">
            <RecentTransactions
              transactions={transactions}
              accounts={accounts}
              categories={categories}
              onDeleteTransaction={deleteTransaction}
              onUpdateTransaction={updateTransaction}
              onQuickAdd={() => handleOpenExpense()}
            />
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 7: KELOLA KATEGORI LANGSUNG (DARI MENU GERIGI) */}
        {/* ========================================================================= */}
        {currentTab === 'categories' && (
          <div className="space-y-4 animate-in fade-in">
            <CategoryManagementView
              categories={categories}
              onAddCategory={addCategory}
              onUpdateCategory={updateCategory}
              onDeleteCategory={deleteCategory}
              externalOpenAdd={externalOpenCategoryAdd}
              onResetExternalOpenAdd={() => setExternalOpenCategoryAdd(false)}
            />
          </div>
        )}
      </main>

      {/* Context-Aware Floating Action Button (FAB) */}
      <DynamicFAB
        currentTab={currentTab}
        onAddAccount={handleStartAddAccount}
        onAddBudget={handleStartAddBudget}
        onOpenIncome={() => handleOpenIncome()}
        onOpenExpense={() => handleOpenExpense()}
        onOpenTransfer={() => handleOpenTransfer()}
        onAddCategory={() => setExternalOpenCategoryAdd(true)}
      />

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}

      {/* Themed Transaction Form Modal (Dua Kanban: Merah / Hijau / Biru) */}
      <ThemedTransactionModal
        isOpen={isTxnModalOpen}
        onClose={() => setIsTxnModalOpen(false)}
        type={txnModalType}
        accounts={accounts}
        categories={categories}
        budgets={budgets}
        transactions={transactions}
        activeRole={activeRole}
        defaultAccountId={selectedAccountIdForTxn}
        onOpenManageCategories={() => {
          setIsTxnModalOpen(false);
          setCurrentTab('categories');
        }}
        onSave={addTransaction}
      />

      {/* Account Manage Modal */}
      <AccountManageModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        editingAccount={editingAccount}
        onSave={handleSaveAccount}
      />

      {/* Budget Manage Modal */}
      <BudgetManageModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        categories={categories}
        accounts={accounts}
        editingBudget={editingBudget}
        onSave={handleSaveBudget}
      />



      {/* Edit Transaction Modal */}
      {editingTransaction && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
              Edit Transaksi
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Perubahan nilai atau rekening otomatis menyesuaikan saldo rekening terkait.
            </p>

            <form onSubmit={handleSaveEditTransaction} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Nominal (Rp)</label>
                <input
                  type="number"
                  value={editAmountStr}
                  onChange={(e) => setEditAmountStr(e.target.value)}
                  required
                  autoFocus
                  className="w-full mt-1 p-2.5 text-lg font-bold font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Rekening</label>
                <select
                  value={editAccountId}
                  onChange={(e) => setEditAccountId(e.target.value)}
                  className="w-full mt-1 p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.balance.toLocaleString('id-ID')})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Catatan</label>
                <input
                  type="text"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full mt-1 p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTransaction(null)}
                  className="flex-1 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 rounded-lg shadow-xs"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settings Menu Modal (Gerigi di Pojok Kanan Atas) */}
      <SettingsMenuModal
        isOpen={isSettingsMenuOpen}
        onClose={() => setIsSettingsMenuOpen(false)}
        onOpenDataModal={() => setIsDataModalOpen(true)}
        onOpenCategories={() => setCurrentTab('categories')}
        onOpenAccountModal={() => setIsUserAccountModalOpen(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
        onLogout={logout}
      />

      {/* Data & Backup Modal (Poin Nomor 3) */}
      <DataBackupModal
        isOpen={isDataModalOpen}
        onClose={() => setIsDataModalOpen(false)}
        onExportCSV={exportTransactionsCSV}
        onExportJSON={exportAllDataJSON}
        onImportJSON={importAllDataJSON}
        onResetData={resetToSampleData}
        transactionsCount={transactions.length}
        accountsCount={accounts.length}
      />

      {/* User Account & Multi-Device Modal (Poin Nomor 2, Akun Paling Bawah) */}
      <UserAccountModal
        isOpen={isUserAccountModalOpen}
        onClose={() => setIsUserAccountModalOpen(false)}
        userAccount={userAccount}
        onUpdateAccountName={(newName) => updateUserAccount({ accountName: newName })}
        isOnline={isOnline}
        pendingSyncCount={pendingSyncCount}
        onLogout={logout}
      />

      {/* Sync Queue Inspector Modal */}
      <SyncQueueModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        queue={syncQueue}
        isOnline={isOnline}
        isSyncing={isSyncing}
        onTriggerSync={triggerSync}
        onClearSynced={clearSyncedQueue}
      />
    </div>
  );
}

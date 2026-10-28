/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useFinanceStore } from './hooks/useFinanceStore';
import { useTheme } from './hooks/useTheme';
import { AppHeader } from './components/AppHeader';
import { BottomNav, AppNavTab } from './components/BottomNav';
import { QuickAddActionSheet } from './components/QuickAddActionSheet';
import { DashboardView } from './components/DashboardView';
import { LainnyaView } from './components/LainnyaView';
import { PerbandinganView } from './components/PerbandinganView';
import { AccountCards } from './components/AccountCards';
import { SavingsGoalsSection } from './components/SavingsGoalsSection';
import { BudgetRolloverSection } from './components/BudgetRolloverSection';
import { RecurringBillsSection } from './components/RecurringBillsSection';
import { DebtsLoansView } from './components/DebtsLoansView';
import { RecentTransactions } from './components/RecentTransactions';
import { MonthlyAnalysisView } from './components/MonthlyAnalysisView';
import { CategoryManagementView } from './components/CategoryManagementView';
import { SyncQueueModal } from './components/SyncQueueModal';
import { ThemedTransactionModal } from './components/ThemedTransactionModal';
import { AccountManageModal } from './components/AccountManageModal';
import { BudgetManageModal } from './components/BudgetManageModal';
import { SettingsMenuModal } from './components/SettingsMenuModal';
import { DataBackupModal } from './components/DataBackupModal';
import { UserAccountModal } from './components/UserAccountModal';
import { AuthLoginScreen } from './components/AuthLoginScreen';
import { Account, Budget, Transaction, TransactionType } from './types/finance';
import { ArrowLeft } from 'lucide-react';

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

  // Navigation tab (default: home)
  const [currentTab, setCurrentTab] = useState<AppNavTab>('home');

  // Quick Add Sheet State (from center + button)
  const [isQuickAddSheetOpen, setIsQuickAddSheetOpen] = useState(false);

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

  // --- MOBILE BACK BUTTON & HISTORY NAVIGATION CONTROLLER ---
  const LEVEL_2_TABS: AppNavTab[] = ['summary', 'accounts', 'more'];
  const LEVEL_3_TABS: AppNavTab[] = [
    'comparison',
    'savings',
    'budgets',
    'bills',
    'debts',
    'transactions',
    'categories',
  ];

  // Initialize initial history entry
  React.useEffect(() => {
    if (isAuthenticated) {
      if (!window.history.state || !window.history.state.tab) {
        window.history.replaceState({ tab: 'home', level: 1 }, '', '#home');
      }
    }
  }, [isAuthenticated]);

  // Handle programmatic tab switches with history push
  const handleSelectTab = (targetTab: AppNavTab) => {
    if (targetTab === currentTab) return;

    if (targetTab === 'home') {
      window.history.pushState({ tab: 'home', level: 1 }, '', '#home');
      setCurrentTab('home');
    } else if (LEVEL_2_TABS.includes(targetTab)) {
      window.history.pushState({ tab: targetTab, level: 2 }, '', `#${targetTab}`);
      setCurrentTab(targetTab);
    } else if (LEVEL_3_TABS.includes(targetTab)) {
      if (window.history.state?.tab !== 'more') {
        window.history.pushState({ tab: 'more', level: 2 }, '', '#more');
      }
      window.history.pushState({ tab: targetTab, level: 3 }, '', `#${targetTab}`);
      setCurrentTab(targetTab);
    } else {
      window.history.pushState({ tab: targetTab, level: 2 }, '', `#${targetTab}`);
      setCurrentTab(targetTab);
    }
  };

  // Popstate Listener for Mobile Back Button / Edge Swipe
  React.useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      // 1. If any modal/sheet is open, close modal first and retain current tab history
      const isModalOpen =
        isQuickAddSheetOpen ||
        isTxnModalOpen ||
        editingTransaction !== null ||
        isAccountModalOpen ||
        isBudgetModalOpen ||
        isSettingsMenuOpen ||
        isDataModalOpen ||
        isUserAccountModalOpen ||
        isSyncModalOpen;

      if (isModalOpen) {
        setIsQuickAddSheetOpen(false);
        setIsTxnModalOpen(false);
        setEditingTransaction(null);
        setIsAccountModalOpen(false);
        setIsBudgetModalOpen(false);
        setIsSettingsMenuOpen(false);
        setIsDataModalOpen(false);
        setIsUserAccountModalOpen(false);
        setIsSyncModalOpen(false);
        window.history.pushState(
          { tab: currentTab, level: LEVEL_3_TABS.includes(currentTab) ? 3 : LEVEL_2_TABS.includes(currentTab) ? 2 : 1 },
          '',
          `#${currentTab}`
        );
        return;
      }

      // 2. Page Navigation back based on state or level fallback
      const stateTab = e.state?.tab as AppNavTab | undefined;

      if (stateTab) {
        setCurrentTab(stateTab);
      } else {
        // Popped past initial entry
        if (LEVEL_3_TABS.includes(currentTab)) {
          setCurrentTab('more');
          window.history.pushState({ tab: 'more', level: 2 }, '', '#more');
        } else if (LEVEL_2_TABS.includes(currentTab)) {
          setCurrentTab('home');
          window.history.pushState({ tab: 'home', level: 1 }, '', '#home');
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [
    currentTab,
    isQuickAddSheetOpen,
    isTxnModalOpen,
    editingTransaction,
    isAccountModalOpen,
    isBudgetModalOpen,
    isSettingsMenuOpen,
    isDataModalOpen,
    isUserAccountModalOpen,
    isSyncModalOpen,
  ]);

  // Determine if on a sub-view originating from 'Lainnya' (savings has its own full-bleed header matching Rekening)
  const isSubViewFromMore = [
    'comparison',
    'budgets',
    'bills',
    'debts',
    'transactions',
    'categories',
  ].includes(currentTab);

  const hasCustomGradientHeader = currentTab === 'accounts' || currentTab === 'savings';

  return (
    <div className={`min-h-screen ${hasCustomGradientHeader ? 'h-screen h-dvh overflow-hidden' : ''} bg-white dark:bg-slate-950 flex flex-col font-sans text-slate-900 dark:text-slate-100 overflow-x-clip transition-colors`}>
      {/* Top Header Navigation (Logo 2.png + Settings Gear) - Hidden on accounts & savings which have custom gradient headers */}
      {!hasCustomGradientHeader && (
        <AppHeader
          onLogoClick={() => handleSelectTab('home')}
          onOpenSettings={() => setIsSettingsMenuOpen(true)}
          isOnline={isOnline}
          isSyncing={isSyncing}
          pendingSyncCount={pendingSyncCount}
          onOpenSyncQueue={() => setIsSyncModalOpen(true)}
        />
      )}

      {/* Offline Alert Banner (Jika Offline) */}
      {!isOnline && (
        <div className="bg-amber-500 text-amber-950 px-4 py-1.5 text-xs font-semibold text-center border-b border-amber-600 flex items-center justify-center gap-2">
          <span>Mode Offline — Data tersimpan aman di IndexedDB lokal.</span>
          <button
            onClick={toggleSimulatedOffline}
            className="underline hover:text-white transition-colors"
          >
            Kembali Online
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className={`w-full flex-1 flex flex-col ${hasCustomGradientHeader ? 'min-h-0 overflow-hidden' : ''} bg-white dark:bg-slate-950`}>
        {/* Sub-view Header with Back to Lainnya button */}
        {isSubViewFromMore && (
          <div className="max-w-lg mx-auto sm:max-w-xl md:max-w-2xl w-full px-4 pt-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => handleSelectTab('more')}
              className="flex items-center gap-1.5 text-xs font-bold text-sky-600 dark:text-sky-400 hover:text-sky-700 bg-sky-50 dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-sky-100 dark:border-slate-800 transition-colors shadow-2xs cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Lainnya</span>
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 1: BERANDA / DASHBOARD (Mockup Dashboard 1 & 2) */}
        {/* ========================================================================= */}
        {currentTab === 'home' && (
          <DashboardView
            accounts={accounts}
            categories={categories}
            transactions={transactions}
            budgets={budgets}
            goals={goals}
            bills={bills}
            debts={debts}
            onNavigateTab={handleSelectTab}
            onAddIncome={handleOpenIncome}
            onAddExpense={handleOpenExpense}
            onTransfer={handleOpenTransfer}
            onAddNewAccount={handleStartAddAccount}
          />
        )}

        {/* ========================================================================= */}
        {/* TAB 2: RINGKASAN & ANALISIS BULANAN */}
        {/* ========================================================================= */}
        {currentTab === 'summary' && (
          <div className="max-w-lg mx-auto sm:max-w-xl md:max-w-2xl w-full px-3 py-2 pb-24 animate-in fade-in">
            <MonthlyAnalysisView
              transactions={transactions}
              categories={categories}
              accounts={accounts}
            />
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: REKENING (Standalone View - Mockup Rekening_Baru_73f29a70.jpg) */}
        {/* ========================================================================= */}
        {currentTab === 'accounts' && (
          <div className="w-full flex-1 min-h-0 flex flex-col animate-in fade-in overflow-hidden">
            <AccountCards
              accounts={accounts}
              transactions={transactions}
              categories={categories}
              onAddIncome={handleOpenIncome}
              onAddExpense={handleOpenExpense}
              onTransfer={handleOpenTransfer}
              onEditAccount={handleStartEditAccount}
              onToggleArchive={toggleArchiveAccount}
              onDeleteAccount={deleteAccount}
              onAddNewAccount={handleStartAddAccount}
              onOpenSettings={() => setIsSettingsMenuOpen(true)}
              onLogoClick={() => handleSelectTab('home')}
            />
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: LAINNYA (Grid 6 Menu Mockup Lainnya_516d7998.jpg) */}
        {/* ========================================================================= */}
        {currentTab === 'more' && (
          <LainnyaView onSelectMenu={handleSelectTab} />
        )}

        {/* ========================================================================= */}
        {/* SUB MENU 1 DARI LAINNYA: PERBANDINGAN */}
        {/* ========================================================================= */}
        {currentTab === 'comparison' && (
          <PerbandinganView
            transactions={transactions}
            categories={categories}
            accounts={accounts}
            onBack={() => handleSelectTab('more')}
          />
        )}

        {/* ========================================================================= */}
        {/* SUB MENU 2 DARI LAINNYA: TARGET TABUNGAN (Standalone - Mockup Tabungan_Baru_b9093882.jpg) */}
        {/* ========================================================================= */}
        {currentTab === 'savings' && (
          <div className="w-full flex-1 min-h-0 flex flex-col animate-in fade-in overflow-hidden">
            <SavingsGoalsSection
              goals={goals}
              accounts={accounts}
              onAddGoal={addGoal}
              onUpdateGoal={updateGoal}
              onDeleteGoal={deleteGoal}
              onDepositToGoal={depositToGoal}
              onWithdrawFromGoal={withdrawFromGoal}
              onOpenSettings={() => setIsSettingsMenuOpen(true)}
              onLogoClick={() => handleSelectTab('home')}
            />
          </div>
        )}

        {/* ========================================================================= */}
        {/* SUB MENU 3 DARI LAINNYA: ALOKASI ANGGARAN (Standalone) */}
        {/* ========================================================================= */}
        {currentTab === 'budgets' && (
          <div className="max-w-lg mx-auto sm:max-w-xl md:max-w-2xl w-full px-3 py-2 pb-24 animate-in fade-in space-y-4">
            <BudgetRolloverSection
              budgets={budgets}
              categories={categories}
              transactions={transactions}
              goals={goals}
              accounts={accounts}
              onProcessRollover={processBudgetRollover}
              onAddNewBudget={handleStartAddBudget}
              onEditBudget={handleStartEditBudget}
              onDeleteBudget={deleteBudget}
            />
          </div>
        )}

        {/* ========================================================================= */}
        {/* SUB MENU 4 DARI LAINNYA: TAGIHAN RUTIN (Standalone) */}
        {/* ========================================================================= */}
        {currentTab === 'bills' && (
          <div className="max-w-lg mx-auto sm:max-w-xl md:max-w-2xl w-full px-3 py-2 pb-24 animate-in fade-in space-y-4">
            <RecurringBillsSection
              bills={bills}
              accounts={accounts}
              categories={categories}
              onAddBill={addBill}
              onUpdateBill={updateBill}
              onDeleteBill={deleteBill}
              onPayBill={payBill}
              onUnpayBill={unpayBill}
            />
          </div>
        )}

        {/* ========================================================================= */}
        {/* SUB MENU 5 DARI LAINNYA: HUTANG & PIUTANG (Standalone, tetap bersama) */}
        {/* ========================================================================= */}
        {currentTab === 'debts' && (
          <div className="max-w-lg mx-auto sm:max-w-xl md:max-w-2xl w-full px-3 py-2 pb-24 animate-in fade-in">
            <DebtsLoansView
              debts={debts}
              accounts={accounts}
              onAddDebt={addDebt}
              onUpdateDebt={updateDebt}
              onDeleteDebt={deleteDebt}
              onRecordPayment={recordDebtPayment}
            />
          </div>
        )}

        {/* ========================================================================= */}
        {/* SUB MENU 6 DARI LAINNYA: TRANSAKSI (Standalone) */}
        {/* ========================================================================= */}
        {currentTab === 'transactions' && (
          <div className="max-w-lg mx-auto sm:max-w-xl md:max-w-2xl w-full px-3 py-2 pb-24 animate-in fade-in space-y-4">
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
        {/* KELOLA KATEGORI (Dari menu gerigi atau referensi transaksi) */}
        {/* ========================================================================= */}
        {currentTab === 'categories' && (
          <div className="max-w-lg mx-auto sm:max-w-xl md:max-w-2xl w-full px-3 py-2 pb-24 animate-in fade-in space-y-4">
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

      {/* ========================================================================= */}
      {/* BOTTOM NAVIGATION BAR DENGAN 4 TAB + TOMBOL (+) MELAYANG DI TENGAH */}
      {/* ========================================================================= */}
      <BottomNav
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        onOpenQuickAdd={() => setIsQuickAddSheetOpen(true)}
      />

      {/* Quick Add Action Sheet (Muncul saat tombol (+) di tengah ditekan) */}
      <QuickAddActionSheet
        isOpen={isQuickAddSheetOpen}
        onClose={() => setIsQuickAddSheetOpen(false)}
        onSelectExpense={() => handleOpenExpense()}
        onSelectIncome={() => handleOpenIncome()}
        onSelectTransfer={() => handleOpenTransfer()}
      />

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}

      {/* Themed Transaction Form Modal (Merah / Hijau / Biru) */}
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
          handleSelectTab('categories');
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
                  className="w-full mt-1 p-2.5 text-lg font-bold font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500"
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
                  className="flex-1 py-2 text-xs font-bold text-white bg-sky-500 hover:bg-sky-600 rounded-lg shadow-xs"
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
        onOpenCategories={() => handleSelectTab('categories')}
        onOpenAccountModal={() => setIsUserAccountModalOpen(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
        onLogout={logout}
      />

      {/* Data & Backup Modal */}
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

      {/* User Account & Multi-Device Modal */}
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

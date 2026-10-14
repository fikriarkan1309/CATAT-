import React, { useState } from 'react';
import { CreditCard, PiggyBank } from 'lucide-react';
import { AccountCards } from './AccountCards';
import { SavingsGoalsSection } from './SavingsGoalsSection';
import { Account, Category, SharedGoal, Transaction } from '../types/finance';

interface AccountsSavingsViewProps {
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  goals: SharedGoal[];
  onAddIncome: (accountId?: string) => void;
  onAddExpense: (accountId?: string) => void;
  onTransfer: (accountId?: string) => void;
  onEditAccount: (acc: Account) => void;
  onToggleArchive: (id: string) => void;
  onDeleteAccount: (id: string) => void;
  onAddNewAccount: () => void;
  // Goal actions
  onAddGoal: (data: {
    name: string;
    targetAmount: number;
    targetDate: string;
    icon?: string;
    color?: string;
    notes?: string;
    initialAmount?: number;
  }) => void;
  onUpdateGoal: (id: string, updates: Partial<SharedGoal>) => void;
  onDeleteGoal: (id: string) => void;
  onDepositToGoal: (goalId: string, amount: number, sourceAccountId: string) => void;
  onWithdrawFromGoal: (goalId: string, amount: number, targetAccountId: string, notes?: string) => void;
}

export const AccountsSavingsView: React.FC<AccountsSavingsViewProps> = ({
  accounts,
  transactions,
  categories,
  goals,
  onAddIncome,
  onAddExpense,
  onTransfer,
  onEditAccount,
  onToggleArchive,
  onDeleteAccount,
  onAddNewAccount,
  onAddGoal,
  onUpdateGoal,
  onDeleteGoal,
  onDepositToGoal,
  onWithdrawFromGoal,
}) => {
  const [subTab, setSubTab] = useState<'accounts' | 'goals'>('accounts');

  return (
    <div className="space-y-4 animate-in fade-in">
      {/* Sub-tab Pill Switcher */}
      <div className="flex items-center justify-center sm:justify-start">
        <div className="inline-flex p-1 bg-slate-200/70 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-inner">
          <button
            type="button"
            onClick={() => setSubTab('accounts')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              subTab === 'accounts'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <CreditCard className="w-4 h-4 text-blue-500" />
            <span>Rekening Kas & Bank</span>
            <span className="px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-slate-500">
              {accounts.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('goals')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              subTab === 'goals'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <PiggyBank className="w-4 h-4 text-emerald-500" />
            <span>Target Tabungan</span>
            <span className="px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-slate-500">
              {goals.length}
            </span>
          </button>
        </div>
      </div>

      {/* Sub-tab View Rendering */}
      {subTab === 'accounts' ? (
        <AccountCards
          accounts={accounts}
          transactions={transactions}
          categories={categories}
          onAddIncome={onAddIncome}
          onAddExpense={onAddExpense}
          onTransfer={onTransfer}
          onEditAccount={onEditAccount}
          onToggleArchive={onToggleArchive}
          onDeleteAccount={onDeleteAccount}
          onAddNewAccount={onAddNewAccount}
        />
      ) : (
        <SavingsGoalsSection
          goals={goals}
          accounts={accounts}
          onAddGoal={onAddGoal}
          onUpdateGoal={onUpdateGoal}
          onDeleteGoal={onDeleteGoal}
          onDepositToGoal={onDepositToGoal}
          onWithdrawFromGoal={onWithdrawFromGoal}
        />
      )}
    </div>
  );
};

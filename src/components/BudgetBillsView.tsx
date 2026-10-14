import React, { useState } from 'react';
import { Target, Zap } from 'lucide-react';
import { BudgetRolloverSection } from './BudgetRolloverSection';
import { RecurringBillsSection } from './RecurringBillsSection';
import { Account, Budget, Category, RecurringBill, SharedGoal, Transaction } from '../types/finance';

interface BudgetBillsViewProps {
  budgets: Budget[];
  categories: Category[];
  transactions: Transaction[];
  goals: SharedGoal[];
  accounts: Account[];
  bills: RecurringBill[];
  onProcessRollover: (
    budgetId: string,
    action: 'rollover' | 'savings' | 'reset',
    targetGoalId?: string
  ) => void;
  onAddNewBudget: () => void;
  onEditBudget: (budget: Budget) => void;
  onDeleteBudget: (id: string) => void;
  // Bill actions
  onAddBill: (data: {
    name: string;
    amount: number;
    categoryId: string;
    accountId?: string;
    dueDay: number;
    frequency?: 'monthly' | 'weekly' | 'yearly';
    notes?: string;
  }) => void;
  onUpdateBill: (id: string, updates: Partial<RecurringBill>) => void;
  onDeleteBill: (id: string) => void;
  onPayBill: (billId: string, accountId: string, notes?: string) => void;
  onUnpayBill: (billId: string, monthStr?: string) => void;
}

export const BudgetBillsView: React.FC<BudgetBillsViewProps> = ({
  budgets,
  categories,
  transactions,
  goals,
  accounts,
  bills,
  onProcessRollover,
  onAddNewBudget,
  onEditBudget,
  onDeleteBudget,
  onAddBill,
  onUpdateBill,
  onDeleteBill,
  onPayBill,
  onUnpayBill,
}) => {
  const [subTab, setSubTab] = useState<'budgets' | 'bills'>('budgets');
  const currentMonth = new Date().toISOString().slice(0, 7);
  const unpaidCount = bills.filter((b) => !b.paidMonths?.includes(currentMonth)).length;

  return (
    <div className="space-y-4 animate-in fade-in">
      {/* Sub-tab Pill Switcher */}
      <div className="flex items-center justify-center sm:justify-start">
        <div className="inline-flex p-1 bg-slate-200/70 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-inner">
          <button
            type="button"
            onClick={() => setSubTab('budgets')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              subTab === 'budgets'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Target className="w-4 h-4 text-emerald-500" />
            <span>Alokasi Anggaran</span>
            <span className="px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-slate-500">
              {budgets.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('bills')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              subTab === 'bills'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Zap className="w-4 h-4 text-blue-500" />
            <span>Tagihan Rutin</span>
            {unpaidCount > 0 ? (
              <span className="px-1.5 py-0.2 rounded-md bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400 text-[10px] font-bold">
                {unpaidCount} Jatuh Tempo
              </span>
            ) : (
              <span className="px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 text-[10px] font-bold">
                Lunas
              </span>
            )}
          </button>
        </div>
      </div>

      {/* View Rendering */}
      {subTab === 'budgets' ? (
        <BudgetRolloverSection
          budgets={budgets}
          categories={categories}
          transactions={transactions}
          goals={goals}
          accounts={accounts}
          onProcessRollover={onProcessRollover}
          onAddNewBudget={onAddNewBudget}
          onEditBudget={onEditBudget}
          onDeleteBudget={onDeleteBudget}
        />
      ) : (
        <RecurringBillsSection
          bills={bills}
          accounts={accounts}
          categories={categories}
          onAddBill={onAddBill}
          onUpdateBill={onUpdateBill}
          onDeleteBill={onDeleteBill}
          onPayBill={onPayBill}
          onUnpayBill={onUnpayBill}
        />
      )}
    </div>
  );
};

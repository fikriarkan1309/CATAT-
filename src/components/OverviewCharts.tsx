import React from 'react';
import { ArrowUpRight, ArrowDownRight, Wallet, PieChart } from 'lucide-react';
import { Account, Category, Transaction } from '../types/finance';
import { formatRupiah, formatCompactRupiah } from '../lib/formatters';

interface OverviewChartsProps {
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
}

export const OverviewCharts: React.FC<OverviewChartsProps> = ({
  accounts,
  transactions,
  categories,
}) => {
  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'expense' && !t.isGuiltFree)
    .reduce((sum, t) => sum + t.amount, 0);

  const netSavings = totalIncome - totalExpense;

  // Compute breakdown by Parent Category
  const expenseTransactions = transactions.filter((t) => t.type === 'expense' && !t.isGuiltFree);
  const parentCategories = categories.filter((c) => !c.parentId && c.type === 'expense');

  const breakdownData = parentCategories
    .map((parent) => {
      const subIds = categories.filter((c) => c.parentId === parent.id).map((c) => c.id);
      const catIds = [parent.id, ...subIds];

      const amount = expenseTransactions
        .filter((t) => catIds.includes(t.categoryId))
        .reduce((sum, t) => sum + t.amount, 0);

      const percent = totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0;
      return {
        name: parent.name,
        amount,
        percent,
        color: parent.color,
      };
    })
    .filter((b) => b.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* KPI Cards */}
      <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Total Liquidity */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Total Likuiditas</span>
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl font-extrabold text-slate-900 font-mono tabular-nums">
              {formatRupiah(totalBalance)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {accounts.length} rekening aktif
            </div>
          </div>
        </div>

        {/* Pemasukan Bulan Ini */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Pemasukan Bulan Ini</span>
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl font-extrabold text-emerald-700 font-mono tabular-nums">
              +{formatRupiah(totalIncome)}
            </div>
            <div className="text-[11px] text-emerald-600 font-medium mt-1">
              Gaji & penghasilan keluarga
            </div>
          </div>
        </div>

        {/* Pengeluaran Bulan Ini */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Pengeluaran Bulan Ini</span>
            <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl font-extrabold text-rose-700 font-mono tabular-nums">
              -{formatRupiah(totalExpense)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Net Kas: <span className="font-semibold text-slate-700 font-mono">{formatCompactRupiah(netSavings)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Donut/Bar Category Breakdown */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <PieChart className="w-4 h-4 text-slate-600" />
            <h4 className="text-xs font-bold text-slate-900">Distribusi Pos Pengeluaran</h4>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            {formatCompactRupiah(totalExpense)}
          </span>
        </div>

        <div className="space-y-2.5 flex-1 justify-center flex flex-col">
          {breakdownData.length === 0 ? (
            <div className="text-center text-xs text-slate-400 py-4">Belum ada transaksi</div>
          ) : (
            breakdownData.map((item) => (
              <div key={item.name} className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-700 font-medium truncate max-w-[150px]">
                    {item.name}
                  </span>
                  <span className="font-mono text-slate-600 font-semibold">
                    {formatCompactRupiah(item.amount)} ({item.percent}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${item.percent}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

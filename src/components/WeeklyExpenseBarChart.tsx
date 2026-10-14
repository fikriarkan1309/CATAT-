import React, { useState } from 'react';
import { BarChart3, TrendingDown, Calendar } from 'lucide-react';
import { Transaction } from '../types/finance';
import { formatRupiah, formatCompactRupiah } from '../lib/formatters';

interface WeeklyExpenseBarChartProps {
  transactions: Transaction[];
}

export const WeeklyExpenseBarChart: React.FC<WeeklyExpenseBarChartProps> = ({ transactions }) => {
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);

  // Generate the last 7 days
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    return d;
  });

  const dayLabels = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  const chartData = days.map((dateObj, idx) => {
    const dateString = dateObj.toISOString().split('T')[0];
    const dayName = dayLabels[dateObj.getDay()];
    const dateNumber = dateObj.getDate();

    const dayTransactions = transactions.filter((t) => {
      if (t.type !== 'expense') return false;
      const tDate = new Date(t.transactionDate).toISOString().split('T')[0];
      return tDate === dateString;
    });

    const totalExpense = dayTransactions.reduce((acc, t) => acc + t.amount, 0);

    return {
      index: idx,
      dateString,
      dayName,
      dateNumber,
      totalExpense,
      transactions: dayTransactions,
      isToday: idx === 6,
    };
  });

  const maxExpense = Math.max(...chartData.map((d) => d.totalExpense), 500000);
  const total7Days = chartData.reduce((acc, d) => acc + d.totalExpense, 0);
  const avgDaily = Math.round(total7Days / 7);

  return (
    <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-rose-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Pengeluaran 7 Hari Terakhir
            </h3>
            <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
              Diagram Batang
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Total 7 Hari: <span className="font-semibold text-slate-800 font-mono">{formatRupiah(total7Days)}</span> · Rata-rata harian: <span className="font-mono text-slate-700 font-medium">{formatRupiah(avgDaily)}</span>
          </p>
        </div>
      </div>

      {/* Bar Chart Container */}
      <div className="pt-6 pb-2 px-2">
        <div className="grid grid-cols-7 gap-2 sm:gap-4 items-end h-40 border-b border-slate-100">
          {chartData.map((d) => {
            const heightPercent = Math.max(8, Math.round((d.totalExpense / maxExpense) * 100));
            const isHovered = hoveredDay === d.index;

            return (
              <div
                key={d.dateString}
                className="flex flex-col items-center h-full justify-end relative group cursor-pointer"
                onMouseEnter={() => setHoveredDay(d.index)}
                onMouseLeave={() => setHoveredDay(null)}
              >
                {/* Tooltip on hover */}
                {isHovered && (
                  <div className="absolute -top-12 z-20 bg-slate-900 text-white text-[11px] py-1.5 px-2.5 rounded-lg shadow-xl whitespace-nowrap pointer-events-none font-mono text-center animate-in fade-in zoom-in-95">
                    <div className="font-bold">{formatRupiah(d.totalExpense)}</div>
                    <div className="text-[10px] text-slate-300 font-sans">
                      {d.transactions.length} transaksi
                    </div>
                  </div>
                )}

                {/* Amount label on top of bar */}
                <div className="text-[10px] font-mono text-slate-500 mb-1.5 opacity-80 group-hover:opacity-100 font-semibold truncate max-w-full">
                  {d.totalExpense > 0 ? formatCompactRupiah(d.totalExpense) : '-'}
                </div>

                {/* Bar */}
                <div className="w-full max-w-[42px] bg-slate-100 rounded-t-xl overflow-hidden flex items-end transition-all duration-200 group-hover:bg-slate-200">
                  <div
                    className={`w-full rounded-t-xl transition-all duration-500 ${
                      d.isToday
                        ? 'bg-rose-600 group-hover:bg-rose-700'
                        : d.totalExpense > 0
                        ? 'bg-rose-400 group-hover:bg-rose-500'
                        : 'bg-slate-200'
                    }`}
                    style={{ height: `${heightPercent}%` }}
                  />
                </div>

                {/* Day and Date Label */}
                <div className="mt-2 text-center">
                  <div
                    className={`text-xs font-semibold ${
                      d.isToday ? 'text-rose-600 font-bold' : 'text-slate-700'
                    }`}
                  >
                    {d.dayName}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {d.dateNumber}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

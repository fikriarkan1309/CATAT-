import React, { useState } from 'react';
import { Target, Building2, Car, GraduationCap, Plus, CheckCircle2 } from 'lucide-react';
import { Account, SharedGoal } from '../types/finance';
import { formatRupiah, formatDateIndo } from '../lib/formatters';

interface SharedGoalsSectionProps {
  goals: SharedGoal[];
  accounts: Account[];
  onDeposit: (goalId: string, amount: number, sourceAccountId: string) => void;
}

export const SharedGoalsSection: React.FC<SharedGoalsSectionProps> = ({
  goals,
  accounts,
  onDeposit,
}) => {
  const [selectedGoal, setSelectedGoal] = useState<SharedGoal | null>(null);
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [sourceAccountId, setSourceAccountId] = useState<string>(accounts[0]?.id || '');

  const getGoalIcon = (iconName: string) => {
    switch (iconName) {
      case 'Building2':
        return <Building2 className="w-4 h-4 text-amber-600" />;
      case 'Car':
        return <Car className="w-4 h-4 text-blue-600" />;
      default:
        return <GraduationCap className="w-4 h-4 text-purple-600" />;
    }
  };

  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal) return;
    const val = parseFloat(depositAmount.replace(/[^0-9]/g, ''));
    if (val && val > 0) {
      onDeposit(selectedGoal.id, val, sourceAccountId);
      setDepositAmount('');
      setSelectedGoal(null);
    }
  };

  return (
    <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">
              Target Tabungan Bersama (Shared Goals)
            </h3>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
              Masa Depan Keluarga
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Pelacakan tujuan finansial jangka panjang dengan progres kontribusi bersama.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {goals.map((g) => {
          const percent = Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100));

          return (
            <div
              key={g.id}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white transition-all flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 shadow-2xs flex items-center justify-center">
                    {getGoalIcon(g.icon)}
                  </div>
                  <span className="text-[11px] font-bold text-slate-700 font-mono">
                    {percent}% Tercapai
                  </span>
                </div>

                <h4 className="text-xs font-bold text-slate-900 leading-snug line-clamp-1" title={g.name}>
                  {g.name}
                </h4>
                {g.notes && (
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                    {g.notes}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                {/* Progress bar */}
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-slate-900 transition-all duration-300"
                    style={{ width: `${percent}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="font-bold text-slate-900">
                    {formatRupiah(g.currentAmount)}
                  </span>
                  <span className="text-slate-400">
                    / {formatRupiah(g.targetAmount)}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-[10px] text-slate-500">
                  <span>Target: {formatDateIndo(g.targetDate)}</span>
                  <button
                    onClick={() => {
                      setSelectedGoal(g);
                      setDepositAmount('');
                    }}
                    className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold rounded-md shadow-2xs flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-2.5 h-2.5" />
                    <span>Setor</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Deposit Modal */}
      {selectedGoal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <h4 className="text-sm font-bold text-slate-900 mb-1">
              Setor Tabungan Bersama
            </h4>
            <p className="text-xs text-slate-500 mb-4">
              Alokasikan dana ke target: <strong>{selectedGoal.name}</strong>
            </p>

            <form onSubmit={handleDepositSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-600">
                  Sumber Rekening
                </label>
                <select
                  value={sourceAccountId}
                  onChange={(e) => setSourceAccountId(e.target.value)}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-xs font-medium"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({formatRupiah(acc.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">
                  Nominal Setoran (Rp)
                </label>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="Misal: 2500000"
                  required
                  autoFocus
                  className="w-full mt-1 p-2.5 text-lg font-bold font-mono rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedGoal(null)}
                  className="flex-1 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs"
                >
                  Konfirmasi Setor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

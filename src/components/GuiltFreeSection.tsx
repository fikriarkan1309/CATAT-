import React, { useState } from 'react';
import { Coffee, Sparkles, Smile, Plus, Heart } from 'lucide-react';
import { UserRole } from '../types/finance';
import { formatRupiah } from '../lib/formatters';

interface GuiltFreeSectionProps {
  guiltFree: {
    husband: { allocated: number; spent: number };
    wife: { allocated: number; spent: number };
  };
  activeRole: UserRole;
  onSpend: (role: UserRole, amount: number) => void;
}

export const GuiltFreeSection: React.FC<GuiltFreeSectionProps> = ({
  guiltFree,
  activeRole,
  onSpend,
}) => {
  const [customAmount, setCustomAmount] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<UserRole>(activeRole);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const husbandRemaining = Math.max(0, guiltFree.husband.allocated - guiltFree.husband.spent);
  const wifeRemaining = Math.max(0, guiltFree.wife.allocated - guiltFree.wife.spent);

  const husbandPercent = Math.min(100, Math.round((guiltFree.husband.spent / guiltFree.husband.allocated) * 100));
  const wifePercent = Math.min(100, Math.round((guiltFree.wife.spent / guiltFree.wife.allocated) * 100));

  const handleQuickSpend = (role: UserRole, amount: number) => {
    onSpend(role, amount);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(customAmount.replace(/[^0-9]/g, ''));
    if (val && val > 0) {
      onSpend(selectedRole, val);
      setCustomAmount('');
      setIsModalOpen(false);
    }
  };

  return (
    <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">
              Dompet Pribadi (Guilt-Free Spending)
            </h3>
            <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
              Anti-Tracking Fatigue
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Uang jajan mandiri gelondongan bulanan suami & istri tanpa perlu detail audit nota.
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedRole(activeRole);
            setIsModalOpen(true);
          }}
          className="self-start sm:self-auto px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Pakai Uang Jajan</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Suami Card */}
        <div className={`p-4 rounded-xl border transition-all ${activeRole === 'husband' ? 'border-blue-300 bg-blue-50/30 ring-1 ring-blue-300/40' : 'border-slate-200 bg-slate-50/50'}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">👨🏻‍💼</span>
              <div>
                <span className="text-xs font-bold text-slate-800">Dompet Suami (Fikri)</span>
                <div className="text-[11px] text-slate-500">
                  Alokasi: {formatRupiah(guiltFree.husband.allocated)} / bln
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-slate-900 font-mono">
                {formatRupiah(husbandRemaining)}
              </span>
              <div className="text-[10px] text-slate-400">sisa jajan</div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-200 rounded-full h-2 mb-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${husbandPercent > 90 ? 'bg-rose-500' : 'bg-blue-600'}`}
              style={{ width: `${husbandPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-3 font-mono">
            <span>Terpakai: {formatRupiah(guiltFree.husband.spent)}</span>
            <span>{husbandPercent}%</span>
          </div>

          {/* Quick presets */}
          <div className="flex items-center gap-1.5 pt-2 border-t border-slate-200/60">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mr-1">Cepat:</span>
            <button
              onClick={() => handleQuickSpend('husband', 35000)}
              className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-medium rounded-md shadow-2xs"
            >
              ☕ Kopi (35rb)
            </button>
            <button
              onClick={() => handleQuickSpend('husband', 75000)}
              className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-medium rounded-md shadow-2xs"
            >
              🍱 Makan (75rb)
            </button>
          </div>
        </div>

        {/* Istri Card */}
        <div className={`p-4 rounded-xl border transition-all ${activeRole === 'wife' ? 'border-pink-300 bg-pink-50/30 ring-1 ring-pink-300/40' : 'border-slate-200 bg-slate-50/50'}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">👩🏻‍💼</span>
              <div>
                <span className="text-xs font-bold text-slate-800">Dompet Istri (Alya)</span>
                <div className="text-[11px] text-slate-500">
                  Alokasi: {formatRupiah(guiltFree.wife.allocated)} / bln
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-slate-900 font-mono">
                {formatRupiah(wifeRemaining)}
              </span>
              <div className="text-[10px] text-slate-400">sisa jajan</div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-200 rounded-full h-2 mb-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${wifePercent > 90 ? 'bg-rose-500' : 'bg-pink-600'}`}
              style={{ width: `${wifePercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-3 font-mono">
            <span>Terpakai: {formatRupiah(guiltFree.wife.spent)}</span>
            <span>{wifePercent}%</span>
          </div>

          {/* Quick presets */}
          <div className="flex items-center gap-1.5 pt-2 border-t border-slate-200/60">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mr-1">Cepat:</span>
            <button
              onClick={() => handleQuickSpend('wife', 45000)}
              className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-medium rounded-md shadow-2xs"
            >
              🥤 Chatime (45rb)
            </button>
            <button
              onClick={() => handleQuickSpend('wife', 150000)}
              className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-medium rounded-md shadow-2xs"
            >
              💄 Self-Care (150rb)
            </button>
          </div>
        </div>
      </div>

      {/* Quick Spend Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <h4 className="text-sm font-bold text-slate-900 mb-1">
              Catat Uang Jajan Pribadi
            </h4>
            <p className="text-xs text-slate-500 mb-4">
              Pengeluaran ini langsung memotong saldo dompet santai tanpa audit per item.
            </p>

            <form onSubmit={handleCustomSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600">Pemilik Dompet</label>
                <div className="flex gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setSelectedRole('husband')}
                    className={`flex-1 py-2 text-xs font-medium rounded-lg border ${selectedRole === 'husband' ? 'bg-blue-50 border-blue-400 text-blue-900 font-semibold' : 'bg-white border-slate-200 text-slate-600'}`}
                  >
                    👨🏻‍💼 Suami
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRole('wife')}
                    className={`flex-1 py-2 text-xs font-medium rounded-lg border ${selectedRole === 'wife' ? 'bg-pink-50 border-pink-400 text-pink-900 font-semibold' : 'bg-white border-slate-200 text-slate-600'}`}
                  >
                    👩🏻‍💼 Istri
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">Nominal (Rp)</label>
                <input
                  type="number"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="Misal: 50000"
                  required
                  autoFocus
                  className="w-full mt-1 p-2.5 text-lg font-bold font-mono rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs"
                >
                  Kurangi Saldo Jajan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

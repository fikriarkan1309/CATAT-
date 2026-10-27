import React from 'react';
import { AppIcon, AppIconName } from './AppIcon';
import { AppNavTab } from './BottomNav';

interface LainnyaViewProps {
  onSelectMenu: (tab: AppNavTab) => void;
}

interface MenuItem {
  id: AppNavTab;
  title: string;
  icon: AppIconName;
  gradientClass: string;
  shadowColor: string;
}

export const LainnyaView: React.FC<LainnyaViewProps> = ({ onSelectMenu }) => {
  const menuItems: MenuItem[] = [
    {
      id: 'comparison',
      title: 'Perbandingan',
      icon: 'lainnya-perbandingan',
      gradientClass: 'from-[#FACC15] via-[#EAB308] to-[#CA8A04]',
      shadowColor: 'shadow-amber-500/20',
    },
    {
      id: 'savings',
      title: 'Target Tabungan',
      icon: 'lainnya-tabungan',
      gradientClass: 'from-[#4ADE80] via-[#22C55E] to-[#16A34A]',
      shadowColor: 'shadow-green-500/20',
    },
    {
      id: 'budgets',
      title: 'Alokasi Anggaran',
      icon: 'lainnya-anggaran',
      gradientClass: 'from-[#38BDF8] via-[#0EA5E9] to-[#0284C7]',
      shadowColor: 'shadow-sky-500/20',
    },
    {
      id: 'bills',
      title: 'Tagihan Rutin',
      icon: 'lainnya-tagihanrutin',
      gradientClass: 'from-[#F87171] via-[#EF4444] to-[#DC2626]',
      shadowColor: 'shadow-red-500/20',
    },
    {
      id: 'debts',
      title: 'Hutang/Piutang',
      icon: 'lainnya-hutangpiutang',
      gradientClass: 'from-[#E879F9] via-[#C026D3] to-[#9333EA]',
      shadowColor: 'shadow-purple-500/20',
    },
    {
      id: 'transactions',
      title: 'Transaksi',
      icon: 'lainnya-transaksi',
      gradientClass: 'from-[#F59E0B] via-[#D97706] to-[#B45309]',
      shadowColor: 'shadow-amber-600/20',
    },
  ];

  return (
    <div className="w-full max-w-lg mx-auto sm:max-w-xl md:max-w-2xl px-4 py-3 pb-24 animate-in fade-in">
      {/* 2-Column Grid Matching User's Design Image Lainnya_516d7998.jpg */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4.5 pt-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelectMenu(item.id)}
            className={`group relative flex flex-col items-center justify-center p-5 sm:p-6 aspect-[1/1.05] rounded-3xl bg-gradient-to-b ${item.gradientClass} text-white shadow-md ${item.shadowColor} hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all text-center select-none cursor-pointer`}
          >
            {/* Custom Icon */}
            <div className="mb-3 sm:mb-4 flex items-center justify-center">
              <AppIcon
                name={item.icon}
                className="w-13 h-13 sm:w-16 sm:h-16 text-white drop-shadow-xs group-hover:scale-110 transition-transform duration-200"
              />
            </div>

            {/* Menu Label */}
            <span className="text-sm sm:text-base font-extrabold text-white tracking-tight leading-snug drop-shadow-xs">
              {item.title}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

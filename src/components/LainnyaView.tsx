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
}

export const LainnyaView: React.FC<LainnyaViewProps> = ({ onSelectMenu }) => {
  const menuItems: MenuItem[] = [
    {
      id: 'comparison',
      title: 'Perbandingan',
      icon: 'lainnya-perbandingan',
    },
    {
      id: 'savings',
      title: 'Target Tabungan',
      icon: 'lainnya-tabungan',
    },
    {
      id: 'budgets',
      title: 'Alokasi Anggaran',
      icon: 'lainnya-anggaran',
    },
    {
      id: 'bills',
      title: 'Tagihan Rutin',
      icon: 'lainnya-tagihanrutin',
    },
    {
      id: 'debts',
      title: 'Hutang/Piutang',
      icon: 'lainnya-hutangpiutang',
    },
    {
      id: 'transactions',
      title: 'Transaksi',
      icon: 'lainnya-transaksi',
    },
  ];

  return (
    <div className="w-full max-w-lg mx-auto sm:max-w-xl md:max-w-2xl px-4 py-2 pb-28 animate-in fade-in select-none">
      {/* 3-Column Grid Matching User's Design IMG_1780_1a29ef4f.jpeg */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4 pt-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelectMenu(item.id)}
            className="group relative flex flex-col items-center justify-center p-3 sm:p-4 aspect-square rounded-3xl bg-gradient-to-br from-[#d4edfc] via-[#eef7fd] to-white dark:from-slate-800 dark:via-slate-800/80 dark:to-slate-900 text-[#0052b4] dark:text-sky-300 border border-white/90 dark:border-slate-700/60 shadow-[0_8px_20px_rgba(2,132,199,0.14)] hover:shadow-[0_12px_26px_rgba(2,132,199,0.22)] hover:scale-[1.03] active:scale-95 transition-all text-center cursor-pointer"
          >
            {/* Custom Icon in Deep Brand Blue */}
            <div className="mb-2 flex items-center justify-center">
              <AppIcon
                name={item.icon}
                className="w-10 h-10 sm:w-12 sm:h-12 text-[#0052b4] dark:text-sky-300 drop-shadow-xs group-hover:scale-110 transition-transform duration-200"
              />
            </div>

            {/* Menu Label */}
            <span className="text-[11px] sm:text-xs font-bold text-[#004f9f] dark:text-sky-200 tracking-tight leading-tight line-clamp-2">
              {item.title}
            </span>
          </button>
        ))}
      </div>

      {/* Wide Rounded Pill Button for Export Laporan */}
      <div className="mt-5 sm:mt-6">
        <button
          type="button"
          onClick={() => onSelectMenu('export')}
          className="w-full group relative flex items-center justify-center gap-3.5 py-4 px-6 rounded-full bg-gradient-to-r from-[#bde2fa] via-[#e5f3fc] to-white dark:from-slate-800 dark:via-slate-800/90 dark:to-slate-900 border border-white/90 dark:border-slate-700/60 shadow-[0_10px_25px_rgba(2,132,199,0.18)] hover:shadow-[0_14px_30px_rgba(2,132,199,0.26)] hover:scale-[1.01] active:scale-98 transition-all cursor-pointer"
        >
          {/* Export SVG Icon */}
          <AppIcon
            name="lainnya-export"
            className="w-8 h-8 sm:w-9 sm:h-9 text-[#0052b4] dark:text-sky-300 group-hover:scale-110 transition-transform"
          />

          {/* Button Text */}
          <span className="text-xl sm:text-2xl font-black text-[#004f9f] dark:text-white tracking-tight">
            Export Laporan
          </span>
        </button>
      </div>
    </div>
  );
};

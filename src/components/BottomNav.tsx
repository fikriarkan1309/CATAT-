import React from 'react';
import { Plus } from 'lucide-react';
import { AppIcon, AppIconName } from './AppIcon';

export type AppNavTab =
  | 'home'
  | 'summary'
  | 'accounts'
  | 'savings'
  | 'budgets'
  | 'bills'
  | 'debts'
  | 'transactions'
  | 'comparison'
  | 'more'
  | 'categories'
  | 'export';

interface BottomNavProps {
  currentTab: AppNavTab;
  onSelectTab: (tab: AppNavTab) => void;
  onOpenQuickAdd: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  onOpenQuickAdd,
}) => {
  const tabs: Array<{
    id: AppNavTab;
    label: string;
    icon: AppIconName;
    isActive: boolean;
  }> = [
    {
      id: 'home',
      label: 'Beranda',
      icon: 'tab-home',
      isActive: currentTab === 'home',
    },
    {
      id: 'summary',
      label: 'Ringkasan',
      icon: 'tab-ringkasan',
      isActive: currentTab === 'summary',
    },
    {
      id: 'accounts',
      label: 'Rekening',
      icon: 'tab-rekening',
      isActive: currentTab === 'accounts',
    },
    {
      id: 'more',
      label: 'Lainnya',
      icon: 'tab-lainnya',
      isActive:
        currentTab === 'more' ||
        currentTab === 'savings' ||
        currentTab === 'budgets' ||
        currentTab === 'bills' ||
        currentTab === 'debts' ||
        currentTab === 'transactions' ||
        currentTab === 'comparison' ||
        currentTab === 'categories' ||
        currentTab === 'export',
    },
  ];

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-sky-100/80 dark:border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] select-none"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 8px)' }}
      aria-label="Navigasi Bawah"
    >
      <div className="max-w-lg mx-auto sm:max-w-xl md:max-w-2xl px-2 sm:px-6 h-16 flex items-center justify-between relative">
        {/* Tab 1: Beranda */}
        <button
          type="button"
          onClick={() => onSelectTab('home')}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all active:scale-95 ${
            tabs[0].isActive
              ? 'text-sky-500 font-bold'
              : 'text-sky-600/70 hover:text-sky-600 dark:text-slate-400 font-medium'
          }`}
        >
          <AppIcon
            name={tabs[0].icon}
            className={`w-6 h-6 transition-transform ${tabs[0].isActive ? 'scale-110' : 'scale-100'}`}
          />
          <span className="text-[11px] mt-1 tracking-tight">{tabs[0].label}</span>
        </button>

        {/* Tab 2: Ringkasan */}
        <button
          type="button"
          onClick={() => onSelectTab('summary')}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all active:scale-95 ${
            tabs[1].isActive
              ? 'text-sky-500 font-bold'
              : 'text-sky-600/70 hover:text-sky-600 dark:text-slate-400 font-medium'
          }`}
        >
          <AppIcon
            name={tabs[1].icon}
            className={`w-6 h-6 transition-transform ${tabs[1].isActive ? 'scale-110' : 'scale-100'}`}
          />
          <span className="text-[11px] mt-1 tracking-tight">{tabs[1].label}</span>
        </button>

        {/* Center Floating (+) Button */}
        <div className="flex-1 flex items-center justify-center relative -top-3">
          <button
            type="button"
            onClick={onOpenQuickAdd}
            className="w-14 h-14 rounded-full bg-gradient-to-tr from-sky-400 via-sky-400 to-sky-500 text-white shadow-lg shadow-sky-400/40 flex items-center justify-center border-4 border-white dark:border-slate-900 hover:scale-105 active:scale-95 transition-all group cursor-pointer"
            title="Catat Transaksi Cepat"
            aria-label="Catat Transaksi Cepat"
          >
            <Plus className="w-8 h-8 stroke-[3] group-hover:rotate-90 transition-transform duration-200" />
          </button>
        </div>

        {/* Tab 3: Rekening */}
        <button
          type="button"
          onClick={() => onSelectTab('accounts')}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all active:scale-95 ${
            tabs[2].isActive
              ? 'text-sky-500 font-bold'
              : 'text-sky-600/70 hover:text-sky-600 dark:text-slate-400 font-medium'
          }`}
        >
          <AppIcon
            name={tabs[2].icon}
            className={`w-6 h-6 transition-transform ${tabs[2].isActive ? 'scale-110' : 'scale-100'}`}
          />
          <span className="text-[11px] mt-1 tracking-tight">{tabs[2].label}</span>
        </button>

        {/* Tab 4: Lainnya */}
        <button
          type="button"
          onClick={() => onSelectTab('more')}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all active:scale-95 ${
            tabs[3].isActive
              ? 'text-sky-500 font-bold'
              : 'text-sky-600/70 hover:text-sky-600 dark:text-slate-400 font-medium'
          }`}
        >
          <AppIcon
            name={tabs[3].icon}
            className={`w-6 h-6 transition-transform ${tabs[3].isActive ? 'scale-110' : 'scale-100'}`}
          />
          <span className="text-[11px] mt-1 tracking-tight">{tabs[3].label}</span>
        </button>
      </div>
    </nav>
  );
};

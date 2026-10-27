import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { AppIcon } from './AppIcon';

interface AppHeaderProps {
  onOpenSettings: () => void;
  isOnline: boolean;
  isSyncing: boolean;
  pendingSyncCount: number;
  onOpenSyncQueue?: () => void;
  onLogoClick?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  onOpenSettings,
  isOnline,
  isSyncing,
  pendingSyncCount,
  onOpenSyncQueue,
  onLogoClick,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-slate-950 transition-colors">
      <div className="max-w-lg mx-auto sm:max-w-xl md:max-w-2xl px-4 py-2.5 flex items-center justify-between">
        {/* Logo Catatin! dari /public/Logo 2.png */}
        <button
          type="button"
          onClick={onLogoClick}
          className="flex items-center gap-2 group text-left transition-transform active:scale-95"
          title="Ke Beranda Catatin!"
        >
          <img
            src="/Logo%202.png"
            alt="Catatin!"
            className="h-9 w-auto max-w-[170px] object-contain drop-shadow-xs"
          />
        </button>

        {/* Action icons on right: network state if syncing/offline + settings gear */}
        <div className="flex items-center gap-2.5">
          {/* Subtle network badge if offline or pending queue */}
          {!isOnline && (
            <div
              className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 text-[11px] font-semibold"
              title="Mode Offline (Tersimpan Lokal)"
            >
              <WifiOff className="w-3 h-3" />
              <span>Offline</span>
            </div>
          )}

          {pendingSyncCount > 0 && isOnline && (
            <button
              type="button"
              onClick={onOpenSyncQueue}
              className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 text-[11px] font-semibold"
              title={`${pendingSyncCount} transaksi sedang disinkronkan`}
            >
              <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin text-sky-600' : ''}`} />
              <span className="tabular-nums">{pendingSyncCount}</span>
            </button>
          )}

          {/* Settings gear with user's custom SVG from /public/icons/settings.svg */}
          <button
            type="button"
            onClick={onOpenSettings}
            className="p-1 rounded-xl text-sky-500 hover:text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-slate-800 transition-all active:scale-90"
            title="Pengaturan & Akun"
            aria-label="Buka Pengaturan"
          >
            <AppIcon name="settings" className="w-7 h-7" />
          </button>
        </div>
      </div>
    </header>
  );
};

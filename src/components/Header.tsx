import React, { useRef, useState, useEffect } from 'react';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  PieChart,
  CreditCard,
  Target,
  ListOrdered,
  Tag,
  Home,
  ChevronLeft,
  ChevronRight,
  HandCoins,
  Settings,
  Moon,
  Sun,
} from 'lucide-react';

export type MainNavTab =
  | 'home'
  | 'analysis'
  | 'accounts'
  | 'budgets'
  | 'debts'
  | 'transactions'
  | 'categories';

interface HeaderProps {
  currentTab: MainNavTab;
  onSelectTab: (tab: MainNavTab) => void;
  isOnline: boolean;
  isSyncing: boolean;
  pendingSyncCount: number;
  onToggleOffline: () => void;
  onOpenSyncQueue: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  isOnline,
  isSyncing,
  pendingSyncCount,
  onToggleOffline,
  onOpenSyncQueue,
  theme,
  onToggleTheme,
  onOpenSettings,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Drag & Swipe suppression refs so swiping doesn't accidentally trigger a tab click
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftStartRef = useRef(0);
  const hasMovedRef = useRef(false);

  const navItems: Array<{ id: MainNavTab; label: string; icon: React.ElementType }> = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'analysis', label: 'Ringkasan', icon: PieChart },
    { id: 'accounts', label: 'Rekening', icon: CreditCard },
    { id: 'budgets', label: 'Anggaran', icon: Target },
    { id: 'debts', label: 'Hutang', icon: HandCoins },
    { id: 'transactions', label: 'Transaksi', icon: ListOrdered },
  ];


  // Update left/right scroll affordance indicators
  const updateScrollIndicators = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 6);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 6);
  };

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    updateScrollIndicators();
    el.addEventListener('scroll', updateScrollIndicators, { passive: true });
    window.addEventListener('resize', updateScrollIndicators);
    return () => {
      el.removeEventListener('scroll', updateScrollIndicators);
      window.removeEventListener('resize', updateScrollIndicators);
    };
  }, []);

  // Auto center active tab smoothly on change
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const activeBtn = el.querySelector(`[data-tab-id="${currentTab}"]`) as HTMLElement;
    if (activeBtn) {
      const containerWidth = el.clientWidth;
      const btnLeft = activeBtn.offsetLeft;
      const btnWidth = activeBtn.clientWidth;
      const targetScroll = btnLeft - containerWidth / 2 + btnWidth / 2;
      el.scrollTo({ left: targetScroll, behavior: 'smooth' });
    }
  }, [currentTab]);

  // Touch Swipe Handlers for mobile (HP)
  const handleTouchStart = (e: React.TouchEvent) => {
    const el = scrollContainerRef.current;
    if (!el) return;
    isDraggingRef.current = true;
    startXRef.current = e.touches[0].pageX;
    scrollLeftStartRef.current = el.scrollLeft;
    hasMovedRef.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current || !scrollContainerRef.current) return;
    const deltaX = e.touches[0].pageX - startXRef.current;
    if (Math.abs(deltaX) > 6) {
      hasMovedRef.current = true;
    }
    // Allow native momentum or manual assist
    scrollContainerRef.current.scrollLeft = scrollLeftStartRef.current - deltaX;
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
    // Keep hasMovedRef true briefly to swallow accidental click
    setTimeout(() => {
      hasMovedRef.current = false;
    }, 150);
  };

  // Mouse Drag Handlers for Desktop/Tablet
  const handleMouseDown = (e: React.MouseEvent) => {
    const el = scrollContainerRef.current;
    if (!el) return;
    isDraggingRef.current = true;
    startXRef.current = e.pageX;
    scrollLeftStartRef.current = el.scrollLeft;
    hasMovedRef.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || !scrollContainerRef.current) return;
    e.preventDefault();
    const deltaX = e.pageX - startXRef.current;
    if (Math.abs(deltaX) > 5) {
      hasMovedRef.current = true;
    }
    scrollContainerRef.current.scrollLeft = scrollLeftStartRef.current - deltaX;
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    setTimeout(() => {
      hasMovedRef.current = false;
    }, 120);
  };

  const handleTabClick = (tabId: MainNavTab) => {
    // If the user was swiping/dragging, ignore tab switch
    if (hasMovedRef.current) return;
    onSelectTab(tabId);
  };

  const scrollByAmount = (offset: number) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-[1400px] mx-auto px-3 sm:px-6">
        {/* Head Utama: Brand & Status Jaringan */}
        <div className="flex items-center justify-between h-12">
          {/* Brand Wordmark */}
          <button
            onClick={() => onSelectTab('home')}
            className="flex items-center gap-2 text-left group"
          >
            <div className="w-7 h-7 rounded-lg bg-slate-900 dark:bg-indigo-600 text-white flex items-center justify-center font-black text-xs shadow-xs group-hover:scale-105 transition-transform">
              C!
            </div>
            <div>
              <span className="font-extrabold text-slate-900 dark:text-white text-sm tracking-tight leading-none">
                CATAT!
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium ml-2 hidden sm:inline">
                Buku Kas & Anggaran
              </span>
            </div>
          </button>

          {/* Status Jaringan, Tema, dan Tombol Gerigi */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={onToggleOffline}
              title={isOnline ? 'Klik untuk simulasi mode Offline' : 'Klik untuk kembali Online'}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border transition-colors ${
                isOnline
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                  : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800 hover:bg-amber-100'
              }`}
            >
              {isOnline ? (
                <>
                  <Wifi className="w-3 h-3" />
                  <span className="hidden sm:inline">Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3 text-amber-600" />
                  <span>Offline</span>
                </>
              )}
            </button>

            <button
              onClick={onOpenSyncQueue}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border transition-colors ${
                pendingSyncCount > 0
                  ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                  : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              <RefreshCw
                className={`w-3 h-3 ${isSyncing ? 'animate-spin text-blue-600' : ''}`}
              />
              <span className="tabular-nums">
                {pendingSyncCount > 0 ? `${pendingSyncCount} Antrean` : 'Tersinkron'}
              </span>
            </button>

            {/* Dark Mode Quick Toggle */}
            <button
              type="button"
              onClick={onToggleTheme}
              title={theme === 'dark' ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-600" />}
            </button>

            {/* Tombol Gerigi (Pojok Kanan Atas Sesuai Permintaan) */}
            <button
              type="button"
              onClick={onOpenSettings}
              title="Pengaturan, Data & Akun"
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:scale-105 active:scale-95 transition-all shadow-xs"
            >
              <Settings className="w-4 h-4 text-slate-700 dark:text-slate-200" />
            </button>
          </div>
        </div>

        {/* Navigasi Utama di Bawah Head Utama (Swipeable / Scrollable di HP & Mouse Drag di Desktop) */}
        <div className="relative pb-2 pt-0.5">
          {/* Subtle Left Scroll Button & Fade (Visible when scrolled) */}
          {canScrollLeft && (
            <div className="absolute left-0 top-0 bottom-2 z-10 flex items-center pr-2 bg-gradient-to-r from-white dark:from-slate-900 via-white/80 dark:via-slate-900/80 to-transparent pointer-events-none">
              <button
                type="button"
                onClick={() => scrollByAmount(-140)}
                className="w-5 h-6 rounded-md bg-white dark:bg-slate-800 shadow-xs border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-300 hover:text-slate-900 pointer-events-auto"
                title="Geser Kiri"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Swipeable Scroll Track with touch and mouse handlers */}
          <div
            ref={scrollContainerRef}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth touch-pan-x overscroll-x-contain select-none cursor-grab active:cursor-grabbing px-0.5"
            style={{
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            {navItems.map((item) => {
              const IconComp = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  data-tab-id={item.id}
                  type="button"
                  onClick={() => handleTabClick(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                    isActive
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs scale-[1.02]'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 bg-slate-50/60 dark:bg-slate-800/40'
                  }`}
                >
                  <IconComp className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}

            {/* If user navigated to categories from gear, display it as active */}
            {currentTab === 'categories' && (
              <button
                data-tab-id="categories"
                type="button"
                onClick={() => handleTabClick('categories')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap bg-amber-500 text-white shadow-xs scale-[1.02] shrink-0"
              >
                <Tag className="w-3.5 h-3.5" />
                <span>Kategori (Aktif)</span>
              </button>
            )}
          </div>

          {/* Subtle Right Scroll Button & Fade (Visible when more tabs exist to the right) */}
          {canScrollRight && (
            <div className="absolute right-0 top-0 bottom-2 z-10 flex items-center pl-2 bg-gradient-to-l from-white dark:from-slate-900 via-white/80 dark:via-slate-900/80 to-transparent pointer-events-none">
              <button
                type="button"
                onClick={() => scrollByAmount(140)}
                className="w-5 h-6 rounded-md bg-white dark:bg-slate-800 shadow-xs border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-300 hover:text-slate-900 pointer-events-auto"
                title="Geser Kanan"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};


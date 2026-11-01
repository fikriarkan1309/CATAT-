import React from 'react';
import {
  Bell,
  X,
  Calendar,
  AlertTriangle,
  Clock,
  Target,
  BarChart3,
  CheckCheck,
  Trash2,
  Settings,
  ChevronRight,
  Info,
} from 'lucide-react';
import { AppNotification, NotificationType } from '../types/finance';

interface NotificationDrawerModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onClearAll: () => void;
  onDeleteNotification: (id: string) => void;
  onOpenSettings: () => void;
  onNavigateView?: (view: string) => void;
}

export const NotificationDrawerModal: React.FC<NotificationDrawerModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkRead,
  onMarkAllRead,
  onClearAll,
  onDeleteNotification,
  onOpenSettings,
  onNavigateView,
}) => {
  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getNotifIcon = (type: NotificationType) => {
    switch (type) {
      case 'bill_reminder':
        return <Calendar className="w-4 h-4 text-amber-500" />;
      case 'budget_alert':
        return <AlertTriangle className="w-4 h-4 text-rose-500" />;
      case 'daily_reminder':
        return <Clock className="w-4 h-4 text-sky-500" />;
      case 'goal_milestone':
        return <Target className="w-4 h-4 text-emerald-500" />;
      case 'summary_report':
        return <BarChart3 className="w-4 h-4 text-indigo-500" />;
      default:
        return <Info className="w-4 h-4 text-slate-400" />;
    }
  };

  const handleNotificationClick = (notif: AppNotification) => {
    if (!notif.isRead) {
      onMarkRead(notif.id);
    }
    if (notif.actionView && onNavigateView) {
      onNavigateView(notif.actionView);
      onClose();
    }
  };

  const formatTimeAgo = (isoStr: string) => {
    try {
      const date = new Date(isoStr);
      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return 'Baru saja';
      if (diffMins < 60) return `${diffMins} menit lalu`;
      if (diffHours < 24) return `${diffHours} jam lalu`;
      if (diffDays === 1) return 'Kemarin';
      return `${diffDays} hari lalu`;
    } catch {
      return '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="w-full max-w-sm sm:max-w-md bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[85vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-9 h-9 rounded-2xl bg-sky-500 text-white flex items-center justify-center shadow-xs">
                <Bell className="w-5 h-5" />
              </div>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-rose-500 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 animate-pulse">
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>Notifikasi & Pengingat</span>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 bg-sky-100 dark:bg-sky-950 px-2 py-0.5 rounded-full">
                    {unreadCount} Baru
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Pusat pesan tagihan, anggaran, & laporan
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onOpenSettings}
              title="Pengaturan Notifikasi"
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Action Controls */}
        {notifications.length > 0 && (
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80 mb-2 shrink-0 text-[11px]">
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={onMarkAllRead}
                className="text-sky-600 dark:text-sky-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Tandai Semua Dibaca</span>
              </button>
            ) : (
              <span className="text-slate-400">Semua telah dibaca</span>
            )}

            <button
              type="button"
              onClick={onClearAll}
              className="text-slate-400 hover:text-rose-500 font-medium transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Bersihkan</span>
            </button>
          </div>
        )}

        {/* Notifications List */}
        <div className="overflow-y-auto space-y-2.5 pr-1 my-auto flex-1">
          {notifications.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-2.5">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                <Bell className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Belum Ada Notifikasi
                </div>
                <div className="text-[11px] text-slate-400 max-w-[200px] mt-0.5">
                  Pengingat tagihan, limit anggaran, & pencapaian tabungan akan muncul di sini.
                </div>
              </div>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer relative group ${
                  !notif.isRead
                    ? 'bg-sky-50/70 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800/80 shadow-xs'
                    : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 hover:bg-slate-100/80'
                }`}
              >
                {!notif.isRead && (
                  <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-sky-500" />
                )}

                <div className="flex items-start gap-2.5 pr-3">
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-800 shadow-xs shrink-0 mt-0.5">
                    {getNotifIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {notif.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {formatTimeAgo(notif.timestamp)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-snug">
                      {notif.message}
                    </p>
                    {notif.actionView && (
                      <div className="mt-1.5 text-[10px] font-bold text-sky-600 dark:text-sky-400 flex items-center gap-0.5">
                        <span>Lihat Detail</span>
                        <ChevronRight className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Delete button on hover */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteNotification(notif.id);
                  }}
                  title="Hapus"
                  className="absolute bottom-2 right-2 p-1 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-center shrink-0 mt-2">
          <button
            type="button"
            onClick={onOpenSettings}
            className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:underline flex items-center justify-center gap-1.5 w-full"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Atur Jenis Pengingat & Jam Notifikasi</span>
          </button>
        </div>

      </div>
    </div>
  );
};

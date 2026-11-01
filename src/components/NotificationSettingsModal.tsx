import React, { useState } from 'react';
import {
  Bell,
  X,
  Smartphone,
  Calendar,
  AlertTriangle,
  Clock,
  Target,
  BarChart3,
  CheckCircle2,
  Send,
  ShieldCheck,
} from 'lucide-react';
import { NotificationSettings } from '../types/finance';
import {
  getNotificationPermission,
  requestNotificationPermission,
  sendOSPushNotification,
} from '../lib/webPush';

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: NotificationSettings;
  onUpdateSettings: (updates: Partial<NotificationSettings>) => void;
  onSendTestNotification: (title: string, message: string) => void;
}

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onSendTestNotification,
}) => {
  const [permission, setPermission] = useState<NotificationPermission>(() =>
    getNotificationPermission()
  );
  const [testSent, setTestSent] = useState(false);

  if (!isOpen) return null;

  const handleRequestOSPermission = async () => {
    const res = await requestNotificationPermission();
    setPermission(res);
    if (res === 'granted') {
      onUpdateSettings({ pushEnabled: true });
      sendOSPushNotification('🎉 Notifikasi HP Berhasil Aktif!', {
        body: 'Anda sekarang akan menerima pengingat tagihan & limit anggaran langsung di layar HP/browser.',
      });
    } else {
      onUpdateSettings({ pushEnabled: false });
    }
  };

  const handleTestNotification = () => {
    setTestSent(true);
    onSendTestNotification(
      '🔔 Notifikasi Uji Coba Catatin!',
      'Ini adalah contoh notifikasi pengingat tagihan dan limit anggaran harian Anda.'
    );
    if (settings.pushEnabled && permission === 'granted') {
      sendOSPushNotification('🔔 Notifikasi Uji Coba Catatin!', {
        body: 'Ini adalah contoh notifikasi pengingat tagihan dan limit anggaran harian Anda.',
      });
    }
    setTimeout(() => setTestSent(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-sky-500 text-white flex items-center justify-center shadow-xs">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Pengaturan Notifikasi & Pengingat
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Kelola pengingat tagihan, anggaran, & laporan harian
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto space-y-4 pr-1 text-xs text-slate-700 dark:text-slate-300">
          
          {/* Master Toggle */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="font-bold text-slate-900 dark:text-white text-sm">
                Aktifkan Sistem Notifikasi
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Terima pengingat harian dan peringatan finansial
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enabled}
                onChange={(e) => onUpdateSettings({ enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:after:border-slate-600 peer-checked:bg-sky-500"></div>
            </label>
          </div>

          {/* OS Push Notification Permission Card */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-sky-50 to-indigo-50 dark:from-sky-950/40 dark:to-indigo-950/40 border border-sky-200 dark:border-sky-800/60 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <span className="font-bold text-slate-900 dark:text-white">
                  Notifikasi Layar HP / Browser (Push)
                </span>
              </div>
              {permission === 'granted' && settings.pushEnabled ? (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Aktif
                </span>
              ) : (
                <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                  Belum Aktif
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
              Izinkan akses notifikasi agar pengingat muncul di layar HP Anda meskipun aplikasi sedang ditutup.
            </p>
            {permission !== 'granted' || !settings.pushEnabled ? (
              <button
                type="button"
                onClick={handleRequestOSPermission}
                className="w-full py-2 px-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Aktifkan Notifikasi Layar HP</span>
              </button>
            ) : (
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                Izin notifikasi layar HP telah diberikan di perangkat ini.
              </div>
            )}
          </div>

          {/* Individual Feature Toggles (1, 2, 3, 5, 6) */}
          <div className="space-y-3 pt-1">
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Pilihan Jenis Pengingat
            </h4>

            {/* 1. Pengingat Tagihan Rutin */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">
                    1. Pengingat Tagihan Rutin
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">
                    Pengingat jatuh tempo (H-3 & Hari H)
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.billReminders}
                onChange={(e) => onUpdateSettings({ billReminders: e.target.checked })}
                className="w-4 h-4 text-sky-500 rounded-md border-slate-300 focus:ring-sky-400 cursor-pointer"
              />
            </div>

            {/* 2. Peringatan Limit Anggaran */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">
                    2. Peringatan Limit Anggaran
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">
                    Peringatan saat pengeluaran capai 80% & 100%
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.budgetAlerts}
                onChange={(e) => onUpdateSettings({ budgetAlerts: e.target.checked })}
                className="w-4 h-4 text-sky-500 rounded-md border-slate-300 focus:ring-sky-400 cursor-pointer"
              />
            </div>

            {/* 3. Pengingat Catat Harian */}
            <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">
                      3. Pengingat Catat Harian
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">
                      Mengingatkan untuk mencatat transaksi malam hari
                    </div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.dailyReminder}
                  onChange={(e) => onUpdateSettings({ dailyReminder: e.target.checked })}
                  className="w-4 h-4 text-sky-500 rounded-md border-slate-300 focus:ring-sky-400 cursor-pointer"
                />
              </div>

              {settings.dailyReminder && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-[11px]">
                  <span className="text-slate-600 dark:text-slate-300 font-medium">Jam Pengingat Harian:</span>
                  <input
                    type="time"
                    value={settings.dailyReminderTime || '20:00'}
                    onChange={(e) => onUpdateSettings({ dailyReminderTime: e.target.value })}
                    className="px-2.5 py-1 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
              )}
            </div>

            {/* 5. Progres Target Tabungan */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">
                    5. Progres Target Tabungan
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">
                    Notifikasi milestone 50%, 75%, & 100% target
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.goalProgress}
                onChange={(e) => onUpdateSettings({ goalProgress: e.target.checked })}
                className="w-4 h-4 text-sky-500 rounded-md border-slate-300 focus:ring-sky-400 cursor-pointer"
              />
            </div>

            {/* 6. Ringkasan Evaluasi Mingguan & Bulanan */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">
                    6. Ringkasan Mingguan & Bulanan
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">
                    Ringkasan evaluasi harian & laporan kesehatan kas
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.summaryReports}
                onChange={(e) => onUpdateSettings({ summaryReports: e.target.checked })}
                className="w-4 h-4 text-sky-500 rounded-md border-slate-300 focus:ring-sky-400 cursor-pointer"
              />
            </div>
          </div>

          {/* Test Notification Action */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleTestNotification}
              disabled={testSent}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 text-sky-500" />
              <span>{testSent ? '✓ Notifikasi Uji Coba Terkirim!' : 'Kirim Notifikasi Uji Coba'}</span>
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 mt-3 text-right">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-xs"
          >
            Simpan & Selesai
          </button>
        </div>

      </div>
    </div>
  );
};

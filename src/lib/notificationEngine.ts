import {
  AppNotification,
  NotificationSettings,
  NotificationType,
  RecurringBill,
  Budget,
  SharedGoal,
  Transaction,
  Category,
} from '../types/finance';
import { sendOSPushNotification } from './webPush';

export const INITIAL_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: true,
  pushEnabled: false,
  billReminders: true,
  budgetAlerts: true,
  dailyReminder: true,
  dailyReminderTime: '20:00',
  goalProgress: true,
  summaryReports: true,
};

export interface StorageStateWithNotifications {
  bills: RecurringBill[];
  budgets: Budget[];
  goals: SharedGoal[];
  transactions: Transaction[];
  categories: Category[];
  notifications?: AppNotification[];
  notificationSettings?: NotificationSettings;
}

/**
 * Evaluates state data and generates relevant notifications according to rules 1, 2, 3, 5, 6.
 * Returns array of new notifications created.
 */
export function evaluateAndTriggerNotifications(
  state: StorageStateWithNotifications,
  existingNotifications: AppNotification[] = [],
  settings: NotificationSettings = INITIAL_NOTIFICATION_SETTINGS
): { newNotifications: AppNotification[]; updatedSettings: NotificationSettings } {
  if (!settings.enabled) {
    return { newNotifications: [], updatedSettings: settings };
  }

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
  const currentYearMonth = todayStr.substring(0, 7); // YYYY-MM
  const newNotifications: AppNotification[] = [];
  const updatedSettings = { ...settings };

  const existingNotificationKeys = new Set(
    existingNotifications.map((n) => `${n.type}_${n.title}_${n.timestamp.substring(0, 10)}`)
  );

  const createNotification = (
    type: NotificationType,
    title: string,
    message: string,
    actionView?: string,
    data?: any
  ) => {
    const key = `${type}_${title}_${todayStr}`;
    if (existingNotificationKeys.has(key)) {
      return; // Deduplicate so same notification isn't triggered multiple times today
    }
    existingNotificationKeys.add(key);

    const notification: AppNotification = {
      id: 'notif_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      type,
      title,
      message,
      timestamp: now.toISOString(),
      isRead: false,
      actionView,
      data,
    };

    newNotifications.push(notification);

    // If OS push notifications enabled, fire native OS push popup
    if (settings.pushEnabled) {
      sendOSPushNotification(title, {
        body: message,
        data: { actionView, ...data },
      });
    }
  };

  // -------------------------------------------------------------
  // 1. PENGINGAT TAGIHAN RUTIN (H-3 & HARI H JATUH TEMPO)
  // -------------------------------------------------------------
  if (settings.billReminders && state.bills) {
    const currentDay = now.getDate();

    state.bills
      .filter((bill) => !bill.isDeleted)
      .forEach((bill) => {
        const isPaid = bill.paidMonths && bill.paidMonths.includes(currentYearMonth);
        if (isPaid) return;

        const dueDay = bill.dueDay;
        const daysLeft = dueDay - currentDay;

        if (daysLeft === 0) {
          createNotification(
            'bill_reminder',
            `⏰ Tagihan ${bill.name} Jatuh Tempo Hari Ini!`,
            `Tagihan Rp ${bill.amount.toLocaleString('id-ID')} perlu dibayar hari ini (Tgl ${dueDay}).`,
            'bills',
            { billId: bill.id }
          );
        } else if (daysLeft > 0 && daysLeft <= 3) {
          createNotification(
            'bill_reminder',
            `📅 Pengingat Tagihan ${bill.name}`,
            `Tagihan Rp ${bill.amount.toLocaleString('id-ID')} akan jatuh tempo ${daysLeft} hari lagi (Tgl ${dueDay}).`,
            'bills',
            { billId: bill.id }
          );
        }
      });
  }

  // -------------------------------------------------------------
  // 2. PERINGATAN LIMIT ANGGARAN (80% & 100% THRESHOLD)
  // -------------------------------------------------------------
  if (settings.budgetAlerts && state.budgets && state.transactions) {
    state.budgets
      .filter((budget) => !budget.isDeleted)
      .forEach((budget) => {
        const category = state.categories.find((c) => c.id === budget.categoryId);
        const categoryName = category ? category.name : 'Kategori';

        // Calculate total spent in this budget category for current month/period
        const spent = state.transactions
          .filter(
            (t) =>
              !t.isDeleted &&
              t.type === 'expense' &&
              t.categoryId === budget.categoryId &&
              t.transactionDate.substring(0, 7) === currentYearMonth
          )
          .reduce((sum, t) => sum + t.amount, 0);

        if (budget.limitAmount > 0) {
          const pct = (spent / budget.limitAmount) * 100;

          if (pct >= 100) {
            createNotification(
              'budget_alert',
              `🚨 Anggaran ${categoryName} Melebihi Limit!`,
              `Pengeluaran ${categoryName} telah mencapai Rp ${spent.toLocaleString('id-ID')} (100% dari limit Rp ${budget.limitAmount.toLocaleString('id-ID')}).`,
              'budget',
              { budgetId: budget.id }
            );
          } else if (pct >= 80) {
            createNotification(
              'budget_alert',
              `⚠️ Anggaran ${categoryName} Capai 80%`,
              `Pengeluaran ${categoryName} telah mencapai Rp ${spent.toLocaleString('id-ID')} (${Math.round(pct)}% dari limit Rp ${budget.limitAmount.toLocaleString('id-ID')}).`,
              'budget',
              { budgetId: budget.id }
            );
          }
        }
      });
  }

  // -------------------------------------------------------------
  // 3. PENGINGAT ROUTINE CATAT PENGELUARAN HARIAN (20:00)
  // -------------------------------------------------------------
  if (settings.dailyReminder) {
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    const [targetHour, targetMin] = (settings.dailyReminderTime || '20:00')
      .split(':')
      .map((num) => parseInt(num, 10) || 0);

    const isPastReminderTime =
      currentHour > targetHour || (currentHour === targetHour && currentMinute >= targetMin);

    if (isPastReminderTime && settings.lastDailyReminderDate !== todayStr) {
      // Check if user has logged any transaction today
      const loggedToday = state.transactions.some(
        (t) => !t.isDeleted && t.transactionDate.substring(0, 10) === todayStr
      );

      if (!loggedToday) {
        createNotification(
          'daily_reminder',
          '📝 Catat Pengeluaran Hari Ini',
          'Sudahkah Anda mencatat keuangan hari ini? Luangkan 1 menit agar catatan keuangan keluarga tetap rapi!',
          'dashboard'
        );
        updatedSettings.lastDailyReminderDate = todayStr;
      }
    }
  }

  // -------------------------------------------------------------
  // 5. PROGRES TARGET TABUNGAN BERSAMA (50%, 75%, 100%)
  // -------------------------------------------------------------
  if (settings.goalProgress && state.goals) {
    state.goals
      .filter((goal) => !goal.isDeleted)
      .forEach((goal) => {
        if (goal.targetAmount <= 0) return;
        const pct = (goal.currentAmount / goal.targetAmount) * 100;

        if (pct >= 100) {
          createNotification(
            'goal_milestone',
            `🎉 Target Tabungan ${goal.name} TERCAPAI!`,
            `Hore! Tabungan "${goal.name}" telah mencapai target 100% (Rp ${goal.targetAmount.toLocaleString('id-ID')}). Selamat!`,
            'goals',
            { goalId: goal.id }
          );
        } else if (pct >= 75) {
          createNotification(
            'goal_milestone',
            `🎯 Tabungan ${goal.name} Capai 75%`,
            `Progres tabungan "${goal.name}" sudah mencapai Rp ${goal.currentAmount.toLocaleString('id-ID')} (75% dari target). Sedikit lagi!`,
            'goals',
            { goalId: goal.id }
          );
        } else if (pct >= 50) {
          createNotification(
            'goal_milestone',
            `🚀 Tabungan ${goal.name} Capai 50%`,
            `Hebat! Tabungan "${goal.name}" telah melewati 50% target (Rp ${goal.currentAmount.toLocaleString('id-ID')}).`,
            'goals',
            { goalId: goal.id }
          );
        }
      });
  }

  // -------------------------------------------------------------
  // 6. RINGKASAN EVALUASI KEANGAN MINGGUAN & BULANAN
  // -------------------------------------------------------------
  if (settings.summaryReports && state.transactions) {
    const dayOfWeek = now.getDay(); // 0 = Sunday
    const weekYearStr = `${now.getFullYear()}_W${Math.ceil(now.getDate() / 7)}`;

    // Weekly summary evaluation (e.g. Sunday or end of week)
    if (dayOfWeek === 0 && settings.lastWeeklySummaryDate !== weekYearStr) {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const weeklyExpense = state.transactions
        .filter(
          (t) =>
            !t.isDeleted &&
            t.type === 'expense' &&
            new Date(t.transactionDate) >= sevenDaysAgo
        )
        .reduce((sum, t) => sum + t.amount, 0);

      createNotification(
        'summary_report',
        '📊 Evaluasi Keuangan Mingguan',
        `Total pengeluaran keluarga 7 hari terakhir: Rp ${weeklyExpense.toLocaleString('id-ID')}. Klik untuk lihat laporan analisis lengkap.`,
        'reports'
      );
      updatedSettings.lastWeeklySummaryDate = weekYearStr;
    }

    // Monthly summary evaluation (e.g. 1st day of new month)
    if (now.getDate() === 1 && settings.lastMonthlySummaryDate !== currentYearMonth) {
      createNotification(
        'summary_report',
        '📈 Laporan Ringkasan Bulanan Siap!',
        `Ringkasan keuangan bulan baru telah siap. Evaluasi sisa kas & alokasikan dompet rollover keluarga Anda.`,
        'reports'
      );
      updatedSettings.lastMonthlySummaryDate = currentYearMonth;
    }
  }

  return { newNotifications, updatedSettings };
}

// Web Push & OS Notification helper for Catatin! PWA

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) {
    console.warn('Web Notifications are not supported in this browser.');
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.error('Error requesting notification permission:', err);
    return 'denied';
  }
}

export async function sendOSPushNotification(
  title: string,
  options?: NotificationOptions & { actionView?: string }
): Promise<boolean> {
  if (!isNotificationSupported()) return false;

  if (Notification.permission !== 'granted') {
    return false;
  }

  try {
    const defaultOptions: any = {
      icon: '/Logo.png',
      badge: '/Logo.png',
      vibrate: [100, 50, 100],
      ...options,
    };

    // Try Service Worker registration showNotification if available (works in background & PWA)
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      if (registration && registration.showNotification) {
        await registration.showNotification(title, defaultOptions);
        return true;
      }
    }

    // Fallback to standard Notification API
    new Notification(title, defaultOptions);
    return true;
  } catch (err) {
    console.warn('Could not display OS push notification:', err);
    return false;
  }
}

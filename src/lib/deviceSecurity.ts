/**
 * Device-Level Security & 6-Digit PIN Engine for Catatin!
 * Manages device-local security (per-device opt-in, never sent to remote cloud).
 */

const STORAGE_KEY_CONFIG = 'catatin_device_security_config';
const STORAGE_KEY_HASH = 'catatin_device_pin_hash';
const STORAGE_KEY_LAST_ACTIVE = 'catatin_device_last_active_ts';

export interface DeviceSecurityConfig {
  isPinEnabled: boolean;
  autoLockDelayMinutes: number; // 0 = immediately, 1 = 1 minute, 5 = 5 minutes
  hasPromptedPinSetup: boolean; // For Opsi A: soft prompt for new users
}

const DEFAULT_CONFIG: DeviceSecurityConfig = {
  isPinEnabled: false,
  autoLockDelayMinutes: 0,
  hasPromptedPinSetup: false,
};

// Simple yet secure cryptographic SHA-256 hash with device salt
async function generatePinHash(pin: string): Promise<string> {
  const salt = 'catatin_pin_salt_v2_';
  const data = new TextEncoder().encode(salt + pin);

  if (typeof crypto !== 'undefined' && crypto.subtle) {
    try {
      const buffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(buffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch {
      // Fallback below
    }
  }

  // Fallback hashing if crypto.subtle is restricted
  let hash = 0x811c9dc5;
  const str = salt + pin;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return ('00000000' + (hash >>> 0).toString(16)).slice(-8);
}

export function getDeviceSecurityConfig(): DeviceSecurityConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (raw) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.warn('Failed to parse device security config:', e);
  }
  return { ...DEFAULT_CONFIG };
}

export function saveDeviceSecurityConfig(config: Partial<DeviceSecurityConfig>): DeviceSecurityConfig {
  const current = getDeviceSecurityConfig();
  const updated: DeviceSecurityConfig = { ...current, ...config };
  try {
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to save device security config:', e);
  }
  return updated;
}

export function isDevicePinSet(): boolean {
  try {
    const hash = localStorage.getItem(STORAGE_KEY_HASH);
    const config = getDeviceSecurityConfig();
    return Boolean(config.isPinEnabled && hash && hash.length > 0);
  } catch {
    return false;
  }
}

export async function verifyDevicePin(enteredPin: string): Promise<boolean> {
  try {
    const storedHash = localStorage.getItem(STORAGE_KEY_HASH);
    if (!storedHash) return false;
    const computedHash = await generatePinHash(enteredPin);
    return storedHash === computedHash;
  } catch (e) {
    console.warn('PIN verification error:', e);
    return false;
  }
}

export async function setDevicePin(newPin: string): Promise<boolean> {
  if (!newPin || newPin.length !== 6 || !/^\d{6}$/.test(newPin)) {
    return false;
  }
  try {
    const hash = await generatePinHash(newPin);
    localStorage.setItem(STORAGE_KEY_HASH, hash);
    saveDeviceSecurityConfig({ isPinEnabled: true, hasPromptedPinSetup: true });
    return true;
  } catch (e) {
    console.warn('Failed to set device PIN:', e);
    return false;
  }
}

export function disableDevicePin(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_HASH);
    saveDeviceSecurityConfig({ isPinEnabled: false });
  } catch (e) {
    console.warn('Failed to disable device PIN:', e);
  }
}

export function markPinSetupPrompted(): void {
  saveDeviceSecurityConfig({ hasPromptedPinSetup: true });
}

export function recordDeviceActive(): void {
  try {
    sessionStorage.setItem(STORAGE_KEY_LAST_ACTIVE, Date.now().toString());
  } catch {}
}

export function recordDeviceLeft(): void {
  try {
    sessionStorage.setItem(STORAGE_KEY_LAST_ACTIVE, Date.now().toString());
  } catch {}
}

export function shouldAutoLock(): boolean {
  const config = getDeviceSecurityConfig();
  if (!config.isPinEnabled || !isDevicePinSet()) {
    return false;
  }

  // If delay is 0, always lock immediately when returning
  if (config.autoLockDelayMinutes === 0) {
    return true;
  }

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY_LAST_ACTIVE);
    if (!raw) return true;
    const lastActive = parseInt(raw, 10);
    const elapsedMinutes = (Date.now() - lastActive) / (1000 * 60);
    return elapsedMinutes >= config.autoLockDelayMinutes;
  } catch {
    return true;
  }
}

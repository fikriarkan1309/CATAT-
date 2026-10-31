import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  Unlock,
  KeyRound,
  Clock,
  Smartphone,
  X,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import {
  getDeviceSecurityConfig,
  saveDeviceSecurityConfig,
  isDevicePinSet,
  DeviceSecurityConfig,
} from '../lib/deviceSecurity';
import { SecurityPinSetupModal, PinSetupMode } from './SecurityPinSetupModal';

interface SecuritySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLockNow: () => void;
}

export const SecuritySettingsModal: React.FC<SecuritySettingsModalProps> = ({
  isOpen,
  onClose,
  onLockNow,
}) => {
  const [config, setConfig] = useState<DeviceSecurityConfig>(getDeviceSecurityConfig);
  const [isPinSet, setIsPinSet] = useState<boolean>(isDevicePinSet);
  const [setupModalMode, setSetupModalMode] = useState<PinSetupMode | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      refreshState();
    }
  }, [isOpen]);

  const refreshState = () => {
    setConfig(getDeviceSecurityConfig());
    setIsPinSet(isDevicePinSet());
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleTogglePin = () => {
    if (config.isPinEnabled && isPinSet) {
      // User wants to disable PIN -> verify current PIN
      setSetupModalMode('disable');
    } else {
      // User wants to enable PIN -> create PIN
      setSetupModalMode('create');
    }
  };

  const handleChangePin = () => {
    setSetupModalMode('change');
  };

  const handleSetupSuccess = (message: string) => {
    setSetupModalMode(null);
    refreshState();
    showToast(message);
  };

  const handleSelectDelay = (minutes: number) => {
    const updated = saveDeviceSecurityConfig({ autoLockDelayMinutes: minutes });
    setConfig(updated);
    showToast(`Waktu kunci otomatis diset ke ${minutes === 0 ? 'Langsung' : `${minutes} Menit`}`);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Keamanan & Kunci PIN
                </h3>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Pengamanan 6 digit di perangkat ini
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Toast Alert */}
          {toastMessage && (
            <div className="mb-3 p-2.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* Device Context Note */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl mb-4 border border-slate-100 dark:border-slate-800 flex items-start gap-2.5">
            <Smartphone className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
              Kunci PIN ini <b>hanya berlaku di HP ini</b>. Perangkat keluarga lain yang memakai akun bersama tetap mandiri dan tidak akan terkunci kecuali diaktifkan di HP masing-masing.
            </p>
          </div>

          <div className="space-y-3">
            {/* Main Toggle Item */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    config.isPinEnabled && isPinSet
                      ? 'bg-sky-500 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                  }`}
                >
                  {config.isPinEnabled && isPinSet ? (
                    <Lock className="w-4 h-4" />
                  ) : (
                    <Unlock className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Kunci PIN 6 Digit
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    {config.isPinEnabled && isPinSet
                      ? 'Aplikasi terkunci saat ditinggalkan'
                      : 'Kunci aplikasi sedang nonaktif'}
                  </span>
                </div>
              </div>

              {/* Toggle Switch */}
              <button
                type="button"
                onClick={handleTogglePin}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  config.isPinEnabled && isPinSet ? 'bg-sky-500' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    config.isPinEnabled && isPinSet ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Actions when PIN is Enabled */}
            {config.isPinEnabled && isPinSet && (
              <div className="space-y-3 pt-1 animate-in fade-in">
                {/* Change PIN Button */}
                <button
                  type="button"
                  onClick={handleChangePin}
                  className="w-full flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                      <KeyRound className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Ubah PIN 6 Digit
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                {/* Auto Lock Delay Options */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Waktu Kunci Otomatis
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { label: 'Langsung', val: 0 },
                      { label: '1 Menit', val: 1 },
                      { label: '5 Menit', val: 5 },
                    ].map((item) => (
                      <button
                        key={item.val}
                        type="button"
                        onClick={() => handleSelectDelay(item.val)}
                        className={`py-1.5 px-2 rounded-xl text-[11px] font-semibold border transition-all ${
                          config.autoLockDelayMinutes === item.val
                            ? 'bg-sky-500 text-white border-sky-500 shadow-xs'
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Test Lock Now Button */}
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onLockNow();
                  }}
                  className="w-full py-2.5 text-xs font-semibold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100 dark:hover:bg-sky-950/70 rounded-2xl border border-sky-100 dark:border-sky-900/40 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Kunci Aplikasi Sekarang</span>
                </button>
              </div>
            )}
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
            >
              Selesai
            </button>
          </div>
        </div>
      </div>

      {/* PIN Setup/Verification Sub-modal */}
      {setupModalMode && (
        <SecurityPinSetupModal
          isOpen={Boolean(setupModalMode)}
          onClose={() => setSetupModalMode(null)}
          mode={setupModalMode}
          onSuccess={handleSetupSuccess}
        />
      )}
    </>
  );
};

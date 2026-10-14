import React, { useState } from 'react';
import { Lock, Fingerprint, Delete, ShieldCheck } from 'lucide-react';

interface PinLockModalProps {
  onUnlock: (pin: string) => boolean;
}

export const PinLockModal: React.FC<PinLockModalProps> = ({ onUnlock }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError(false);

      if (nextPin.length === 4) {
        setTimeout(() => {
          const success = onUnlock(nextPin);
          if (!success) {
            setError(true);
            setPin('');
          }
        }, 120);
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(false);
  };

  const handleBiometric = () => {
    // Simulate webauthn / biometric success
    onUnlock('1234');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-lg flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl p-8 shadow-2xl text-center border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-800">
          <Lock className="w-7 h-7" />
        </div>

        <h2 className="text-xl font-bold text-slate-900 mb-1">
          KeluargaFin Proteksi
        </h2>
        <p className="text-xs text-slate-500 mb-6">
          Masukkan 4 digit PIN lokal atau gunakan sensor biometrik
        </p>

        {/* PIN Dots */}
        <div className={`flex justify-center gap-4 mb-8 ${error ? 'animate-shake' : ''}`}>
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className={`w-3.5 h-3.5 rounded-full transition-all duration-150 ${
                index < pin.length
                  ? 'bg-slate-900 scale-110'
                  : 'bg-slate-200'
              } ${error ? 'bg-rose-500' : ''}`}
            />
          ))}
        </div>

        {error && (
          <p className="text-xs text-rose-600 font-medium -mt-4 mb-6">
            PIN salah. Coba lagi (PIN default demo: 1234)
          </p>
        )}

        {/* Number Pad */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              onClick={() => handleDigit(digit)}
              className="h-14 rounded-2xl bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-xl font-semibold text-slate-800 transition-colors flex items-center justify-center"
            >
              {digit}
            </button>
          ))}

          {/* Biometrics */}
          <button
            onClick={handleBiometric}
            className="h-14 rounded-2xl bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 text-emerald-700 transition-colors flex items-center justify-center"
            title="Buka dengan Biometrik"
          >
            <Fingerprint className="w-6 h-6" />
          </button>

          {/* Zero */}
          <button
            onClick={() => handleDigit('0')}
            className="h-14 rounded-2xl bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-xl font-semibold text-slate-800 transition-colors flex items-center justify-center"
          >
            0
          </button>

          {/* Backspace */}
          <button
            onClick={handleDelete}
            className="h-14 rounded-2xl bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-600 transition-colors flex items-center justify-center"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Tersimpan aman di Storage Lokal Klien</span>
        </div>
      </div>
    </div>
  );
};

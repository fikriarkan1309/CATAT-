import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { setDevicePin, verifyDevicePin, disableDevicePin } from '../lib/deviceSecurity';

export type PinSetupMode = 'create' | 'change' | 'disable';

interface SecurityPinSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: PinSetupMode;
  onSuccess: (message: string) => void;
}

export const SecurityPinSetupModal: React.FC<SecurityPinSetupModalProps> = ({
  isOpen,
  onClose,
  mode,
  onSuccess,
}) => {
  // Steps:
  // create: 1 = enter new, 2 = confirm new
  // change: 1 = enter old, 2 = enter new, 3 = confirm new
  // disable: 1 = enter current to disable
  const [step, setStep] = useState<number>(1);
  const [pin, setPin] = useState<string>('');
  const [firstEnteredPin, setFirstEnteredPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  if (!isOpen) return null;

  const resetAll = () => {
    setStep(1);
    setPin('');
    setFirstEnteredPin('');
    setErrorMsg('');
    setIsProcessing(false);
  };

  const handleClose = () => {
    resetAll();
    onClose();
  };

  const handleDigit = async (digit: string) => {
    if (isProcessing || pin.length >= 6) return;

    const nextPin = pin + digit;
    setPin(nextPin);
    setErrorMsg('');

    if (nextPin.length === 6) {
      setIsProcessing(true);

      setTimeout(async () => {
        if (mode === 'create') {
          if (step === 1) {
            // Move to confirmation step
            setFirstEnteredPin(nextPin);
            setPin('');
            setStep(2);
            setIsProcessing(false);
          } else if (step === 2) {
            // Verify match
            if (nextPin === firstEnteredPin) {
              const ok = await setDevicePin(nextPin);
              if (ok) {
                resetAll();
                onSuccess('Kunci PIN 6 digit berhasil diaktifkan!');
              } else {
                setErrorMsg('Gagal menyimpan PIN. Coba lagi.');
                setPin('');
                setIsProcessing(false);
              }
            } else {
              setErrorMsg('Konfirmasi PIN tidak cocok. Ulangi pembuatan PIN.');
              setPin('');
              setFirstEnteredPin('');
              setStep(1);
              setIsProcessing(false);
            }
          }
        } else if (mode === 'disable') {
          // Verify current PIN to disable
          const isValid = await verifyDevicePin(nextPin);
          if (isValid) {
            disableDevicePin();
            resetAll();
            onSuccess('Kunci PIN berhasil dinonaktifkan.');
          } else {
            setErrorMsg('PIN salah. Tidak dapat menonaktifkan kunci.');
            setPin('');
            setIsProcessing(false);
          }
        } else if (mode === 'change') {
          if (step === 1) {
            // Verify old PIN
            const isValid = await verifyDevicePin(nextPin);
            if (isValid) {
              setPin('');
              setStep(2);
              setIsProcessing(false);
            } else {
              setErrorMsg('PIN lama salah.');
              setPin('');
              setIsProcessing(false);
            }
          } else if (step === 2) {
            // First enter of new PIN
            setFirstEnteredPin(nextPin);
            setPin('');
            setStep(3);
            setIsProcessing(false);
          } else if (step === 3) {
            // Confirm new PIN
            if (nextPin === firstEnteredPin) {
              const ok = await setDevicePin(nextPin);
              if (ok) {
                resetAll();
                onSuccess('PIN 6 digit berhasil diperbarui!');
              } else {
                setErrorMsg('Gagal memperbarui PIN.');
                setPin('');
                setIsProcessing(false);
              }
            } else {
              setErrorMsg('Konfirmasi PIN tidak cocok. Ulangi pembuatan PIN.');
              setPin('');
              setFirstEnteredPin('');
              setStep(2);
              setIsProcessing(false);
            }
          }
        }
      }, 150);
    }
  };

  const handleDelete = () => {
    if (isProcessing) return;
    setPin((prev) => prev.slice(0, -1));
    setErrorMsg('');
  };

  // Title matching user's design style
  let title = 'Masukkan PIN kamu';
  let subtitle = '';

  if (mode === 'create') {
    if (step === 1) {
      title = 'Masukkan PIN baru kamu';
      subtitle = 'Tentukan 6 digit angka untuk mengunci aplikasi di HP ini';
    } else {
      title = 'Konfirmasi PIN kamu';
      subtitle = 'Ketik ulang 6 digit PIN untuk verifikasi';
    }
  } else if (mode === 'change') {
    if (step === 1) {
      title = 'Masukkan PIN lama kamu';
      subtitle = 'Verifikasi PIN yang sedang aktif';
    } else if (step === 2) {
      title = 'Masukkan PIN baru kamu';
      subtitle = 'Tentukan 6 digit PIN baru yang Anda inginkan';
    } else {
      title = 'Konfirmasi PIN kamu';
      subtitle = 'Ketik ulang 6 digit PIN baru';
    }
  } else if (mode === 'disable') {
    title = 'Masukkan PIN kamu';
    subtitle = 'Masukkan PIN saat ini untuk mematikan kunci';
  }

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-b from-[#38bcfb] via-[#1691e8] to-[#0867bd] flex flex-col items-center justify-between py-12 px-6 select-none font-sans overflow-y-auto animate-in fade-in duration-200">
      
      {/* Top Header Section */}
      <div className="w-full flex flex-col items-center pt-4 sm:pt-8">
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-wide text-center drop-shadow-xs">
          {title}
        </h1>

        {subtitle && (
          <p className="text-xs text-white/80 font-medium text-center mt-1">
            {subtitle}
          </p>
        )}

        {/* 6 Dots Indicator */}
        <div className={`flex items-center justify-center gap-3.5 my-6 ${errorMsg ? 'animate-bounce' : ''}`}>
          {[0, 1, 2, 3, 4, 5].map((index) => {
            const isFilled = index < pin.length;
            return (
              <div
                key={index}
                className={`w-3 h-3 rounded-full transition-all duration-150 ${
                  isFilled
                    ? 'bg-white scale-125 shadow-[0_0_10px_rgba(255,255,255,0.9)]'
                    : 'bg-white/60'
                } ${errorMsg ? 'bg-rose-300' : ''}`}
              />
            );
          })}
        </div>

        {/* Error Feedback */}
        {errorMsg && (
          <div className="flex items-center justify-center gap-1.5 text-xs text-rose-100 bg-rose-600/40 px-3.5 py-1.5 rounded-full -mt-2 mb-2 animate-in fade-in backdrop-blur-xs text-center max-w-xs">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span className="font-medium">{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Main 3x4 Keypad matching attached design */}
      <div className="w-full max-w-[280px] sm:max-w-[300px] flex flex-col items-center my-auto">
        <div className="grid grid-cols-3 gap-x-5 gap-y-4 sm:gap-x-6 sm:gap-y-5 w-full place-items-center">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              disabled={isProcessing}
              onClick={() => handleDigit(digit)}
              className="relative w-[76px] h-[76px] sm:w-[82px] sm:h-[82px] rounded-[28px] bg-gradient-to-b from-white via-white to-[#e4f1fa] shadow-[0_8px_18px_rgba(2,100,180,0.35),0_2px_4px_rgba(0,0,0,0.06)] active:scale-95 active:shadow-[0_2px_8px_rgba(2,100,180,0.3)] transition-all flex items-center justify-center text-3xl font-bold text-slate-800 select-none overflow-hidden cursor-pointer"
            >
              {/* Glossy curved light reflection on top */}
              <div className="absolute top-1 left-2.5 right-2.5 h-6 rounded-t-[22px] bg-gradient-to-b from-white/90 to-transparent pointer-events-none" />
              <span className="relative z-10">{digit}</span>
            </button>
          ))}

          {/* Column 1 on bottom row: spacer */}
          <div className="w-[76px] h-[76px] sm:w-[82px] sm:h-[82px]" />

          {/* Column 2 on bottom row: 0 */}
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => handleDigit('0')}
            className="relative w-[76px] h-[76px] sm:w-[82px] sm:h-[82px] rounded-[28px] bg-gradient-to-b from-white via-white to-[#e4f1fa] shadow-[0_8px_18px_rgba(2,100,180,0.35),0_2px_4px_rgba(0,0,0,0.06)] active:scale-95 active:shadow-[0_2px_8px_rgba(2,100,180,0.3)] transition-all flex items-center justify-center text-3xl font-bold text-slate-800 select-none overflow-hidden cursor-pointer"
          >
            <div className="absolute top-1 left-2.5 right-2.5 h-6 rounded-t-[22px] bg-gradient-to-b from-white/90 to-transparent pointer-events-none" />
            <span className="relative z-10">0</span>
          </button>

          {/* Column 3 on bottom row: Backspace SVG icon */}
          <button
            type="button"
            onClick={handleDelete}
            className="w-[76px] h-[76px] sm:w-[82px] sm:h-[82px] flex items-center justify-center active:scale-90 transition-transform cursor-pointer"
            title="Hapus Digit"
          >
            <svg
              width="36"
              height="28"
              viewBox="0 0 24 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="drop-shadow-xs"
            >
              <path
                d="M7.5 3.5H20C20.5523 3.5 21 3.94772 21 4.5V15.5C21 16.0523 20.5523 16.5 20 16.5H7.5C6.96957 16.5 6.46086 16.2893 6.08579 15.9142L2 11.8284C1.21895 11.0474 1.21895 9.95262 2 9.17157L6.08579 5.08579C6.46086 4.71071 6.96957 4.5 7.5 4.5Z"
                stroke="white"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M11.5 7.5L16.5 12.5M16.5 7.5L11.5 12.5"
                stroke="white"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Bottom Button: BATAL */}
      <div className="w-full flex justify-center pb-2">
        <button
          type="button"
          onClick={handleClose}
          className="border-2 border-white text-white font-bold text-xs tracking-wider uppercase px-10 py-3.5 rounded-full hover:bg-white/15 active:scale-95 transition-all shadow-xs cursor-pointer"
        >
          BATAL
        </button>
      </div>

    </div>
  );
};

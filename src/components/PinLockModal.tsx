import React, { useState } from 'react';
import { Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { verifyDevicePin } from '../lib/deviceSecurity';

interface PinLockModalProps {
  onUnlockSuccess: () => void;
  userEmail?: string;
  onVerifyPassword?: (password: string) => Promise<{ success: boolean; message?: string }>;
}

export const PinLockModal: React.FC<PinLockModalProps> = ({
  onUnlockSuccess,
  userEmail = '',
  onVerifyPassword,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Mode: PIN or Password
  const [isPasswordMode, setIsPasswordMode] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [isCheckingPassword, setIsCheckingPassword] = useState(false);

  const handleDigit = async (digit: string) => {
    if (isVerifying || pin.length >= 6) return;

    const nextPin = pin + digit;
    setPin(nextPin);
    setError(false);
    setErrorMessage('');

    if (nextPin.length === 6) {
      setIsVerifying(true);
      setTimeout(async () => {
        const isValid = await verifyDevicePin(nextPin);
        if (isValid) {
          setError(false);
          onUnlockSuccess();
        } else {
          setError(true);
          setErrorMessage('PIN salah. Coba lagi.');
          setPin('');
        }
        setIsVerifying(false);
      }, 150);
    }
  };

  const handleDelete = () => {
    if (isVerifying) return;
    setPin((prev) => prev.slice(0, -1));
    setError(false);
    setErrorMessage('');
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput.trim()) {
      setPasswordError('Silakan masukkan kata sandi Anda.');
      return;
    }

    setIsCheckingPassword(true);
    setPasswordError('');

    try {
      if (onVerifyPassword) {
        const res = await onVerifyPassword(passwordInput);
        if (res.success) {
          onUnlockSuccess();
        } else {
          setPasswordError(res.message || 'Kata sandi salah. Coba lagi.');
        }
      } else {
        // Fallback demo/generic
        if (passwordInput.length >= 4) {
          onUnlockSuccess();
        } else {
          setPasswordError('Kata sandi salah.');
        }
      }
    } catch (err: any) {
      setPasswordError(err?.message || 'Gagal memverifikasi kata sandi.');
    } finally {
      setIsCheckingPassword(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-b from-[#38bcfb] via-[#1691e8] to-[#0867bd] flex flex-col items-center justify-between py-12 px-6 select-none font-sans overflow-y-auto">
      
      {/* Top Header Section */}
      <div className="w-full flex flex-col items-center pt-4 sm:pt-8 animate-in fade-in duration-300">
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-wide text-center drop-shadow-xs">
          {isPasswordMode ? 'Masukkan Kata Sandi Akun' : 'Masukkan PIN kamu'}
        </h1>

        {!isPasswordMode && (
          <>
            {/* 6 Dots Indicator */}
            <div className={`flex items-center justify-center gap-3.5 my-6 ${error ? 'animate-bounce' : ''}`}>
              {[0, 1, 2, 3, 4, 5].map((index) => {
                const isFilled = index < pin.length;
                return (
                  <div
                    key={index}
                    className={`w-3 h-3 rounded-full transition-all duration-150 ${
                      isFilled
                        ? 'bg-white scale-125 shadow-[0_0_10px_rgba(255,255,255,0.9)]'
                        : 'bg-white/60'
                    } ${error ? 'bg-rose-300' : ''}`}
                  />
                );
              })}
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center justify-center gap-1.5 text-xs text-rose-100 bg-rose-600/40 px-3 py-1 rounded-full -mt-2 mb-2 animate-in fade-in backdrop-blur-xs">
                <AlertCircle className="w-3.5 h-3.5" />
                <span className="font-medium">{errorMessage}</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Main Center Area: Keypad or Password Form */}
      {!isPasswordMode ? (
        /* 3x4 Keypad matching attached design */
        <div className="w-full max-w-[280px] sm:max-w-[300px] flex flex-col items-center my-auto animate-in fade-in duration-200">
          <div className="grid grid-cols-3 gap-x-5 gap-y-4 sm:gap-x-6 sm:gap-y-5 w-full place-items-center">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                disabled={isVerifying}
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
              disabled={isVerifying}
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
      ) : (
        /* Password Fallback View */
        <div className="w-full max-w-sm my-auto bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20 text-white animate-in zoom-in-95 duration-200">
          <p className="text-xs text-white/90 text-center mb-4 leading-relaxed">
            {userEmail ? (
              <>
                Masukkan kata sandi untuk akun <br />
                <span className="font-bold text-white underline">{userEmail}</span>
              </>
            ) : (
              'Masukkan kata sandi akun Anda untuk membuka kunci aplikasi'
            )}
          </p>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                autoFocus
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  setPasswordError('');
                }}
                placeholder="Kata Sandi Akun"
                className="w-full px-4 py-3 bg-white/90 text-slate-900 rounded-2xl text-sm placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-white pr-11 shadow-inner"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 p-1"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {passwordError && (
              <div className="p-2.5 rounded-xl bg-rose-500/80 text-white text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isCheckingPassword}
              className="w-full py-3 bg-white text-sky-700 font-bold text-xs uppercase tracking-wider rounded-2xl hover:bg-sky-50 active:scale-98 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              {isCheckingPassword ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-sky-700" />
                  <span>Memverifikasi...</span>
                </>
              ) : (
                <span>Buka Kunci</span>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Bottom Button */}
      <div className="w-full flex justify-center pb-2 animate-in fade-in duration-300">
        {!isPasswordMode ? (
          <button
            type="button"
            onClick={() => {
              setIsPasswordMode(true);
              setPasswordError('');
              setPasswordInput('');
            }}
            className="border-2 border-white text-white font-bold text-xs tracking-wider uppercase px-8 py-3.5 rounded-full hover:bg-white/15 active:scale-95 transition-all shadow-xs cursor-pointer"
          >
            GUNAKAN PASSWORD
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setIsPasswordMode(false);
              setPasswordError('');
            }}
            className="border-2 border-white text-white font-bold text-xs tracking-wider uppercase px-8 py-3 rounded-full hover:bg-white/15 active:scale-95 transition-all shadow-xs cursor-pointer"
          >
            KEMBALI KE PIN
          </button>
        )}
      </div>

    </div>
  );
};

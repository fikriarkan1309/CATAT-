import React from 'react';

export type AppIconName =
  | 'tab-home'
  | 'tab-ringkasan'
  | 'tab-rekening'
  | 'tab-lainnya'
  | 'settings'
  | 'lainnya-perbandingan'
  | 'lainnya-tabungan'
  | 'lainnya-anggaran'
  | 'lainnya-tagihanrutin'
  | 'lainnya-hutangpiutang'
  | 'lainnya-transaksi'
  | 'lainnya-export';

const ICON_MAP: Record<AppIconName, string> = {
  'tab-home': '/icons/tab%20bawah-home.svg',
  'tab-ringkasan': '/icons/tab%20bawah-ringkasan.svg',
  'tab-rekening': '/icons/tab%20bawah-rekening.svg',
  'tab-lainnya': '/icons/tab%20bawah-lainnya.svg',
  'settings': '/icons/settings.svg',
  'lainnya-perbandingan': '/icons/lainnya-perbandingan.svg',
  'lainnya-tabungan': '/icons/lainnya-tabungan.svg',
  'lainnya-anggaran': '/icons/lainnya-anggaran.svg',
  'lainnya-tagihanrutin': '/icons/lainnya-tagihanrutin.svg',
  'lainnya-hutangpiutang': '/icons/lainnya-hutangpiutang.svg',
  'lainnya-transaksi': '/icons/lainnya-transaksi.svg',
  'lainnya-export': '/icons/lainnya-export.svg',
};

interface AppIconProps {
  name: AppIconName;
  className?: string;
  style?: React.CSSProperties;
}

export const AppIcon: React.FC<AppIconProps> = ({ name, className = 'w-6 h-6', style }) => {
  const src = ICON_MAP[name];

  return (
    <span
      className={`inline-block shrink-0 bg-current ${className}`}
      style={{
        maskImage: `url("${src}")`,
        WebkitMaskImage: `url("${src}")`,
        maskSize: 'contain',
        WebkitMaskSize: 'contain',
        maskRepeat: 'no-repeat',
        WebkitMaskRepeat: 'no-repeat',
        maskPosition: 'center',
        WebkitMaskPosition: 'center',
        ...style,
      }}
      aria-hidden="true"
    />
  );
};

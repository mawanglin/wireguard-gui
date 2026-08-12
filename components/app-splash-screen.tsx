'use client';

import Image from 'next/image';
import { useTranslation } from 'react-i18next';

export function AppSplashScreen() {
  const { t } = useTranslation();

  return (
    <div
      className="bg-background w-full h-full backdrop-blur-lg fixed z-50 flex size-full items-center justify-center"
      data-testid="app-splash"
    >
      <Image
        className="animate-pulse select-none"
        alt={t('app.logoAlt')}
        src="/img/wireguard.png"
        width={200}
        height={200}
        loading="eager"
      />
    </div>
  );
}

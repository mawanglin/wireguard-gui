'use client';

import { useCallback } from 'react';
import { Check, Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import {
  LOCALE_NATIVE_NAMES,
  SUPPORTED_LOCALES,
  type Locale,
} from '@/lib/i18n/config';
import { storeLocale } from '@/lib/i18n/detect';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation();

  const onSelect = useCallback(
    (locale: Locale) => () => {
      storeLocale(locale);
      void i18n.changeLanguage(locale);
    },
    [i18n],
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          title={t('language.switcherTitle')}
          variant="outline"
          size="icon"
          data-testid="language-switcher"
        >
          <Languages className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {SUPPORTED_LOCALES.map((locale) => (
          <DropdownMenuItem
            key={locale}
            onClick={onSelect(locale)}
            data-testid={`language-option-${locale}`}
          >
            <Check
              className={
                i18n.language === locale ? 'size-4' : 'size-4 opacity-0'
              }
            />
            {LOCALE_NATIVE_NAMES[locale]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

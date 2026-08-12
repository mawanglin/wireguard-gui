import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import type { CommandError } from '@/lib/effects';

import en from './locales/en.json';

type ErrorKey = keyof typeof en.errors;

function isErrorKey(code: string): code is ErrorKey {
  return code in en.errors;
}

/**
 * 把后端 CommandError 转成本地化消息。
 * 未收录的错误码回落到后端返回的原始消息，再回落到「未知错误」，
 * 因此后端新增错误码时前端无需改代码。
 */
export function useErrorMessage() {
  const { t } = useTranslation();

  return useCallback(
    (error: CommandError) => {
      if (error.code && isErrorKey(error.code)) {
        return t(`errors.${error.code}`);
      }
      return error.message || t('errors.unknown');
    },
    [t],
  );
}

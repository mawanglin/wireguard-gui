import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import type { CommandError } from '@/lib/effects';

import en from './locales/en.json';
import { composeErrorText } from './message';

type ErrorKey = keyof typeof en.errors;

function isErrorKey(code: string): code is ErrorKey {
  return code in en.errors;
}

/**
 * 把后端 CommandError 转成本地化消息。
 *
 * 对消息中携带底层原因的错误码（如 `Failed to write profile: {e}`），
 * 在译文后另起一行附上该原因，避免本地化把诊断信息吃掉。
 * 未收录的错误码回落到后端返回的原始消息，再回落到「未知错误」，
 * 因此后端新增错误码时前端无需改代码。
 */
export function useErrorMessage() {
  const { t } = useTranslation();

  return useCallback(
    (error: CommandError) => {
      if (error.code && isErrorKey(error.code)) {
        return composeErrorText(
          t(`errors.${error.code}`),
          error.code,
          error.message,
        );
      }
      return error.message || t('errors.unknown');
    },
    [t],
  );
}

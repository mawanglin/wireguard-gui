'use client';

import { useEffect } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { useTranslation } from 'react-i18next';

import '@/lib/i18n';

import { resolveLocale } from '@/lib/i18n/detect';

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const { t, i18n } = useTranslation();

  // 挂载后再解析语言。首帧必须与预渲染 HTML 使用同一语言，
  // 否则会触发 React 水合不匹配。
  useEffect(() => {
    const resolved = resolveLocale();
    if (resolved !== i18n.language) {
      void i18n.changeLanguage(resolved);
    }
  }, [i18n]);

  // <html lang> 由服务端静态渲染为 en，需在客户端同步为当前语言
  useEffect(() => {
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  // 窗口标题跟随语言变化
  useEffect(() => {
    getCurrentWindow()
      .setTitle(t('app.windowTitle'))
      .catch(() => {
        // 非 Tauri 运行环境（如浏览器中打开静态产物）忽略即可
      });
  }, [t, i18n.language]);

  return <>{children}</>;
}

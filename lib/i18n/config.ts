export const SUPPORTED_LOCALES = ['en', 'zh-CN', 'zh-TW', 'ja', 'ru'] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

/**
 * 构建期预渲染使用的语言。客户端首次渲染必须与之一致，
 * 否则静态导出的 HTML 会触发 React 水合不匹配。
 */
export const DEFAULT_LOCALE: Locale = 'en';

export const STORAGE_KEY = 'wg-gui-locale';

/** 语言名始终以该语言自身书写，不随界面语言变化。 */
export const LOCALE_NATIVE_NAMES: Record<Locale, string> = {
  en: 'English',
  'zh-CN': '简体中文',
  'zh-TW': '繁體中文',
  ja: '日本語',
  ru: 'Русский',
};

export function isLocale(value: string): value is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

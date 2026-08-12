import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { DEFAULT_LOCALE } from './config';
import en from './locales/en.json';
import ja from './locales/ja.json';
import ru from './locales/ru.json';
import zhCN from './locales/zh-CN.json';
import zhTW from './locales/zh-TW.json';

export const resources = {
  en: { translation: en },
  'zh-CN': { translation: zhCN },
  'zh-TW': { translation: zhTW },
  ja: { translation: ja },
  ru: { translation: ru },
} as const;

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources,
    // 必须固定为 DEFAULT_LOCALE：静态导出的 HTML 以该语言预渲染，
    // 客户端首帧必须与之一致，实际语言在 I18nProvider 挂载后再切换。
    lng: DEFAULT_LOCALE,
    fallbackLng: DEFAULT_LOCALE,
    interpolation: {
      // React 自身已对插值做转义
      escapeValue: false,
    },
  });
}

export default i18n;

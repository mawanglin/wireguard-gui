// 显式带 .ts 扩展名：本模块的纯函数部分由 `node --test` 直接运行，
// Node 的 ESM 解析不做扩展名推导。tsconfig 已开启 allowImportingTsExtensions。
import {
  DEFAULT_LOCALE,
  isLocale,
  STORAGE_KEY,
  SUPPORTED_LOCALES,
  type Locale,
} from './config.ts';

const LOWER_TO_LOCALE = new Map<string, Locale>(
  SUPPORTED_LOCALES.map((locale) => [locale.toLowerCase(), locale]),
);

/**
 * 把一个 BCP 47 语言标签映射到受支持的语言，映射不上返回 null。
 * 纯函数，不读取任何浏览器全局。
 */
function matchOne(tag: string): Locale | null {
  const lower = tag.toLowerCase();

  const exact = LOWER_TO_LOCALE.get(lower);
  if (exact) {
    return exact;
  }

  const subtags = lower.split('-');

  if (subtags[0] === 'zh') {
    // 繁体：显式 Hant 文字标签，或港澳台地区标签
    const isTraditional =
      subtags.includes('hant') ||
      subtags.includes('tw') ||
      subtags.includes('hk') ||
      subtags.includes('mo');
    return isTraditional ? 'zh-TW' : 'zh-CN';
  }

  // 主语言标签命中（ja-JP → ja、en-GB → en）
  const primary = LOWER_TO_LOCALE.get(subtags[0]);
  return primary ?? null;
}

/** 按优先级遍历候选标签，返回第一个能匹配上的语言。 */
export function matchLocale(tags: readonly string[]): Locale {
  for (const tag of tags) {
    const matched = matchOne(tag);
    if (matched) {
      return matched;
    }
  }
  return DEFAULT_LOCALE;
}

export function readStoredLocale(): Locale | null {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored && isLocale(stored) ? stored : null;
  } catch {
    // localStorage 在部分受限环境下会抛异常，静默回落到系统语言
    return null;
  }
}

export function storeLocale(locale: Locale): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // 写入失败不影响当次会话的语言切换
  }
}

/** 解析当前应使用的语言：手动选择 → 系统语言 → 默认语言。 */
export function resolveLocale(): Locale {
  const stored = readStoredLocale();
  if (stored) {
    return stored;
  }
  const navigatorTags =
    typeof navigator === 'undefined'
      ? []
      : (navigator.languages ?? [navigator.language]).filter(Boolean);
  return matchLocale(navigatorTags);
}

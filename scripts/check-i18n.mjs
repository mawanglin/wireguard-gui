import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const LOCALES_DIR = join(ROOT, 'lib', 'i18n', 'locales');
const RUST_SRC_DIR = join(ROOT, 'src-tauri', 'src');
const BASE_LOCALE = 'en';
const LOCALES = ['en', 'zh-CN', 'zh-TW', 'ja', 'ru'];

const PLURAL_SUFFIXES = ['zero', 'one', 'two', 'few', 'many', 'other'];

function load(locale) {
  return JSON.parse(readFileSync(join(LOCALES_DIR, `${locale}.json`), 'utf8'));
}

/** 把嵌套对象拍平成 'a.b.c' 形式的 key 列表。 */
function flatten(node, prefix = '') {
  const keys = [];
  for (const [key, value] of Object.entries(node)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      keys.push(...flatten(value, path));
    } else if (typeof value === 'string') {
      keys.push(path);
    } else {
      throw new Error(`词条 ${path} 的值必须是字符串或对象`);
    }
  }
  return keys;
}

function splitPlural(key) {
  const index = key.lastIndexOf('_');
  if (index === -1) {
    return null;
  }
  const suffix = key.slice(index + 1);
  return PLURAL_SUFFIXES.includes(suffix)
    ? { base: key.slice(0, index), suffix }
    : null;
}

/** 依据基准语言的 key 集合，推导某语言应有的完整 key 集合。 */
function expectedKeys(baseKeys, locale) {
  const categories = new Intl.PluralRules(locale, {
    type: 'cardinal',
  }).resolvedOptions().pluralCategories;

  const expected = new Set();
  for (const key of baseKeys) {
    const plural = splitPlural(key);
    if (plural) {
      for (const category of categories) {
        expected.add(`${plural.base}_${category}`);
      }
    } else {
      expected.add(key);
    }
  }
  return expected;
}

/** 提取词条中的插值变量名，用于跨语言比对。 */
function interpolations(value) {
  return [...value.matchAll(/\{\{(\w+)\}\}/g)]
    .map((match) => match[1])
    .sort()
    .join(',');
}

function flattenEntries(node, prefix = '') {
  const entries = [];
  for (const [key, value] of Object.entries(node)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      entries.push(...flattenEntries(value, path));
    } else {
      entries.push([path, value]);
    }
  }
  return entries;
}

function stripPluralSuffix(key) {
  const plural = splitPlural(key);
  return plural ? plural.base : key;
}

const base = load(BASE_LOCALE);
const baseKeys = flatten(base);

// 基准语言中每个词条基名对应的插值变量集合
const baseInterpolations = new Map(
  flattenEntries(base).map(([key, value]) => [
    stripPluralSuffix(key),
    interpolations(value),
  ]),
);

let failed = false;

for (const locale of LOCALES) {
  const data = load(locale);
  const actual = new Set(flatten(data));
  const expected = expectedKeys(baseKeys, locale);

  const missing = [...expected].filter((k) => !actual.has(k)).sort();
  const extra = [...actual].filter((k) => !expected.has(k)).sort();

  const mismatched = [];
  for (const [key, value] of flattenEntries(data)) {
    const expectedVars = baseInterpolations.get(stripPluralSuffix(key));
    const actualVars = interpolations(value);
    if (expectedVars !== undefined && expectedVars !== actualVars) {
      mismatched.push({ key, expectedVars, actualVars });
    }
  }

  if (missing.length === 0 && extra.length === 0 && mismatched.length === 0) {
    console.log(`✓ ${locale}：${actual.size} 条`);
    continue;
  }

  failed = true;
  console.error(`✗ ${locale}`);
  for (const key of missing) {
    console.error(`    缺失: ${key}`);
  }
  for (const key of extra) {
    console.error(`    多余: ${key}`);
  }
  for (const { key, expectedVars, actualVars } of mismatched) {
    console.error(
      `    插值不符: ${key} 期望 [${expectedVars || '无'}]，实际 [${actualVars || '无'}]`,
    );
  }
}

// 交叉核对：Rust 后端抛出的错误码必须都有词条，否则用户会看到英文原文。
const rustSource = readdirSync(RUST_SRC_DIR)
  .filter((file) => file.endsWith('.rs'))
  .map((file) => readFileSync(join(RUST_SRC_DIR, file), 'utf8'))
  .join('\n');

const backendCodes = new Set(
  [...rustSource.matchAll(/coded\(\s*"([a-z_]+)"/g)].map((match) => match[1]),
);
const translatedCodes = new Set(
  Object.keys(base.errors ?? {}).filter((code) => code !== 'unknown'),
);

const untranslatedCodes = [...backendCodes]
  .filter((code) => !translatedCodes.has(code))
  .sort();
const staleCodes = [...translatedCodes]
  .filter((code) => !backendCodes.has(code))
  .sort();

if (untranslatedCodes.length > 0) {
  failed = true;
  console.error(`\n✗ 后端错误码未翻译（用户会看到英文原文）`);
  for (const code of untranslatedCodes) {
    console.error(`    ${code}`);
  }
} else if (staleCodes.length > 0) {
  console.warn(`\n⚠ 有词条但后端已不再抛出，可考虑清理：`);
  for (const code of staleCodes) {
    console.warn(`    ${code}`);
  }
} else {
  console.log(`\n✓ 后端 ${backendCodes.size} 个错误码全部有词条`);
}

if (failed) {
  console.error('\n词条校验未通过。以 en.json 为基准补齐。');
  process.exit(1);
}

console.log('\n词条校验通过。');

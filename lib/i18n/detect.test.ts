import assert from 'node:assert/strict';
import { test } from 'node:test';

import { matchLocale } from './detect.ts';

test('精确命中支持列表', () => {
  assert.equal(matchLocale(['zh-TW']), 'zh-TW');
  assert.equal(matchLocale(['ru']), 'ru');
});

test('繁体变体降级到 zh-TW', () => {
  assert.equal(matchLocale(['zh-HK']), 'zh-TW');
  assert.equal(matchLocale(['zh-MO']), 'zh-TW');
  assert.equal(matchLocale(['zh-Hant']), 'zh-TW');
  assert.equal(matchLocale(['zh-Hant-HK']), 'zh-TW');
});

test('其余中文变体降级到 zh-CN', () => {
  assert.equal(matchLocale(['zh']), 'zh-CN');
  assert.equal(matchLocale(['zh-Hans']), 'zh-CN');
  assert.equal(matchLocale(['zh-SG']), 'zh-CN');
});

test('主语言标签命中', () => {
  assert.equal(matchLocale(['ja-JP']), 'ja');
  assert.equal(matchLocale(['ru-RU']), 'ru');
  assert.equal(matchLocale(['en-GB']), 'en');
});

test('大小写不敏感', () => {
  assert.equal(matchLocale(['ZH-hant-tw']), 'zh-TW');
  assert.equal(matchLocale(['JA']), 'ja');
});

test('按顺序取第一个能匹配上的', () => {
  assert.equal(matchLocale(['ko', 'de', 'ja-JP']), 'ja');
});

test('全部不匹配时回落 en', () => {
  assert.equal(matchLocale(['ko', 'de']), 'en');
  assert.equal(matchLocale([]), 'en');
});

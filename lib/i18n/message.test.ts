import assert from 'node:assert/strict';
import { test } from 'node:test';

import { carriesDetail, composeErrorText, extractDetail } from './message.ts';

test('提取冒号之后的底层原因', () => {
  assert.equal(
    extractDetail('Failed to write profile: Permission denied (os error 13)'),
    'Permission denied (os error 13)',
  );
});

test('多个冒号时只按第一个切分，保留其余内容', () => {
  assert.equal(
    extractDetail('Failed to run wg.sh: exit 1: nmcli not found'),
    'exit 1: nmcli not found',
  );
});

test('无冒号或空消息返回空串', () => {
  assert.equal(extractDetail('Incorrect PIN'), '');
  assert.equal(extractDetail(''), '');
  assert.equal(extractDetail(undefined), '');
});

test('冒号后为空白时返回空串', () => {
  assert.equal(extractDetail('Failed to write profile:   '), '');
});

test('只有带原因的错误码才追加底层原因', () => {
  assert.equal(carriesDetail('profile_write_failed'), true);
  assert.equal(carriesDetail('pin_incorrect'), false);
});

test('组合时用换行分隔', () => {
  assert.equal(
    composeErrorText(
      '写入配置失败。',
      'profile_write_failed',
      'Failed to write profile: Permission denied',
    ),
    '写入配置失败。\nPermission denied',
  );
});

test('自足消息的错误码不受影响', () => {
  assert.equal(
    composeErrorText('安全 PIN 码不正确。', 'pin_incorrect', 'Incorrect PIN'),
    '安全 PIN 码不正确。',
  );
});

test('带原因的错误码但后端没给原因时不留悬挂分隔符', () => {
  assert.equal(
    composeErrorText('写入配置失败。', 'profile_write_failed', undefined),
    '写入配置失败。',
  );
});

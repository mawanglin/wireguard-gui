/**
 * 后端消息里携带底层原因的错误码。
 *
 * 这些码的 Rust 侧消息形如 `Failed to write profile: {e}`，冒号后的内容
 * 是操作系统或加密库给出的真实原因，翻译时不能丢。其余错误码的消息是
 * 自足的整句，不做任何提取。
 */
export const DETAILED_ERROR_CODES = [
  'profile_read_failed',
  'profile_write_failed',
  'profile_encrypt_failed',
  'profile_decrypt_failed',
  'profile_dir_read_failed',
  'script_exec_failed',
  'security_config_invalid',
  'security_config_write_failed',
  'security_disable_failed',
  'security_setup_failed',
  'state_write_failed',
] as const;

const DETAILED = new Set<string>(DETAILED_ERROR_CODES);

export function carriesDetail(code: string): boolean {
  return DETAILED.has(code);
}

/**
 * 取出后端消息中冒号之后的底层原因。
 * 没有冒号、或冒号后为空时返回空串。
 */
export function extractDetail(message: string | undefined): string {
  if (!message) {
    return '';
  }
  const index = message.indexOf(': ');
  if (index === -1) {
    return '';
  }
  return message.slice(index + 2).trim();
}

/**
 * 组合本地化文案与底层原因。
 * 用换行分隔，避免各语言标点差异；toast 的 description 已支持多行。
 */
export function composeErrorText(
  localized: string,
  code: string,
  rawMessage: string | undefined,
): string {
  if (!carriesDetail(code)) {
    return localized;
  }
  const detail = extractDetail(rawMessage);
  return detail ? `${localized}\n${detail}` : localized;
}

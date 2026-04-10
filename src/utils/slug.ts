/**
 * 슬러그 살균 유틸리티
 * 공백·마침표·특수문자를 하이픈으로 치환, 다국어(한/영/일/중) 지원
 */
export function sanitizeSlug(input: string): string {
  return input
    .trim()
    .replace(/[\s.]+/g, '-')                                  // 공백·마침표 → 하이픈
    .replace(/[^a-zA-Z0-9가-힣\u3040-\u30FF\u4E00-\u9FAF\-]/g, '')  // 허용 외 문자 제거
    .replace(/-{2,}/g, '-')                                   // 연속 하이픈 → 단일 하이픈
    .replace(/^-|-$/g, '');                                   // 앞뒤 하이픈 제거
}

/**
 * 슬러그가 살균 기준을 충족하는지 검사
 */
export function isCleanSlug(slug: string): boolean {
  return slug === sanitizeSlug(slug);
}

// Only allow http(s) links from user- or admin-entered data; anything else
// (javascript:, data:, vbscript:) is dropped so it can't run in a member's session.
export function safeUrl(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value.trim(), typeof window === 'undefined' ? 'https://localhost' : window.location.origin);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : undefined;
  } catch {
    return undefined;
  }
}

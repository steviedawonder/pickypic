/**
 * The 예약 발행 field is an <input type="datetime-local">: its value has no
 * time zone ("2026-10-30T09:30"). Stored as-is, the site's
 * `publishedAt <= now()` filters compared it as text against a UTC timestamp,
 * so a post published at 09:30 KST stayed hidden until 18:30 KST while the
 * editor had already asked search engines to crawl it. Store UTC instead.
 */

/** datetime-local value (the admin's local time) -> UTC ISO string for Sanity. */
export function publishDateToIso(local: string): string {
  const t = local ? new Date(local) : new Date();
  return Number.isNaN(t.getTime()) ? new Date().toISOString() : t.toISOString();
}

/**
 * Stored value -> datetime-local value in the admin's local time. Handles UTC
 * ISO strings, the older zone-less local strings, and date-only values (which
 * the previous loader produced by cutting the time off).
 */
export function isoToPublishDateInput(stored?: string | null): string {
  if (!stored) return '';
  const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(stored) ? `${stored}T00:00` : stored);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

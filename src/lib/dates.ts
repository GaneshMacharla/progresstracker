// Dates are local calendar days in YYYY-MM-DD form. Arithmetic goes through
// UTC so DST shifts never produce off-by-one day counts.

export function todayISO(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function toUTC(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

export function addDays(iso: string, n: number): string {
  return new Date(toUTC(iso) + n * 86400000).toISOString().slice(0, 10);
}

export function diffDays(from: string, to: string): number {
  return Math.round((toUTC(to) - toUTC(from)) / 86400000);
}

export function formatDate(
  iso: string,
  opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' },
): string {
  return new Date(toUTC(iso)).toLocaleDateString('en-IN', { ...opts, timeZone: 'UTC' });
}

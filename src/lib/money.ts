const whole = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
const fractional = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** ₹1,00,000 style. Shows paise only when the amount has them. */
export function formatINR(paise: number): string {
  const sign = paise < 0 ? '-' : '';
  const abs = Math.abs(paise);
  const body = abs % 100 === 0 ? whole.format(abs / 100) : fractional.format(abs / 100);
  return `${sign}₹${body}`;
}

/** Short axis labels: ₹1.2L, ₹45K, ₹800. */
export function formatINRCompact(paise: number): string {
  const r = paise / 100;
  if (Math.abs(r) >= 100000) return `₹${trim(r / 100000)}L`;
  if (Math.abs(r) >= 1000) return `₹${trim(r / 1000)}K`;
  return `₹${Math.round(r)}`;
}

function trim(n: number): string {
  return n.toFixed(1).replace(/\.0$/, '');
}

/** Parses input like "5000", "5,000.50" or "₹ 1,00,000" into paise; null if invalid or not positive. */
export function parseRupeesToPaise(input: string): number | null {
  const cleaned = input.replace(/[₹,\s]/g, '');
  if (!/^\d+(\.\d{0,2})?$/.test(cleaned)) return null;
  const paise = Math.round(parseFloat(cleaned) * 100);
  return paise > 0 ? paise : null;
}

export function paiseToRupeesString(paise: number): string {
  return paise % 100 === 0 ? String(paise / 100) : (paise / 100).toFixed(2);
}

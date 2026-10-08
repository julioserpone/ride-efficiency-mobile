const FALLBACK_CURRENCY = 'USD';
const FALLBACK_SYMBOL = '$';

/**
 * Formats a monetary amount. Amounts are stored as decimal strings by the API
 * (`decimal:2` casts), so anything non-numeric falls back to zero instead of
 * rendering `NaN`.
 */
export function formatCurrency(
  amount: number | string | null | undefined,
  currencyCode: string = FALLBACK_CURRENCY,
  currencySymbol?: string | null,
  options: { compact?: boolean } = {},
): string {
  const value = toNumber(amount);

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      currencyDisplay: 'narrowSymbol',
      notation: options.compact ? 'compact' : 'standard',
      maximumFractionDigits: options.compact ? 1 : 2,
    }).format(value);
  } catch {
    // Unknown currency code (a country not seeded in the API yet).
    const prefix = currencySymbol ?? FALLBACK_SYMBOL;

    return `${prefix}${value.toFixed(options.compact ? 1 : 2)}`;
  }
}

/** Formats a distance in kilometres, dropping decimals above 100 km. */
export function formatKm(km: number | string | null | undefined): string {
  const value = toNumber(km);

  return `${value.toLocaleString('en-US', {
    minimumFractionDigits: value < 100 ? 1 : 0,
    maximumFractionDigits: value < 100 ? 1 : 0,
  })} km`;
}

/** Formats a duration given in minutes as `4h 25m`. */
export function formatDuration(minutes: number | string | null | undefined): string {
  const total = Math.round(toNumber(minutes));

  if (total <= 0) {
    return '0m';
  }

  const hours = Math.floor(total / 60);
  const rest = total % 60;

  return hours > 0 ? `${hours}h ${rest}m` : `${rest}m`;
}

/** Formats a signed percentage change, e.g. `+12.4%`. */
export function formatPercent(value: number, fractionDigits = 1): string {
  const sign = value > 0 ? '+' : '';

  return `${sign}${value.toFixed(fractionDigits)}%`;
}

/** `2026-08-01` / ISO timestamps → `Aug 1, 2026`. */
export function formatDate(value: string | null | undefined): string {
  if (!value) {
    return '—';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** ISO timestamp → `Aug 1, 14:05`. */
export function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return '—';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return `${date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })}, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
}

/** Percentage change between two numbers; `null` when there is no baseline. */
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) {
    return null;
  }

  return ((current - previous) / Math.abs(previous)) * 100;
}

export function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined) {
    return 0;
  }

  const parsed = typeof value === 'number' ? value : Number.parseFloat(value);

  return Number.isFinite(parsed) ? parsed : 0;
}

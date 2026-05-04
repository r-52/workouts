/**
 * Parse a human-readable duration string into total seconds.
 *
 * Supported formats:
 *   "1h30m"       → 5400
 *   "10m30s"      → 630
 *   "10m"         → 600
 *   "30s"         → 30
 *   "1:30"        → 90   (mm:ss)
 *   "1:30:00"     → 5400 (hh:mm:ss)
 *   "90"          → 90   (bare number = seconds)
 *
 * Returns NaN if the input cannot be parsed.
 */
export function parseDuration(input: string): number {
  const s = input.trim().toLowerCase();
  if (!s) return NaN;

  // mm:ss or hh:mm:ss
  if (/^\d+:\d+(:\d+)?$/.test(s)) {
    const parts = s.split(':').map(Number);
    if (parts.some(isNaN)) return NaN;
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }

  // Units — h / m / s
  if (/[hms]/.test(s)) {
    let total = 0;
    let matched = false;
    for (const [, n, unit] of s.matchAll(/(\d+(?:\.\d+)?)\s*([hms])/g)) {
      matched = true;
      const v = parseFloat(n);
      if (unit === 'h') total += v * 3600;
      else if (unit === 'm') total += v * 60;
      else total += v;
    }
    if (matched) return Math.round(total);
  }

  // Bare number → seconds
  const n = parseFloat(s);
  return isNaN(n) ? NaN : Math.round(n);
}

/**
 * Format total seconds as a compact string like "10m", "1m30s", "1h10m30s".
 */
export function formatDurationCompact(seconds: number): string {
  if (!seconds || seconds <= 0) return '0s';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.round(seconds % 60);
  return [h ? `${h}h` : '', m ? `${m}m` : '', s ? `${s}s` : ''].filter(Boolean).join('') || '0s';
}

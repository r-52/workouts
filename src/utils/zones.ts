/**
 * Training zone colours based on % FTP.
 * Uses the common 6-zone power model (Z1–Z6).
 */

export interface Zone {
  label: string;
  min: number; // fraction of FTP (inclusive)
  max: number; // fraction of FTP (exclusive, except last)
  color: string;
  bg: string;    // Tailwind-ish hex for the chart bar
  textColor: string;
}

export const ZONES: Zone[] = [
  { label: 'Z1 – Recovery',    min: 0,    max: 0.60, color: '#9ca3af', bg: '#d1d5db', textColor: '#374151' },
  { label: 'Z2 – Endurance',   min: 0.60, max: 0.76, color: '#60a5fa', bg: '#93c5fd', textColor: '#1e3a8a' },
  { label: 'Z3 – Tempo',       min: 0.76, max: 0.90, color: '#34d399', bg: '#6ee7b7', textColor: '#064e3b' },
  { label: 'Z4 – Threshold',   min: 0.90, max: 1.05, color: '#fbbf24', bg: '#fde68a', textColor: '#78350f' },
  { label: 'Z5 – VO2 Max',     min: 1.05, max: 1.19, color: '#f97316', bg: '#fed7aa', textColor: '#7c2d12' },
  { label: 'Z6 – Anaerobic',   min: 1.19, max: 99,   color: '#ef4444', bg: '#fca5a5', textColor: '#7f1d1d' },
];

export function getZone(power: number): Zone {
  return ZONES.find((z) => power >= z.min && power < z.max) ?? ZONES[0];
}

export function getZoneColor(power: number): string {
  return getZone(power).color;
}

export function getZoneBg(power: number): string {
  return getZone(power).bg;
}

/** Format a power fraction as a percentage string */
export function pctStr(power: number): string {
  return `${Math.round(power * 100)}%`;
}

/** Estimate watts from FTP and power fraction */
export function toWatts(power: number, ftp: number): number {
  return Math.round(power * ftp);
}

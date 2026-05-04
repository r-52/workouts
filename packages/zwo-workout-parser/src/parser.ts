/**
 * Free-form workout text parser.
 *
 * One block per line. Lines starting with # are comments.
 *
 * Supported syntax:
 *
 *   10m warmup 45-75%              → Warmup  (powerLow=45%, powerHigh=75%)
 *   10m cooldown 75-45%            → Cooldown (powerHigh=75%, powerLow=45%)
 *   5m ramp 50-100%                → Ramp
 *   20m @ 75%                      → SteadyState
 *   20m 75%                        → SteadyState
 *   4x 3m @ 110% / 2m @ 55%       → IntervalsT (verbose, slash-separated)
 *   4x 3m/2m @ 110%/55%           → IntervalsT (compact)
 *   4x 3m/2m 110%/55%             → IntervalsT (compact, no @)
 *   10m free                       → FreeRide
 *   30s max                        → MaxEffort
 *   30s sprint                     → MaxEffort
 *
 * Duration formats: 10m, 1m30s, 90s, 1:30, 300
 * Power formats:    75%, 0.75, 110%   (bare number > 2 assumed %)
 *
 * Power field semantics for ramp-style blocks:
 *   powerLow  = minimum power (always the smaller value)
 *   powerHigh = maximum power (always the larger value)
 * Direction is determined by block type:
 *   Warmup   → ramps from powerLow  up   to powerHigh
 *   Cooldown → ramps from powerHigh down to powerLow
 *   Ramp     → ramps from powerLow  up   to powerHigh
 */

import { parseDuration, formatDurationCompact } from './parseDuration.js';
import { nanoid } from './nanoid.js';
import type {
  WorkoutBlock,
  WarmupBlock,
  CooldownBlock,
  SteadyStateBlock,
  RampBlock,
  IntervalsTBlock,
  FreeRideBlock,
  MaxEffortBlock,
} from './types.js';

export interface ParsedLine {
  block?: WorkoutBlock;
  error?: string;
  raw: string;
}

// ─── Public entry point ──────────────────────────────────────────────────────

export function parseWorkoutText(text: string): ParsedLine[] {
  return text
    .split('\n')
    .map((raw) => {
      const line = raw.replace(/#.*$/, '').trim();
      if (!line) return null;
      return parseLine(line, raw.trimEnd());
    })
    .filter((r): r is ParsedLine => r !== null);
}

// ─── Line dispatcher ─────────────────────────────────────────────────────────

function parseLine(line: string, raw: string): ParsedLine {
  // Intervals: starts with N× or Nx
  const intMatch = line.match(/^(\d+)\s*[x×]\s*(.+)$/i);
  if (intMatch) return parseIntervals(intMatch[1], intMatch[2], raw);

  if (/\b(warmup|warm[\s-]up|wu)\b/i.test(line))     return parseRampBlock('Warmup', line, raw);
  if (/\b(cooldown|cool[\s-]down|cd)\b/i.test(line)) return parseRampBlock('Cooldown', line, raw);
  if (/\b(ramp|build)\b/i.test(line))                return parseRampBlock('Ramp', line, raw);
  if (/\b(free[\s-]?ride|free|fr)\b/i.test(line))    return parseFreeRide(line, raw);
  if (/\b(max[\s-]?effort|max|sprint|all[\s-]out)\b/i.test(line)) return parseMaxEffort(line, raw);

  return parseSteadyState(line, raw);
}

// ─── Block parsers ───────────────────────────────────────────────────────────

function parseRampBlock(type: 'Warmup' | 'Cooldown' | 'Ramp', line: string, raw: string): ParsedLine {
  // Strip type keywords so we can find the duration freely
  const clean = line
    .replace(/\b(warmup|warm[\s-]up|wu|cooldown|cool[\s-]down|cd|ramp|build|@)\b/gi, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();

  const durToken = findDurationToken(clean);
  if (!durToken) return { error: `No duration found: "${line}"`, raw };

  const afterDur = clean.replace(durToken.matched, ' ').trim();

  // powerLow is always the smaller value; powerHigh is always the larger value.
  // Direction (up vs down) is determined by the block type, not these fields.
  let powerLow  = 0.45;
  let powerHigh = 0.75;

  // Power range: "45-75%", "45%-75%", "75-45%", "0.45-0.75"
  const rangeMatch = afterDur.match(/([\d.]+%?)\s*[-–]\s*([\d.]+%?)/);
  if (rangeMatch) {
    const a = parsePct(rangeMatch[1]);
    const b = parsePct(rangeMatch[2]);
    if (!isNaN(a) && !isNaN(b)) {
      powerLow  = Math.min(a, b);
      powerHigh = Math.max(a, b);
    }
  }

  if (type === 'Warmup') {
    const block: WarmupBlock = { id: nanoid(), type: 'Warmup', duration: durToken.dur, powerLow, powerHigh };
    return { block, raw };
  }
  if (type === 'Cooldown') {
    const block: CooldownBlock = { id: nanoid(), type: 'Cooldown', duration: durToken.dur, powerLow, powerHigh };
    return { block, raw };
  }
  const block: RampBlock = { id: nanoid(), type: 'Ramp', duration: durToken.dur, powerLow, powerHigh };
  return { block, raw };
}

function parseFreeRide(line: string, raw: string): ParsedLine {
  const durToken = findDurationToken(line);
  if (!durToken) return { error: `No duration found: "${line}"`, raw };
  const block: FreeRideBlock = { id: nanoid(), type: 'FreeRide', duration: durToken.dur };
  return { block, raw };
}

function parseMaxEffort(line: string, raw: string): ParsedLine {
  const durToken = findDurationToken(line);
  if (!durToken) return { error: `No duration found: "${line}"`, raw };
  const block: MaxEffortBlock = { id: nanoid(), type: 'MaxEffort', duration: durToken.dur };
  return { block, raw };
}

function parseSteadyState(line: string, raw: string): ParsedLine {
  const clean = line.replace(/@/g, ' ').replace(/\bsteady\b/gi, ' ').trim();
  const durToken = findDurationToken(clean);
  if (!durToken) return { error: `No duration found: "${line}"`, raw };

  const afterDur = clean.replace(durToken.matched, ' ').trim();
  const powMatch = afterDur.match(/([\d.]+%?)/);
  const power = powMatch ? parsePct(powMatch[1]) : 0.75;

  const block: SteadyStateBlock = {
    id: nanoid(),
    type: 'SteadyState',
    duration: durToken.dur,
    power: isNaN(power) ? 0.75 : power,
  };
  return { block, raw };
}

function parseIntervals(repeatStr: string, rest: string, raw: string): ParsedLine {
  const repeat = parseInt(repeatStr, 10);
  if (isNaN(repeat) || repeat < 1) return { error: `Invalid repeat count: "${repeatStr}"`, raw };

  // ── Compact: "3m/2m @ 110%/55%"  or  "3m/2m 110%/55%" ───────────────────
  const compactMatch = rest.match(
    /^([\dhms:]+)\s*\/\s*([\dhms:]+)\s+@?\s*([\d.]+%?)\s*\/\s*([\d.]+%?)/i
  );
  if (compactMatch) {
    const onDur   = parseDuration(compactMatch[1]);
    const offDur  = parseDuration(compactMatch[2]);
    const onPower  = parsePct(compactMatch[3]);
    const offPower = parsePct(compactMatch[4]);
    if (!isNaN(onDur) && !isNaN(offDur) && onDur > 0 && offDur >= 0 && !isNaN(onPower) && !isNaN(offPower)) {
      const block: IntervalsTBlock = {
        id: nanoid(), type: 'IntervalsT', repeat,
        onDuration: onDur, onPower,
        offDuration: offDur, offPower,
        duration: repeat * (onDur + offDur),
      };
      return { block, raw };
    }
  }

  // ── Verbose: "DUR [@ POWER] / DUR [@ POWER]" (split on "/") ──────────────
  const parts = rest.split(/\s*\/\s*/);
  if (parts.length === 2) {
    const onLeg  = parseLeg(parts[0].trim());
    const offLeg = parseLeg(parts[1].trim());
    if (onLeg && offLeg && onLeg.dur > 0) {
      const block: IntervalsTBlock = {
        id: nanoid(), type: 'IntervalsT', repeat,
        onDuration: onLeg.dur, onPower: onLeg.power,
        offDuration: offLeg.dur, offPower: offLeg.power,
        duration: repeat * (onLeg.dur + offLeg.dur),
      };
      return { block, raw };
    }
  }

  // ── Single leg: "DUR [@ POWER]" → auto rest = 50% of on duration ─────────
  const onLeg = parseLeg(rest.trim());
  if (onLeg && onLeg.dur > 0) {
    const offDur = Math.round(onLeg.dur * 0.5);
    const block: IntervalsTBlock = {
      id: nanoid(), type: 'IntervalsT', repeat,
      onDuration: onLeg.dur, onPower: onLeg.power,
      offDuration: offDur, offPower: 0.55,
      duration: repeat * (onLeg.dur + offDur),
    };
    return { block, raw };
  }

  return { error: `Could not parse intervals: "${rest}"`, raw };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

interface DurToken {
  dur: number;
  matched: string;
}

/** Find the first recognisable duration token anywhere in a string. */
function findDurationToken(text: string): DurToken | null {
  // Priority order: most specific first
  const patterns = [
    /\b(\d+h\d+m\d+s)\b/i,
    /\b(\d+h\d+m)\b/i,
    /\b(\d+h\d+s)\b/i,
    /\b(\d+h)\b/i,
    /\b(\d+m\d+s)\b/i,
    /\b(\d+m)\b/i,              // e.g. 10m — must come before bare number
    /\b(\d+s)\b/i,              // e.g. 30s
    /\b(\d+:\d+(?::\d+)?)\b/,  // mm:ss
    /\b(\d+)\b/,                // bare number (last resort = seconds)
  ];

  for (const pattern of patterns) {
    const m = text.match(pattern);
    if (m) {
      const dur = parseDuration(m[1]);
      if (!isNaN(dur) && dur > 0) return { dur, matched: m[0] };
    }
  }
  return null;
}

/** Parse a single interval leg like "3m @ 110%" or "2m 55%" → { dur, power } */
function parseLeg(s: string): { dur: number; power: number } | null {
  const durToken = findDurationToken(s);
  if (!durToken) return null;
  const rest = s.replace(durToken.matched, '').replace(/@/g, '').trim();
  const powMatch = rest.match(/([\d.]+%?)/);
  const power = powMatch ? parsePct(powMatch[1]) : NaN;
  return { dur: durToken.dur, power: isNaN(power) ? 0.75 : power };
}

/** Parse a power value: "75%" → 0.75, "0.75" → 0.75, "110" → 1.10 */
function parsePct(s: string): number {
  const t = s.trim();
  if (t.endsWith('%')) return parseFloat(t) / 100;
  const n = parseFloat(t);
  // If > 2 treat as percentage (e.g. "110" → 1.10)
  return isNaN(n) ? NaN : n > 2 ? n / 100 : n;
}

// ─── Preview helper (used by UI) ─────────────────────────────────────────────

export function previewLine(result: ParsedLine): string {
  if (result.error) return `⚠ ${result.error}`;
  if (!result.block) return '';
  const b = result.block;
  const dur = formatDurationCompact(blockTotalDuration(b));
  switch (b.type) {
    case 'Warmup':    return `Warm Up  ${dur}  ${pct(b.powerLow)}→${pct(b.powerHigh)}`;
    // Cooldown ramps DOWN: display as powerHigh → powerLow
    case 'Cooldown':  return `Cool Down  ${dur}  ${pct(b.powerHigh)}→${pct(b.powerLow)}`;
    case 'Ramp':      return `Ramp  ${dur}  ${pct(b.powerLow)}→${pct(b.powerHigh)}`;
    case 'SteadyState': return `Steady  ${dur}  @ ${pct(b.power)}`;
    case 'IntervalsT':
      return `${b.repeat}×  ${formatDurationCompact(b.onDuration)} @ ${pct(b.onPower)} / ${formatDurationCompact(b.offDuration)} @ ${pct(b.offPower)}`;
    case 'FreeRide':  return `Free Ride  ${dur}`;
    case 'MaxEffort': return `Max Effort  ${dur}`;
  }
}

function pct(n: number) { return `${Math.round(n * 100)}%`; }

function blockTotalDuration(b: WorkoutBlock): number {
  if (b.type === 'IntervalsT') return b.repeat * (b.onDuration + b.offDuration);
  return b.duration;
}

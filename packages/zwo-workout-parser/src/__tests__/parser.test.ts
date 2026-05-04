import { describe, it, expect } from 'vitest';
import { parseWorkoutText } from '../parser';
import type {
  WarmupBlock,
  CooldownBlock,
  SteadyStateBlock,
  RampBlock,
  IntervalsTBlock,
  FreeRideBlock,
  MaxEffortBlock,
} from '../types';

describe('parseWorkoutText – basics', () => {
  it('returns empty array for empty string', () => {
    expect(parseWorkoutText('')).toHaveLength(0);
  });

  it('skips comment-only lines', () => {
    expect(parseWorkoutText('# just a comment')).toHaveLength(0);
    expect(parseWorkoutText('# comment\n# another')).toHaveLength(0);
  });

  it('strips inline comments from lines', () => {
    const results = parseWorkoutText('10m @ 75% # this is a comment');
    expect(results[0].block).toBeDefined();
    expect(results[0].block!.type).toBe('SteadyState');
  });

  it('skips blank lines', () => {
    const results = parseWorkoutText('\n\n10m @ 75%\n\n');
    expect(results).toHaveLength(1);
  });
});

describe('parseWorkoutText – SteadyState', () => {
  it('parses "20m @ 75%"', () => {
    const [result] = parseWorkoutText('20m @ 75%');
    expect(result.block?.type).toBe('SteadyState');
    const b = result.block as SteadyStateBlock;
    expect(b.duration).toBe(1200);
    expect(b.power).toBeCloseTo(0.75);
  });

  it('parses "20m 75%" (no @ sign)', () => {
    const [result] = parseWorkoutText('20m 75%');
    expect(result.block?.type).toBe('SteadyState');
  });

  it('parses decimal power "10m 0.85"', () => {
    const [result] = parseWorkoutText('10m 0.85');
    const b = result.block as SteadyStateBlock;
    expect(b.power).toBeCloseTo(0.85);
  });
});

describe('parseWorkoutText – Warmup', () => {
  it('parses "10m warmup 45-75%"', () => {
    const [result] = parseWorkoutText('10m warmup 45-75%');
    expect(result.block?.type).toBe('Warmup');
    const b = result.block as WarmupBlock;
    expect(b.duration).toBe(600);
    expect(b.powerLow).toBeCloseTo(0.45);
    expect(b.powerHigh).toBeCloseTo(0.75);
  });

  it('parses "10m wu" shorthand', () => {
    const [result] = parseWorkoutText('10m wu 50-80%');
    expect(result.block?.type).toBe('Warmup');
  });

  it('sets powerLow as smaller value regardless of order', () => {
    const [result] = parseWorkoutText('10m warmup 75-45%');
    const b = result.block as WarmupBlock;
    expect(b.powerLow).toBeCloseTo(0.45);
    expect(b.powerHigh).toBeCloseTo(0.75);
  });
});

describe('parseWorkoutText – Cooldown', () => {
  it('parses "10m cooldown 75-45%"', () => {
    const [result] = parseWorkoutText('10m cooldown 75-45%');
    expect(result.block?.type).toBe('Cooldown');
    const b = result.block as CooldownBlock;
    expect(b.powerLow).toBeCloseTo(0.45);
    expect(b.powerHigh).toBeCloseTo(0.75);
  });

  it('parses "10m cd" shorthand', () => {
    const [result] = parseWorkoutText('10m cd 60-40%');
    expect(result.block?.type).toBe('Cooldown');
  });
});

describe('parseWorkoutText – Ramp', () => {
  it('parses "5m ramp 50-100%"', () => {
    const [result] = parseWorkoutText('5m ramp 50-100%');
    expect(result.block?.type).toBe('Ramp');
    const b = result.block as RampBlock;
    expect(b.duration).toBe(300);
    expect(b.powerLow).toBeCloseTo(0.5);
    expect(b.powerHigh).toBeCloseTo(1.0);
  });

  it('parses "5m build" synonym', () => {
    const [result] = parseWorkoutText('5m build 50-100%');
    expect(result.block?.type).toBe('Ramp');
  });
});

describe('parseWorkoutText – IntervalsT', () => {
  it('parses verbose format: "4x 3m @ 110% / 2m @ 55%"', () => {
    const [result] = parseWorkoutText('4x 3m @ 110% / 2m @ 55%');
    expect(result.block?.type).toBe('IntervalsT');
    const b = result.block as IntervalsTBlock;
    expect(b.repeat).toBe(4);
    expect(b.onDuration).toBe(180);
    expect(b.onPower).toBeCloseTo(1.1);
    expect(b.offDuration).toBe(120);
    expect(b.offPower).toBeCloseTo(0.55);
  });

  it('parses compact format: "4x 3m/2m @ 110%/55%"', () => {
    const [result] = parseWorkoutText('4x 3m/2m @ 110%/55%');
    expect(result.block?.type).toBe('IntervalsT');
    const b = result.block as IntervalsTBlock;
    expect(b.repeat).toBe(4);
  });

  it('uses × unicode multiplier', () => {
    const [result] = parseWorkoutText('4× 3m @ 110% / 2m @ 55%');
    expect(result.block?.type).toBe('IntervalsT');
  });
});

describe('parseWorkoutText – FreeRide', () => {
  it('parses "10m free"', () => {
    const [result] = parseWorkoutText('10m free');
    expect(result.block?.type).toBe('FreeRide');
    const b = result.block as FreeRideBlock;
    expect(b.duration).toBe(600);
  });

  it('parses "10m free ride"', () => {
    const [result] = parseWorkoutText('10m free ride');
    expect(result.block?.type).toBe('FreeRide');
  });
});

describe('parseWorkoutText – MaxEffort', () => {
  it('parses "30s max"', () => {
    const [result] = parseWorkoutText('30s max');
    expect(result.block?.type).toBe('MaxEffort');
    const b = result.block as MaxEffortBlock;
    expect(b.duration).toBe(30);
  });

  it('parses "30s sprint" synonym', () => {
    const [result] = parseWorkoutText('30s sprint');
    expect(result.block?.type).toBe('MaxEffort');
  });
});

describe('parseWorkoutText – multi-line', () => {
  it('parses a full workout with multiple block types', () => {
    const text = `
# Tempo Workout
10m warmup 45-75%
20m @ 85%
4x 3m @ 110% / 2m @ 55%
5m cooldown 75-45%
    `.trim();
    const results = parseWorkoutText(text);
    expect(results).toHaveLength(4);
    expect(results[0].block!.type).toBe('Warmup');
    expect(results[1].block!.type).toBe('SteadyState');
    expect(results[2].block!.type).toBe('IntervalsT');
    expect(results[3].block!.type).toBe('Cooldown');
  });

  it('each block gets a unique id', () => {
    const results = parseWorkoutText('10m @ 75%\n20m @ 80%');
    const ids = results.map((r) => r.block!.id);
    expect(new Set(ids).size).toBe(2);
  });
});

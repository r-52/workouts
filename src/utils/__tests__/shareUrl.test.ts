import { describe, it, expect } from 'vitest';
import { encodeWorkout, decodeWorkout, buildShareUrl } from '../shareUrl';
import type { WorkoutBlock, WorkoutMeta } from '../../types/workout';

const META: WorkoutMeta = {
  name: 'Testing 1-2-3',
  author: 'Coach',
  description: 'A short workout',
  sportType: 'bike',
  ftp: 250,
};

const BLOCKS: WorkoutBlock[] = [
  { id: 'a1', type: 'SteadyState', duration: 300, power: 0.75 },
  { id: 'b2', type: 'Warmup', duration: 600, powerLow: 0.45, powerHigh: 0.75 },
  {
    id: 'c3', type: 'IntervalsT', duration: 480,
    repeat: 4, onDuration: 60, onPower: 1.05, offDuration: 60, offPower: 0.55,
  },
];

describe('encodeWorkout', () => {
  it('returns a non-empty string', () => {
    const encoded = encodeWorkout(BLOCKS, META);
    expect(typeof encoded).toBe('string');
    expect(encoded.length).toBeGreaterThan(0);
  });

  it('produces URL-safe characters only (base64 alphnum + /+=)', () => {
    const encoded = encodeWorkout(BLOCKS, META);
    // URL fragments can carry base64 chars including +/=
    expect(encoded).toMatch(/^[A-Za-z0-9+/=]+$/);
  });

  it('returns a different string for different workouts', () => {
    const other: WorkoutBlock[] = [{ id: 'x', type: 'FreeRide', duration: 600 }];
    expect(encodeWorkout(BLOCKS, META)).not.toBe(encodeWorkout(other, META));
  });
});

describe('decodeWorkout', () => {
  it('round-trips blocks and meta', () => {
    const encoded = encodeWorkout(BLOCKS, META);
    const result = decodeWorkout(encoded);
    expect(result).not.toBeNull();
    expect(result!.meta.name).toBe(META.name);
    expect(result!.meta.ftp).toBe(META.ftp);
    expect(result!.blocks).toHaveLength(BLOCKS.length);
    expect(result!.blocks[0].type).toBe('SteadyState');
    expect(result!.blocks[1].type).toBe('Warmup');
  });

  it('preserves all block fields through encode/decode', () => {
    const encoded = encodeWorkout(BLOCKS, META);
    const result = decodeWorkout(encoded)!;
    const intervals = result.blocks[2] as Extract<WorkoutBlock, { type: 'IntervalsT' }>;
    expect(intervals.repeat).toBe(4);
    expect(intervals.onPower).toBe(1.05);
    expect(intervals.offPower).toBe(0.55);
  });

  it('returns null for empty string', () => {
    expect(decodeWorkout('')).toBeNull();
  });

  it('returns null for arbitrary garbage', () => {
    expect(decodeWorkout('not-valid-base64!!!')).toBeNull();
  });

  it('returns null when decoded JSON lacks blocks/meta', () => {
    const badEncoded = btoa(encodeURIComponent(JSON.stringify({ foo: 'bar' })));
    expect(decodeWorkout(badEncoded)).toBeNull();
  });

  it('handles special characters in meta fields', () => {
    const unicodeMeta = { ...META, name: 'Wörkout über Köln 🚴', author: 'Ö. Müller' };
    const encoded = encodeWorkout(BLOCKS, unicodeMeta);
    const result = decodeWorkout(encoded)!;
    expect(result.meta.name).toBe('Wörkout über Köln 🚴');
    expect(result.meta.author).toBe('Ö. Müller');
  });
});

describe('buildShareUrl', () => {
  it('includes #w= fragment', () => {
    const url = buildShareUrl(BLOCKS, META);
    expect(url).toContain('#w=');
  });

  it('constructed URL decodes back to original workout', () => {
    const url = buildShareUrl(BLOCKS, META);
    const hash = url.split('#w=')[1];
    const result = decodeWorkout(hash);
    expect(result).not.toBeNull();
    expect(result!.meta.name).toBe(META.name);
    expect(result!.blocks).toHaveLength(BLOCKS.length);
  });
});

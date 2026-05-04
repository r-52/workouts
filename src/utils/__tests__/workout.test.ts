import { describe, it, expect } from 'vitest';
import { blockDuration, formatTime } from '../workout';
import type {
  WorkoutBlock,
  WarmupBlock,
  CooldownBlock,
  SteadyStateBlock,
  RampBlock,
  IntervalsTBlock,
  FreeRideBlock,
  MaxEffortBlock,
} from '../../types/workout';

describe('blockDuration', () => {
  it('returns duration for WarmupBlock', () => {
    const block: WarmupBlock = { id: '1', type: 'Warmup', duration: 600, powerLow: 0.45, powerHigh: 0.75 };
    expect(blockDuration(block as WorkoutBlock)).toBe(600);
  });

  it('returns duration for CooldownBlock', () => {
    const block: CooldownBlock = { id: '1', type: 'Cooldown', duration: 300, powerLow: 0.45, powerHigh: 0.75 };
    expect(blockDuration(block as WorkoutBlock)).toBe(300);
  });

  it('returns duration for SteadyStateBlock', () => {
    const block: SteadyStateBlock = { id: '1', type: 'SteadyState', duration: 1200, power: 0.75 };
    expect(blockDuration(block as WorkoutBlock)).toBe(1200);
  });

  it('returns duration for RampBlock', () => {
    const block: RampBlock = { id: '1', type: 'Ramp', duration: 900, powerLow: 0.5, powerHigh: 1.0 };
    expect(blockDuration(block as WorkoutBlock)).toBe(900);
  });

  it('returns repeat*(on+off) for IntervalsT', () => {
    const block: IntervalsTBlock = {
      id: '1', type: 'IntervalsT', duration: 480,
      repeat: 4, onDuration: 60, offDuration: 60, onPower: 1.05, offPower: 0.55,
    };
    expect(blockDuration(block as WorkoutBlock)).toBe(4 * (60 + 60));
  });

  it('handles asymmetric IntervalsT on/off durations', () => {
    const block: IntervalsTBlock = {
      id: '1', type: 'IntervalsT', duration: 900,
      repeat: 3, onDuration: 180, offDuration: 120, onPower: 1.1, offPower: 0.5,
    };
    expect(blockDuration(block as WorkoutBlock)).toBe(3 * (180 + 120));
  });

  it('returns duration for FreeRideBlock', () => {
    const block: FreeRideBlock = { id: '1', type: 'FreeRide', duration: 600 };
    expect(blockDuration(block as WorkoutBlock)).toBe(600);
  });

  it('returns duration for MaxEffortBlock', () => {
    const block: MaxEffortBlock = { id: '1', type: 'MaxEffort', duration: 30 };
    expect(blockDuration(block as WorkoutBlock)).toBe(30);
  });
});

describe('formatTime', () => {
  it('formats pure seconds', () => {
    expect(formatTime(0)).toBe('0s');
    expect(formatTime(45)).toBe('45s');
    expect(formatTime(59)).toBe('59s');
  });

  it('formats exact minutes', () => {
    expect(formatTime(60)).toBe('1m');
    expect(formatTime(600)).toBe('10m');
  });

  it('formats minutes and seconds', () => {
    expect(formatTime(90)).toBe('1m 30s');
    expect(formatTime(125)).toBe('2m 5s');
  });

  it('formats hours and minutes (drops seconds)', () => {
    expect(formatTime(3600)).toBe('1h 0m');
    expect(formatTime(3660)).toBe('1h 1m');
    expect(formatTime(7200)).toBe('2h 0m');
    expect(formatTime(5400)).toBe('1h 30m');
  });
});

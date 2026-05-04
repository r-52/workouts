import { describe, it, expect } from 'vitest';
import { parseDuration, formatDurationCompact } from '../parseDuration';

describe('parseDuration', () => {
  describe('h/m/s unit format', () => {
    it('parses minutes: "10m"', () => expect(parseDuration('10m')).toBe(600));
    it('parses seconds: "30s"', () => expect(parseDuration('30s')).toBe(30));
    it('parses combined: "1m30s"', () => expect(parseDuration('1m30s')).toBe(90));
    it('parses hours: "1h"', () => expect(parseDuration('1h')).toBe(3600));
    it('parses h+m: "1h30m"', () => expect(parseDuration('1h30m')).toBe(5400));
    it('parses h+m+s: "1h30m10s"', () => expect(parseDuration('1h30m10s')).toBe(5410));
    it('is case-insensitive', () => expect(parseDuration('10M')).toBe(600));
  });

  describe('colon format', () => {
    it('parses mm:ss: "1:30"', () => expect(parseDuration('1:30')).toBe(90));
    it('parses mm:ss with leading zero: "01:30"', () => expect(parseDuration('01:30')).toBe(90));
    it('parses hh:mm:ss: "1:30:00"', () => expect(parseDuration('1:30:00')).toBe(5400));
    it('parses "0:45"', () => expect(parseDuration('0:45')).toBe(45));
  });

  describe('bare number format', () => {
    it('treats bare number as seconds: "90"', () => expect(parseDuration('90')).toBe(90));
    it('rounds fractional seconds: "90.9"', () => expect(parseDuration('90.9')).toBe(91));
  });

  describe('edge cases', () => {
    it('returns NaN for empty string', () => expect(parseDuration('')).toBeNaN());
    it('returns NaN for text without units', () => expect(parseDuration('invalid')).toBeNaN());
    it('handles surrounding whitespace', () => expect(parseDuration('  5m  ')).toBe(300));
  });
});

describe('formatDurationCompact', () => {
  it('formats 0 as "0s"', () => expect(formatDurationCompact(0)).toBe('0s'));
  it('formats pure seconds', () => expect(formatDurationCompact(30)).toBe('30s'));
  it('formats exact minutes', () => expect(formatDurationCompact(60)).toBe('1m'));
  it('formats minutes + seconds', () => expect(formatDurationCompact(90)).toBe('1m30s'));
  it('formats exact hours', () => expect(formatDurationCompact(3600)).toBe('1h'));
  it('formats h+m', () => expect(formatDurationCompact(5400)).toBe('1h30m'));
  it('formats h+m+s', () => expect(formatDurationCompact(5461)).toBe('1h31m1s'));
  it('formats large duration', () => expect(formatDurationCompact(7261)).toBe('2h1m1s'));
});

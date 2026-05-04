import { describe, it, expect } from 'vitest';
import { getZone, getZoneColor, getZoneBg, pctStr, toWatts, ZONES } from '../zones';

describe('ZONES definition', () => {
  it('has 6 zones', () => {
    expect(ZONES).toHaveLength(6);
  });

  it('covers the full power range from 0 to ∞', () => {
    expect(ZONES[0].min).toBe(0);
    expect(ZONES[ZONES.length - 1].max).toBeGreaterThan(2);
  });
});

describe('getZone', () => {
  it('Z1 – Recovery: below 0.60', () => {
    expect(getZone(0).label).toBe('Z1 – Recovery');
    expect(getZone(0.3).label).toBe('Z1 – Recovery');
    expect(getZone(0.59).label).toBe('Z1 – Recovery');
  });

  it('Z2 – Endurance: 0.60–0.76', () => {
    expect(getZone(0.60).label).toBe('Z2 – Endurance');
    expect(getZone(0.70).label).toBe('Z2 – Endurance');
    expect(getZone(0.759).label).toBe('Z2 – Endurance');
  });

  it('Z3 – Tempo: 0.76–0.90', () => {
    expect(getZone(0.76).label).toBe('Z3 – Tempo');
    expect(getZone(0.85).label).toBe('Z3 – Tempo');
  });

  it('Z4 – Threshold: 0.90–1.05', () => {
    expect(getZone(0.90).label).toBe('Z4 – Threshold');
    expect(getZone(1.0).label).toBe('Z4 – Threshold');
    expect(getZone(1.04).label).toBe('Z4 – Threshold');
  });

  it('Z5 – VO2 Max: 1.05–1.19', () => {
    expect(getZone(1.05).label).toBe('Z5 – VO2 Max');
    expect(getZone(1.15).label).toBe('Z5 – VO2 Max');
  });

  it('Z6 – Anaerobic: 1.19+', () => {
    expect(getZone(1.19).label).toBe('Z6 – Anaerobic');
    expect(getZone(1.5).label).toBe('Z6 – Anaerobic');
    expect(getZone(2.0).label).toBe('Z6 – Anaerobic');
  });
});

describe('getZoneColor', () => {
  it('returns the color string for the correct zone', () => {
    expect(getZoneColor(0.3)).toBe(ZONES[0].color);   // Z1
    expect(getZoneColor(0.65)).toBe(ZONES[1].color);  // Z2
    expect(getZoneColor(0.80)).toBe(ZONES[2].color);  // Z3
    expect(getZoneColor(1.0)).toBe(ZONES[3].color);   // Z4
    expect(getZoneColor(1.10)).toBe(ZONES[4].color);  // Z5
    expect(getZoneColor(1.25)).toBe(ZONES[5].color);  // Z6
  });
});

describe('getZoneBg', () => {
  it('returns the bg string for the correct zone', () => {
    expect(getZoneBg(0.3)).toBe(ZONES[0].bg);
    expect(getZoneBg(1.0)).toBe(ZONES[3].bg);
  });
});

describe('pctStr', () => {
  it('formats fractional FTP as percentage', () => {
    expect(pctStr(0.75)).toBe('75%');
    expect(pctStr(1.0)).toBe('100%');
    expect(pctStr(1.05)).toBe('105%');
    expect(pctStr(0.45)).toBe('45%');
  });

  it('rounds to nearest integer', () => {
    expect(pctStr(0.756)).toBe('76%');
  });
});

describe('toWatts', () => {
  it('converts power fraction and FTP to watts', () => {
    expect(toWatts(0.75, 200)).toBe(150);
    expect(toWatts(1.0, 250)).toBe(250);
    expect(toWatts(1.05, 200)).toBe(210);
  });

  it('rounds to nearest integer', () => {
    expect(toWatts(0.333, 300)).toBe(100);
  });
});

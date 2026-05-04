import { describe, it, expect } from 'vitest';
import { serializeZwo } from '../zwoSerializer';
import type { WorkoutBlock, WorkoutMeta } from '../../types/workout';

const BASE_META: WorkoutMeta = {
  name: 'Test Workout',
  author: 'Tester',
  description: 'A test workout',
  sportType: 'bike',
  ftp: 250,
};

function makeBlocks(blocks: Record<string, unknown>[]): WorkoutBlock[] {
  return blocks.map((b, i) => ({ ...b, id: String(i) })) as WorkoutBlock[];
}

describe('serializeZwo – document structure', () => {
  it('includes XML prolog and root element', () => {
    const xml = serializeZwo([], BASE_META);
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<workout_file>');
    expect(xml).toContain('</workout_file>');
  });

  it('includes meta fields', () => {
    const xml = serializeZwo([], BASE_META);
    expect(xml).toContain('<name>Test Workout</name>');
    expect(xml).toContain('<author>Tester</author>');
    expect(xml).toContain('<description>A test workout</description>');
    expect(xml).toContain('<sportType>bike</sportType>');
  });

  it('includes workout wrapper element', () => {
    const xml = serializeZwo([], BASE_META);
    expect(xml).toContain('<workout>');
    expect(xml).toContain('</workout>');
  });
});

describe('serializeZwo – block types', () => {
  it('serializes SteadyState', () => {
    const blocks = makeBlocks([{ type: 'SteadyState', duration: 300, power: 0.75 }]);
    const xml = serializeZwo(blocks, BASE_META);
    expect(xml).toContain('<SteadyState Duration="300" Power="0.75"/>');
  });

  it('serializes Warmup', () => {
    const blocks = makeBlocks([{ type: 'Warmup', duration: 600, powerLow: 0.45, powerHigh: 0.75 }]);
    const xml = serializeZwo(blocks, BASE_META);
    expect(xml).toContain('<Warmup Duration="600" PowerLow="0.45" PowerHigh="0.75"/>');
  });

  it('serializes Cooldown', () => {
    const blocks = makeBlocks([{ type: 'Cooldown', duration: 300, powerLow: 0.45, powerHigh: 0.75 }]);
    const xml = serializeZwo(blocks, BASE_META);
    expect(xml).toContain('<Cooldown Duration="300" PowerLow="0.45" PowerHigh="0.75"/>');
  });

  it('serializes Ramp', () => {
    const blocks = makeBlocks([{ type: 'Ramp', duration: 600, powerLow: 0.5, powerHigh: 1.0 }]);
    const xml = serializeZwo(blocks, BASE_META);
    expect(xml).toContain('<Ramp Duration="600" PowerLow="0.5" PowerHigh="1"/>');
  });

  it('serializes IntervalsT', () => {
    const blocks = makeBlocks([{
      type: 'IntervalsT', duration: 480,
      repeat: 4, onDuration: 60, onPower: 1.05, offDuration: 60, offPower: 0.55,
    }]);
    const xml = serializeZwo(blocks, BASE_META);
    expect(xml).toContain('Repeat="4"');
    expect(xml).toContain('OnDuration="60"');
    expect(xml).toContain('OnPower="1.05"');
    expect(xml).toContain('OffDuration="60"');
    expect(xml).toContain('OffPower="0.55"');
    expect(xml).toContain('<IntervalsT');
  });

  it('serializes FreeRide', () => {
    const blocks = makeBlocks([{ type: 'FreeRide', duration: 600 }]);
    const xml = serializeZwo(blocks, BASE_META);
    expect(xml).toContain('<FreeRide Duration="600"');
  });

  it('serializes MaxEffort', () => {
    const blocks = makeBlocks([{ type: 'MaxEffort', duration: 30 }]);
    const xml = serializeZwo(blocks, BASE_META);
    expect(xml).toContain('<MaxEffort Duration="30"/>');
  });

  it('includes optional cadence attribute when set', () => {
    const blocks = makeBlocks([{ type: 'SteadyState', duration: 300, power: 0.75, cadence: 90 }]);
    const xml = serializeZwo(blocks, BASE_META);
    expect(xml).toContain('Cadence="90"');
  });
});

describe('serializeZwo – XML escaping', () => {
  it('escapes & in meta fields', () => {
    const meta = { ...BASE_META, name: 'Rocks & Roads' };
    expect(serializeZwo([], meta)).toContain('Rocks &amp; Roads');
  });

  it('escapes < and > in meta fields', () => {
    const meta = { ...BASE_META, description: '<hard> workout' };
    const xml = serializeZwo([], meta);
    expect(xml).toContain('&lt;hard&gt;');
  });

  it('escapes " in meta fields', () => {
    const meta = { ...BASE_META, author: 'Coach "Bob"' };
    expect(serializeZwo([], meta)).toContain('Coach &quot;Bob&quot;');
  });
});

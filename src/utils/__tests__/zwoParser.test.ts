import { describe, it, expect } from 'vitest';
import { parseZwo } from '../zwoParser';
import type { SteadyStateBlock, WarmupBlock, CooldownBlock, RampBlock, IntervalsTBlock, FreeRideBlock, MaxEffortBlock } from '../../types/workout';

function makeXml(workoutBody: string, metaFields = ''): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<workout_file>
  <name>My Workout</name>
  <author>Test Author</author>
  <description>desc</description>
  <sportType>bike</sportType>
  ${metaFields}
  <workout>
    ${workoutBody}
  </workout>
</workout_file>`;
}

describe('parseZwo – meta', () => {
  it('parses name, author, description, sportType', () => {
    const { meta } = parseZwo(makeXml(''));
    expect(meta.name).toBe('My Workout');
    expect(meta.author).toBe('Test Author');
    expect(meta.description).toBe('desc');
    expect(meta.sportType).toBe('bike');
  });

  it('defaults name to "Imported Workout" when absent', () => {
    const xml = '<workout_file><workout></workout></workout_file>';
    const { meta } = parseZwo(xml);
    expect(meta.name).toBe('Imported Workout');
  });
});

describe('parseZwo – SteadyState', () => {
  it('parses power and duration', () => {
    const { blocks } = parseZwo(makeXml('<SteadyState Duration="300" Power="0.75"/>'));
    expect(blocks).toHaveLength(1);
    const b = blocks[0] as SteadyStateBlock;
    expect(b.type).toBe('SteadyState');
    expect(b.duration).toBe(300);
    expect(b.power).toBe(0.75);
  });

  it('parses optional cadence', () => {
    const { blocks } = parseZwo(makeXml('<SteadyState Duration="300" Power="0.75" Cadence="90"/>'));
    expect(blocks[0].cadence).toBe(90);
  });
});

describe('parseZwo – Warmup', () => {
  it('parses powerLow and powerHigh', () => {
    const { blocks } = parseZwo(makeXml('<Warmup Duration="600" PowerLow="0.45" PowerHigh="0.75"/>'));
    expect(blocks).toHaveLength(1);
    const b = blocks[0] as WarmupBlock;
    expect(b.type).toBe('Warmup');
    expect(b.duration).toBe(600);
    expect(b.powerLow).toBe(0.45);
    expect(b.powerHigh).toBe(0.75);
  });
});

describe('parseZwo – Cooldown', () => {
  it('parses powerLow and powerHigh', () => {
    const { blocks } = parseZwo(makeXml('<Cooldown Duration="300" PowerLow="0.45" PowerHigh="0.75"/>'));
    const b = blocks[0] as CooldownBlock;
    expect(b.type).toBe('Cooldown');
    expect(b.powerLow).toBe(0.45);
    expect(b.powerHigh).toBe(0.75);
  });
});

describe('parseZwo – Ramp', () => {
  it('parses powerLow and powerHigh', () => {
    const { blocks } = parseZwo(makeXml('<Ramp Duration="600" PowerLow="0.5" PowerHigh="1.0"/>'));
    const b = blocks[0] as RampBlock;
    expect(b.type).toBe('Ramp');
    expect(b.powerLow).toBe(0.5);
    expect(b.powerHigh).toBe(1.0);
  });
});

describe('parseZwo – IntervalsT', () => {
  it('parses repeat, on/off duration and power, computes total duration', () => {
    const xml = makeXml(
      '<IntervalsT Repeat="4" OnDuration="60" OnPower="1.05" OffDuration="60" OffPower="0.55"/>'
    );
    const { blocks } = parseZwo(xml);
    const b = blocks[0] as IntervalsTBlock;
    expect(b.type).toBe('IntervalsT');
    expect(b.repeat).toBe(4);
    expect(b.onDuration).toBe(60);
    expect(b.onPower).toBe(1.05);
    expect(b.offDuration).toBe(60);
    expect(b.offPower).toBe(0.55);
    expect(b.duration).toBe(4 * (60 + 60));
  });

  it('parses optional cadence for on and rest', () => {
    const xml = makeXml(
      '<IntervalsT Repeat="3" OnDuration="60" OnPower="1.05" OffDuration="60" OffPower="0.55" Cadence="95" CadenceResting="80"/>'
    );
    const { blocks } = parseZwo(xml);
    const b = blocks[0] as IntervalsTBlock;
    expect(b.onCadence).toBe(95);
    expect(b.offCadence).toBe(80);
  });
});

describe('parseZwo – FreeRide', () => {
  it('parses duration', () => {
    const { blocks } = parseZwo(makeXml('<FreeRide Duration="600"/>'));
    const b = blocks[0] as FreeRideBlock;
    expect(b.type).toBe('FreeRide');
    expect(b.duration).toBe(600);
  });
});

describe('parseZwo – MaxEffort', () => {
  it('parses duration', () => {
    const { blocks } = parseZwo(makeXml('<MaxEffort Duration="30"/>'));
    const b = blocks[0] as MaxEffortBlock;
    expect(b.type).toBe('MaxEffort');
    expect(b.duration).toBe(30);
  });
});

describe('parseZwo – multi-block', () => {
  it('parses multiple blocks preserving order', () => {
    const xml = makeXml(`
      <Warmup Duration="600" PowerLow="0.45" PowerHigh="0.75"/>
      <SteadyState Duration="1200" Power="0.85"/>
      <Cooldown Duration="300" PowerLow="0.45" PowerHigh="0.75"/>
    `);
    const { blocks } = parseZwo(xml);
    expect(blocks).toHaveLength(3);
    expect(blocks[0].type).toBe('Warmup');
    expect(blocks[1].type).toBe('SteadyState');
    expect(blocks[2].type).toBe('Cooldown');
  });
});

describe('parseZwo – edge cases', () => {
  it('returns empty blocks when no workout element present', () => {
    const { blocks } = parseZwo('<workout_file><name>x</name></workout_file>');
    expect(blocks).toHaveLength(0);
  });

  it('assigns unique ids to blocks', () => {
    const xml = makeXml(`
      <SteadyState Duration="300" Power="0.75"/>
      <SteadyState Duration="600" Power="0.80"/>
    `);
    const { blocks } = parseZwo(xml);
    expect(blocks[0].id).not.toBe(blocks[1].id);
  });
});

import type {
  WorkoutBlock,
  WorkoutMeta,
  WarmupBlock,
  CooldownBlock,
  SteadyStateBlock,
  RampBlock,
  IntervalsTBlock,
  FreeRideBlock,
  MaxEffortBlock,
} from '../types/workout';
import { nanoid } from './nanoid';

/** Parse a ZWO XML string into blocks and meta */
export function parseZwo(xml: string): {
  blocks: WorkoutBlock[];
  meta: Partial<WorkoutMeta>;
} {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'application/xml');

  const meta: Partial<WorkoutMeta> = {
    name: getText(doc, 'name') || 'Imported Workout',
    author: getText(doc, 'author') || '',
    description: getText(doc, 'description') || '',
    sportType: (getText(doc, 'sportType') || 'bike') as 'bike' | 'run',
  };

  const workoutEl = doc.querySelector('workout');
  if (!workoutEl) return { blocks: [], meta };

  const blocks: WorkoutBlock[] = [];

  for (const child of Array.from(workoutEl.children)) {
    const tag = child.tagName;
    const dur = num(child, 'Duration');
    const cadence = numOpt(child, 'Cadence');

    switch (tag) {
      case 'Warmup': {
        const b: WarmupBlock = {
          id: nanoid(),
          type: 'Warmup',
          duration: dur || 600,
          powerLow: num(child, 'PowerLow') || 0.45,
          powerHigh: num(child, 'PowerHigh') || 0.75,
        };
        if (cadence !== undefined) b.cadence = cadence;
        blocks.push(b);
        break;
      }
      case 'Cooldown': {
        const b: CooldownBlock = {
          id: nanoid(),
          type: 'Cooldown',
          duration: dur || 600,
          powerLow: num(child, 'PowerLow') || 0.45,
          powerHigh: num(child, 'PowerHigh') || 0.75,
        };
        if (cadence !== undefined) b.cadence = cadence;
        blocks.push(b);
        break;
      }
      case 'SteadyState': {
        const b: SteadyStateBlock = {
          id: nanoid(),
          type: 'SteadyState',
          duration: dur || 300,
          power: num(child, 'Power') || 0.75,
        };
        if (cadence !== undefined) b.cadence = cadence;
        blocks.push(b);
        break;
      }
      case 'Ramp': {
        const b: RampBlock = {
          id: nanoid(),
          type: 'Ramp',
          duration: dur || 300,
          powerLow: num(child, 'PowerLow') || 0.45,
          powerHigh: num(child, 'PowerHigh') || 1.0,
        };
        if (cadence !== undefined) b.cadence = cadence;
        blocks.push(b);
        break;
      }
      case 'IntervalsT': {
        const repeat = numInt(child, 'Repeat') || 4;
        const onDur = num(child, 'OnDuration') || 60;
        const offDur = num(child, 'OffDuration') || 60;
        const b: IntervalsTBlock = {
          id: nanoid(),
          type: 'IntervalsT',
          repeat,
          onDuration: onDur,
          onPower: num(child, 'OnPower') || 1.0,
          offDuration: offDur,
          offPower: num(child, 'OffPower') || 0.55,
          duration: repeat * (onDur + offDur),
        };
        const oc = numOpt(child, 'Cadence');
        if (oc !== undefined) b.onCadence = oc;
        const rc = numOpt(child, 'CadenceResting');
        if (rc !== undefined) b.offCadence = rc;
        blocks.push(b);
        break;
      }
      case 'FreeRide': {
        const b: FreeRideBlock = {
          id: nanoid(),
          type: 'FreeRide',
          duration: dur || 300,
        };
        blocks.push(b);
        break;
      }
      case 'MaxEffort': {
        const b: MaxEffortBlock = {
          id: nanoid(),
          type: 'MaxEffort',
          duration: dur || 30,
        };
        blocks.push(b);
        break;
      }
    }
  }

  return { blocks, meta };
}

// ---- helpers ----

function getText(doc: Document, tag: string): string {
  return doc.querySelector(tag)?.textContent?.trim() ?? '';
}

function num(el: Element, attr: string): number {
  const v = el.getAttribute(attr) ?? el.getAttribute(attr.toLowerCase()) ?? el.getAttribute(attr.toUpperCase());
  return v ? parseFloat(v) : 0;
}

function numOpt(el: Element, attr: string): number | undefined {
  const v = el.getAttribute(attr) ?? el.getAttribute(attr.toLowerCase());
  return v != null ? parseFloat(v) : undefined;
}

function numInt(el: Element, attr: string): number {
  return Math.round(num(el, attr));
}

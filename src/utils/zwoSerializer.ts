import type { WorkoutBlock, WorkoutMeta } from '../types/workout';

/** Serialize blocks and meta to a ZWO XML string */
export function serializeZwo(blocks: WorkoutBlock[], meta: WorkoutMeta): string {
  const lines: string[] = [];

  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push('<workout_file>');
  lines.push(`  <name>${esc(meta.name)}</name>`);
  lines.push(`  <author>${esc(meta.author)}</author>`);
  lines.push(`  <description>${esc(meta.description)}</description>`);
  lines.push(`  <sportType>${esc(meta.sportType)}</sportType>`);
  lines.push('  <workout>');

  for (const block of blocks) {
    const cad = block.cadence != null ? ` Cadence="${block.cadence}"` : '';

    switch (block.type) {
      case 'Warmup':
        lines.push(`    <Warmup Duration="${block.duration}" PowerLow="${fmt(block.powerLow)}" PowerHigh="${fmt(block.powerHigh)}"${cad}/>`);
        break;
      case 'Cooldown':
        lines.push(`    <Cooldown Duration="${block.duration}" PowerLow="${fmt(block.powerLow)}" PowerHigh="${fmt(block.powerHigh)}"${cad}/>`);
        break;
      case 'SteadyState':
        lines.push(`    <SteadyState Duration="${block.duration}" Power="${fmt(block.power)}"${cad}/>`);
        break;
      case 'Ramp':
        lines.push(`    <Ramp Duration="${block.duration}" PowerLow="${fmt(block.powerLow)}" PowerHigh="${fmt(block.powerHigh)}"${cad}/>`);
        break;
      case 'IntervalsT': {
        const ocad = block.onCadence != null ? ` Cadence="${block.onCadence}"` : cad;
        const rcad = block.offCadence != null ? ` CadenceResting="${block.offCadence}"` : '';
        lines.push(
          `    <IntervalsT Repeat="${block.repeat}" OnDuration="${block.onDuration}" OnPower="${fmt(block.onPower)}" OffDuration="${block.offDuration}" OffPower="${fmt(block.offPower)}"${ocad}${rcad}/>`
        );
        break;
      }
      case 'FreeRide':
        lines.push(`    <FreeRide Duration="${block.duration}" FlatRoad="0"/>`);
        break;
      case 'MaxEffort':
        lines.push(`    <MaxEffort Duration="${block.duration}"/>`);
        break;
    }
  }

  lines.push('  </workout>');
  lines.push('</workout_file>');

  return lines.join('\n');
}

/** Round to 4 decimal places to avoid floating noise */
function fmt(n: number): string {
  return parseFloat(n.toFixed(4)).toString();
}

/** XML-escape text content */
function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Trigger browser download of a ZWO file */
export function downloadZwo(xml: string, filename: string): void {
  const blob = new Blob([xml], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.zwo') ? filename : filename + '.zwo';
  a.click();
  URL.revokeObjectURL(url);
}

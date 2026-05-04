import type { WorkoutBlock, IntervalsTBlock } from '../types/workout';

/** Total duration of any block in seconds */
export function blockDuration(block: WorkoutBlock): number {
  if (block.type === 'IntervalsT') {
    const b = block as IntervalsTBlock;
    return b.repeat * (b.onDuration + b.offDuration);
  }
  return block.duration;
}

export function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.round(seconds % 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s > 0 ? s + 's' : ''}`.trim();
  return `${s}s`;
}

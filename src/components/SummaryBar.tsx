import { useMemo } from 'react';
import { useWorkoutStore } from '../store/workoutStore';
import { blockDuration } from '../utils/workout';
import type { WorkoutBlock, IntervalsTBlock, SteadyStateBlock, WarmupBlock, CooldownBlock, RampBlock } from '../types/workout';

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.round(seconds % 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s > 0 ? s + 's' : ''}`.trim();
  return `${s}s`;
}

/** Rough NP / IF based TSS estimate */
function estimateTss(blocks: WorkoutBlock[], ftp: number): number {
  if (!blocks.length || ftp <= 0) return 0;
  let weightedSum = 0;
  let totalSeconds = 0;

  for (const block of blocks) {
    const dur = blockDuration(block);
    let avgPower = 0;

    if (block.type === 'SteadyState') {
      avgPower = (block as SteadyStateBlock).power;
    } else if (block.type === 'Warmup') {
      const b = block as WarmupBlock;
      avgPower = (b.powerLow + b.powerHigh) / 2;
    } else if (block.type === 'Cooldown') {
      const b = block as CooldownBlock;
      avgPower = (b.powerLow + b.powerHigh) / 2;
    } else if (block.type === 'Ramp') {
      const b = block as RampBlock;
      avgPower = (b.powerLow + b.powerHigh) / 2;
    } else if (block.type === 'IntervalsT') {
      const b = block as IntervalsTBlock;
      avgPower = (b.onPower * b.onDuration + b.offPower * b.offDuration) / (b.onDuration + b.offDuration);
    } else if (block.type === 'FreeRide') {
      avgPower = 0.65;
    } else if (block.type === 'MaxEffort') {
      avgPower = 1.4;
    }

    weightedSum += avgPower * avgPower * dur;
    totalSeconds += dur;
  }

  if (totalSeconds === 0) return 0;
  const np = Math.sqrt(Math.sqrt(weightedSum / totalSeconds));
  const if_ = np;
  return Math.round((totalSeconds / 3600) * if_ * if_ * 100);
}

export default function SummaryBar() {
  const { blocks, meta } = useWorkoutStore();
  const totalDuration = useMemo(() => blocks.reduce((s, b) => s + blockDuration(b), 0), [blocks]);
  const tss = useMemo(() => estimateTss(blocks, meta.ftp), [blocks, meta.ftp]);

  return (
    <div className="flex gap-6 items-center px-4 py-2 bg-gray-900 border-t border-gray-800 text-sm">
      <div className="flex items-center gap-2">
        <span className="text-gray-400">Total time:</span>
        <span className="text-white font-semibold">{formatTime(totalDuration)}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-gray-400">Blocks:</span>
        <span className="text-white font-semibold">{blocks.length}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-gray-400">Est. TSS:</span>
        <span className="text-orange-400 font-semibold">{tss}</span>
      </div>
    </div>
  );
}

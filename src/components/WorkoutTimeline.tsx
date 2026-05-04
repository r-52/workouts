import {
  SortableContext,
  useSortable,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useWorkoutStore } from '../store/workoutStore';
import type { WorkoutBlock, IntervalsTBlock, WarmupBlock, CooldownBlock, RampBlock, SteadyStateBlock } from '../types/workout';
import { getZoneColor, pctStr } from '../utils/zones';
import { blockDuration } from '../utils/workout';

const BLOCK_TYPE_ICONS: Record<string, string> = {
  Warmup: '🌅',
  SteadyState: '📊',
  IntervalsT: '⚡',
  Ramp: '📈',
  FreeRide: '🚴',
  MaxEffort: '💥',
  Cooldown: '🌙',
};

function formatDur(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m${s > 0 ? s + 's' : ''}` : `${s}s`;
}

function blockSummary(block: WorkoutBlock): string {
  if (block.type === 'IntervalsT') {
    const b = block as IntervalsTBlock;
    return `${b.repeat}×${formatDur(b.onDuration)} @ ${pctStr(b.onPower)}`;
  }
  if (block.type === 'Warmup') {
    const b = block as WarmupBlock;
    return `${pctStr(b.powerLow)}→${pctStr(b.powerHigh)}`;
  }
  if (block.type === 'Cooldown') {
    const b = block as CooldownBlock;
    return `${pctStr(b.powerLow)}→${pctStr(b.powerHigh)}`;
  }
  if (block.type === 'Ramp') {
    const b = block as RampBlock;
    return `${pctStr(b.powerLow)}→${pctStr(b.powerHigh)}`;
  }
  if (block.type === 'SteadyState') {
    return pctStr((block as SteadyStateBlock).power);
  }
  return '';
}

function blockAccentColor(block: WorkoutBlock): string {
  if (block.type === 'Warmup') return '#60a5fa';
  if (block.type === 'Cooldown') return '#34d399';
  if (block.type === 'IntervalsT') {
    const b = block as IntervalsTBlock;
    return getZoneColor(b.onPower);
  }
  if (block.type === 'SteadyState') return getZoneColor((block as SteadyStateBlock).power);
  if (block.type === 'Ramp') return '#a78bfa';
  if (block.type === 'FreeRide') return '#9ca3af';
  if (block.type === 'MaxEffort') return '#ef4444';
  return '#9ca3af';
}

function SortableBlock({ block }: { block: WorkoutBlock }) {
  const { selectedBlockId, setSelectedBlockId, removeBlock } = useWorkoutStore();
  const isSelected = block.id === selectedBlockId;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id, data: { source: 'timeline', block } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const accent = blockAccentColor(block);
  const dur = blockDuration(block);

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, minWidth: 100 }}
      className={`
        relative flex-shrink-0 flex flex-col rounded-lg border transition-all duration-150 select-none
        ${isSelected
          ? 'border-orange-500 bg-gray-700 shadow-lg shadow-orange-900/30'
          : 'border-gray-700 bg-gray-800 hover:border-gray-500'
        }
      `}
      onClick={() => setSelectedBlockId(isSelected ? null : block.id)}
    >
      {/* colour stripe */}
      <div className="h-1 rounded-t-lg" style={{ background: accent }} />

      <div className="flex items-start gap-1 p-2 pr-1">
        {/* drag handle */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-500 hover:text-gray-300 pt-0.5 shrink-0"
          title="Drag to reorder"
          onClick={(e) => e.stopPropagation()}
        >
          ⠿
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className="text-sm">{BLOCK_TYPE_ICONS[block.type] ?? '▪'}</span>
            <span className="text-xs font-semibold text-white truncate">{block.type}</span>
          </div>
          <div className="text-xs text-gray-400 mt-0.5">{formatDur(dur)}</div>
          {blockSummary(block) && (
            <div className="text-xs text-gray-500 truncate">{blockSummary(block)}</div>
          )}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); removeBlock(block.id); }}
          className="text-gray-600 hover:text-red-400 p-0.5 rounded shrink-0 transition-colors"
          title="Delete"
        >
          ×
        </button>
      </div>
    </div>
  );
}

export default function WorkoutTimeline() {
  const { blocks } = useWorkoutStore();
  const { setNodeRef, isOver } = useDroppable({ id: 'timeline-droppable' });

  return (
    <div
      ref={setNodeRef}
      className={`
        mx-4 mb-4 mt-3 min-h-[100px] rounded-lg border-2 transition-colors duration-150
        ${isOver
          ? 'border-orange-500 bg-orange-950/20'
          : blocks.length === 0
            ? 'border-dashed border-gray-700 bg-gray-900/50'
            : 'border-gray-800 bg-gray-900/30'
        }
      `}
    >
      {blocks.length === 0 ? (
        <div className="flex items-center justify-center h-full min-h-[90px] text-gray-600 text-sm">
          Drag blocks here to start building
        </div>
      ) : (
        <SortableContext items={blocks.map((b) => b.id)} strategy={horizontalListSortingStrategy}>
          <div className="flex gap-2 overflow-x-auto p-3 items-start">
            {blocks.map((block) => (
              <SortableBlock key={block.id} block={block} />
            ))}
          </div>
        </SortableContext>
      )}
    </div>
  );
}

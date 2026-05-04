import { useState, useEffect } from 'react';
import {
  DndContext,
  type DragEndEvent,
  type DragStartEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import { useWorkoutStore } from './store/workoutStore';
import { readWorkoutFromHash } from './utils/shareUrl';
import type { BlockType } from './types/workout';
import WorkoutMeta from './components/WorkoutMeta';
import BlockPalette from './components/BlockPalette';
import PowerChart from './components/PowerChart';
import WorkoutTimeline from './components/WorkoutTimeline';
import BlockEditor from './components/BlockEditor';
import ImportExport from './components/ImportExport';
import SummaryBar from './components/SummaryBar';
import QuickBuild from './components/QuickBuild';
import type {
  WarmupBlock, CooldownBlock, SteadyStateBlock, RampBlock, IntervalsTBlock,
  FreeRideBlock, MaxEffortBlock,
} from './types/workout';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function defaultBlock(type: BlockType): any {
  switch (type) {
    case 'Warmup':
      return { type, duration: 600, powerLow: 0.45, powerHigh: 0.75, cadence: 85 } as Omit<WarmupBlock, 'id'>;
    case 'Cooldown':
      return { type, duration: 300, powerLow: 0.75, powerHigh: 0.45, cadence: 85 } as Omit<CooldownBlock, 'id'>;
    case 'SteadyState':
      return { type, duration: 600, power: 0.75 } as Omit<SteadyStateBlock, 'id'>;
    case 'Ramp':
      return { type, duration: 600, powerLow: 0.45, powerHigh: 1.0 } as Omit<RampBlock, 'id'>;
    case 'IntervalsT':
      return {
        type, duration: 4 * (60 + 60), repeat: 4,
        onDuration: 60, onPower: 1.05, offDuration: 60, offPower: 0.55,
      } as Omit<IntervalsTBlock, 'id'>;
    case 'FreeRide':
      return { type, duration: 600 } as Omit<FreeRideBlock, 'id'>;
    case 'MaxEffort':
      return { type, duration: 30 } as Omit<MaxEffortBlock, 'id'>;
  }
}

const BLOCK_LABELS: Record<BlockType, string> = {
  Warmup: '🌅 Warm Up',
  Cooldown: '🌙 Cool Down',
  SteadyState: '📊 Steady State',
  Ramp: '📈 Ramp',
  IntervalsT: '⚡ Intervals',
  FreeRide: '🚴 Free Ride',
  MaxEffort: '💥 Max Effort',
};

function ActiveDragPreview({ type }: { type: BlockType }) {
  return (
    <div className="bg-gray-800 border-2 border-orange-500 text-white rounded-lg px-3 py-2 text-sm font-semibold shadow-2xl cursor-grabbing select-none">
      {BLOCK_LABELS[type]}
    </div>
  );
}

export default function App() {
  const { blocks, addBlock, moveBlock, importBlocks } = useWorkoutStore();

  useEffect(() => {
    const workout = readWorkoutFromHash();
    if (workout) {
      importBlocks(workout.blocks, workout.meta);
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [activePaletteType, setActivePaletteType] = useState<BlockType | null>(null);
  const [showQuickBuild, setShowQuickBuild] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current;
    if (data?.source === 'palette') {
      setActivePaletteType(data.blockType as BlockType);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActivePaletteType(null);
    const { active, over } = event;
    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    if (activeData?.source === 'palette') {
      const blockType = activeData.blockType as BlockType;
      const newBlock = defaultBlock(blockType);
      if (overData?.source === 'timeline') {
        const overIndex = blocks.findIndex((b) => b.id === over.id);
        addBlock(newBlock, overIndex >= 0 ? overIndex : undefined);
      } else {
        addBlock(newBlock);
      }
      return;
    }

    if (activeData?.source === 'timeline' && active.id !== over.id) {
      const oldIndex = blocks.findIndex((b) => b.id === active.id);
      const newIndex = blocks.findIndex((b) => b.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        moveBlock(oldIndex, newIndex);
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="h-screen flex flex-col bg-gray-950 text-white overflow-hidden">
        <header className="flex items-center gap-4 bg-gray-900 border-b border-gray-700 shrink-0">
          <div className="flex items-center gap-2 px-4 py-3 border-r border-gray-700 shrink-0">
            <span className="text-orange-500 font-black text-lg tracking-tight">⚡</span>
            <span className="text-white font-bold text-base tracking-tight">ZWO Builder</span>
          </div>
          <div className="flex-1 min-w-0">
            <WorkoutMeta />
          </div>
          <div className="px-4 shrink-0 flex items-center gap-2">
            <button
              onClick={() => setShowQuickBuild(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium bg-gray-700 text-gray-200 border border-gray-600 hover:bg-gray-600 transition-colors"
              title="Build workout from text shorthand"
            >
              ✏️ Quick Build
            </button>
            <ImportExport />
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          <BlockPalette />
          <div className="flex-1 flex flex-col overflow-hidden min-w-0">
            <div className="flex-1 overflow-y-auto">
              <PowerChart />
              <WorkoutTimeline />
            </div>
            <SummaryBar />
            <footer className="text-center text-xs text-gray-600 py-1 border-t border-gray-800 shrink-0">
              Not affiliated with or endorsed by Zwift, Inc. &middot; ZWO Builder is an independent open-source tool.
            </footer>
          </div>
          <BlockEditor />
        </div>
      </div>

      <DragOverlay dropAnimation={{ duration: 150, easing: 'ease' }}>
        {activePaletteType ? <ActiveDragPreview type={activePaletteType} /> : null}
      </DragOverlay>

      {showQuickBuild && <QuickBuild onClose={() => setShowQuickBuild(false)} />}
    </DndContext>
  );
}

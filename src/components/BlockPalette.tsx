import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { BlockType } from '../types/workout';

interface PaletteItem {
  type: BlockType;
  label: string;
  icon: string;
  desc: string;
  color: string;
}

const PALETTE_ITEMS: PaletteItem[] = [
  { type: 'Warmup',       label: 'Warm Up',      icon: '🌅', desc: 'Ramp up gradually',    color: 'from-blue-500 to-green-500' },
  { type: 'SteadyState',  label: 'Steady State', icon: '📊', desc: 'Constant power',        color: 'from-yellow-500 to-yellow-400' },
  { type: 'IntervalsT',   label: 'Intervals',    icon: '⚡', desc: 'Repeating on/off',      color: 'from-orange-500 to-red-500' },
  { type: 'Ramp',         label: 'Ramp',         icon: '📈', desc: 'Linear power change',   color: 'from-purple-500 to-orange-500' },
  { type: 'FreeRide',     label: 'Free Ride',    icon: '🚴', desc: 'No ERG, ride free',     color: 'from-gray-500 to-gray-400' },
  { type: 'MaxEffort',    label: 'Max Effort',   icon: '💥', desc: 'All-out sprint',         color: 'from-red-600 to-pink-500' },
  { type: 'Cooldown',     label: 'Cool Down',    icon: '🌙', desc: 'Ramp down gradually',   color: 'from-green-500 to-blue-500' },
];

function DraggablePaletteItem({ item }: { item: PaletteItem }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `palette-${item.type}`,
    data: { source: 'palette', blockType: item.type },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`
        cursor-grab active:cursor-grabbing
        rounded-lg p-3 mb-2
        bg-gray-800 border border-gray-700
        hover:border-orange-500 hover:bg-gray-750
        transition-all duration-150 select-none
        ${isDragging ? 'shadow-2xl ring-2 ring-orange-500' : ''}
      `}
      title={`Drag to add ${item.label}`}
    >
      <div className="flex items-center gap-2">
        <span className="text-lg">{item.icon}</span>
        <div>
          <div className="text-sm font-semibold text-white">{item.label}</div>
          <div className="text-xs text-gray-400">{item.desc}</div>
        </div>
      </div>
    </div>
  );
}

export default function BlockPalette() {
  return (
    <div className="w-52 flex-shrink-0 bg-gray-900 border-r border-gray-700 flex flex-col">
      <div className="px-3 py-3 border-b border-gray-700">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Blocks</h2>
        <p className="text-xs text-gray-500 mt-1">Drag onto the timeline</p>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        {PALETTE_ITEMS.map((item) => (
          <DraggablePaletteItem key={item.type} item={item} />
        ))}
      </div>
    </div>
  );
}

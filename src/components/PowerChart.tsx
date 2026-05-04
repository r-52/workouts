import { useMemo } from 'react';
import { useWorkoutStore } from '../store/workoutStore';
import type { WorkoutBlock, IntervalsTBlock } from '../types/workout';
import { getZoneColor, pctStr, toWatts } from '../utils/zones';
import { blockDuration } from '../utils/workout';

interface Segment {
  blockId: string;
  x: number;        // 0..1 fraction of total width
  w: number;        // 0..1 fraction of total width
  y: number;        // top: 1.0 = full height, 0 = nothing
  y2?: number;      // for ramps: end y (draw polygon from y at left to y2 at right)
  color: string;
  isSelected: boolean;
  label: string;
  power?: number;   // avg power fraction for tooltip
  type: string;
}

const CHART_HEIGHT = 180;
const POWER_MAX = 1.6; // max % FTP shown in chart

function powerToY(p: number): number {
  // returns a value 0..1 where 1 = full chart height
  return Math.min(p / POWER_MAX, 1);
}

/** Flatten a block to renderable segments */
function blockToSegments(
  block: WorkoutBlock,
  xStart: number,
  totalDuration: number,
  isSelected: boolean
): Segment[] {
  const blockDur = blockDuration(block);
  const w = blockDur / totalDuration;

  if (block.type === 'IntervalsT') {
    const b = block as IntervalsTBlock;
    const segs: Segment[] = [];
    const intervalDur = b.onDuration + b.offDuration;
    const intervalW = intervalDur / totalDuration;
    const onW = b.onDuration / totalDuration;
    const offW = b.offDuration / totalDuration;

    for (let i = 0; i < b.repeat; i++) {
      const ix = xStart + i * intervalW;
      segs.push({
        blockId: block.id,
        x: ix,
        w: onW,
        y: powerToY(b.onPower),
        color: getZoneColor(b.onPower),
        isSelected,
        label: i === 0 ? `${b.repeat}×${Math.round(b.onDuration)}s` : '',
        power: b.onPower,
        type: block.type,
      });
      segs.push({
        blockId: block.id,
        x: ix + onW,
        w: offW,
        y: powerToY(b.offPower),
        color: getZoneColor(b.offPower),
        isSelected,
        label: '',
        power: b.offPower,
        type: block.type,
      });
    }
    return segs;
  }

  if (block.type === 'Warmup' || block.type === 'Cooldown' || block.type === 'Ramp') {
    const pl = 'powerLow' in block ? block.powerLow : 0.5;
    const ph = 'powerHigh' in block ? block.powerHigh : 0.75;
    const avgP = (pl + ph) / 2;
    return [{
      blockId: block.id,
      x: xStart,
      w,
      y: block.type === 'Cooldown' ? powerToY(ph) : powerToY(pl),
      y2: block.type === 'Cooldown' ? powerToY(pl) : powerToY(ph),
      color: getZoneColor(avgP),
      isSelected,
      label: block.type,
      power: avgP,
      type: block.type,
    }];
  }

  if (block.type === 'FreeRide') {
    return [{
      blockId: block.id,
      x: xStart,
      w,
      y: powerToY(0.65),
      color: '#6b7280',
      isSelected,
      label: 'Free Ride',
      power: 0.65,
      type: block.type,
    }];
  }

  if (block.type === 'MaxEffort') {
    return [{
      blockId: block.id,
      x: xStart,
      w,
      y: powerToY(1.5),
      color: '#ef4444',
      isSelected,
      label: 'Max',
      power: 1.5,
      type: block.type,
    }];
  }

  // SteadyState
  const p = 'power' in block ? block.power : 0.75;
  return [{
    blockId: block.id,
    x: xStart,
    w,
    y: powerToY(p),
    color: getZoneColor(p),
    isSelected,
    label: `${pctStr(p)}`,
    power: p,
    type: block.type,
  }];
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.round(seconds % 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s > 0 ? s + 's' : ''}`.trim();
  return `${s}s`;
}

export default function PowerChart() {
  const { blocks, selectedBlockId, setSelectedBlockId, meta } = useWorkoutStore();

  const totalDuration = useMemo(
    () => blocks.reduce((s, b) => s + blockDuration(b), 0),
    [blocks]
  );

  const segments = useMemo(() => {
    if (totalDuration === 0) return [];
    let xCursor = 0;
    return blocks.flatMap((block) => {
      const segs = blockToSegments(block, xCursor, totalDuration, block.id === selectedBlockId);
      xCursor += blockDuration(block) / totalDuration;
      return segs;
    });
  }, [blocks, totalDuration, selectedBlockId]);

  const W = 800;
  const H = CHART_HEIGHT;
  const PAD_LEFT = 36;
  const PAD_BOT = 20;
  const chartW = W - PAD_LEFT;

  // zone lines (FTP percentages)
  const zoneLines = [0.60, 0.76, 0.90, 1.05, 1.19].map((p) => ({
    y: H - PAD_BOT - powerToY(p) * (H - PAD_BOT),
    label: `${Math.round(p * 100)}%`,
  }));

  if (blocks.length === 0) {
    return (
      <div
        className="flex-1 flex items-center justify-center bg-gray-950 rounded-lg border-2 border-dashed border-gray-700 mx-4 mt-4"
        style={{ minHeight: CHART_HEIGHT + 40 }}
      >
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-3">🚴</div>
          <div className="text-lg font-semibold">Drop blocks here to build your workout</div>
          <div className="text-sm mt-1">Drag blocks from the left panel onto the timeline below</div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-4">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full rounded-lg bg-gray-950 border border-gray-800"
        style={{ height: H }}
        aria-label="Workout power profile chart"
      >
        {/* Zone reference lines */}
        {zoneLines.map(({ y, label }) => (
          <g key={label}>
            <line
              x1={PAD_LEFT} y1={y}
              x2={W} y2={y}
              stroke="#374151" strokeWidth="0.5" strokeDasharray="4,4"
            />
            <text x={PAD_LEFT - 4} y={y + 4} textAnchor="end" fontSize="9" fill="#6b7280">
              {label}
            </text>
          </g>
        ))}

        {/* 100% FTP line */}
        {(() => {
          const y = H - PAD_BOT - powerToY(1.0) * (H - PAD_BOT);
          return (
            <line x1={PAD_LEFT} y1={y} x2={W} y2={y}
              stroke="#f97316" strokeWidth="0.8" strokeDasharray="6,3" opacity="0.4" />
          );
        })()}

        {/* Power bars */}
        {segments.map((seg, i) => {
          const x = PAD_LEFT + seg.x * chartW;
          const segW = Math.max(seg.w * chartW - 0.5, 0.5);
          const opacity = seg.isSelected ? 1.0 : 0.82;
          const stroke = seg.isSelected ? '#f97316' : 'transparent';
          const strokeW = seg.isSelected ? 1.5 : 0;

          if (seg.y2 !== undefined) {
            // Trapezoid / ramp
            const yTop1 = H - PAD_BOT - seg.y * (H - PAD_BOT);
            const yTop2 = H - PAD_BOT - seg.y2 * (H - PAD_BOT);
            const yBot = H - PAD_BOT;
            const pts = [
              `${x},${yTop1}`,
              `${x + segW},${yTop2}`,
              `${x + segW},${yBot}`,
              `${x},${yBot}`,
            ].join(' ');
            return (
              <polygon
                key={i}
                points={pts}
                fill={seg.color}
                opacity={opacity}
                stroke={stroke}
                strokeWidth={strokeW}
                style={{ cursor: 'pointer' }}
                onClick={() => setSelectedBlockId(seg.blockId)}
              />
            );
          }

          const barH = seg.y * (H - PAD_BOT);
          const y = H - PAD_BOT - barH;
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={segW}
              height={barH}
              fill={seg.color}
              opacity={opacity}
              stroke={stroke}
              strokeWidth={strokeW}
              style={{ cursor: 'pointer' }}
              onClick={() => setSelectedBlockId(seg.blockId)}
            >
              <title>
                {seg.type}{seg.power != null ? ` — ${pctStr(seg.power)} FTP / ~${toWatts(seg.power, meta.ftp)}W` : ''}
                {seg.label ? `\n${seg.label}` : ''}
              </title>
            </rect>
          );
        })}

        {/* Baseline */}
        <line
          x1={PAD_LEFT} y1={H - PAD_BOT}
          x2={W} y2={H - PAD_BOT}
          stroke="#4b5563" strokeWidth="1"
        />

        {/* Time labels */}
        {totalDuration > 0 && (() => {
          const labels: React.ReactNode[] = [];
          const intervals = [300, 600, 900, 1200, 1800, 3600];
          const step = intervals.find((i) => totalDuration / i <= 8) ?? 3600;
          for (let t = step; t < totalDuration; t += step) {
            const lx = PAD_LEFT + (t / totalDuration) * chartW;
            labels.push(
              <g key={t}>
                <line x1={lx} y1={H - PAD_BOT} x2={lx} y2={H - PAD_BOT + 4} stroke="#6b7280" strokeWidth="0.8" />
                <text x={lx} y={H - 4} textAnchor="middle" fontSize="9" fill="#6b7280">
                  {formatTime(t)}
                </text>
              </g>
            );
          }
          return labels;
        })()}
      </svg>
    </div>
  );
}

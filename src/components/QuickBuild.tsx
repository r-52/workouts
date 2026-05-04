import { useState, useMemo } from 'react';
import { useWorkoutStore } from '../store/workoutStore';
import { parseWorkoutText, previewLine } from '../utils/workoutTextParser';
import { blockDuration } from '../utils/workout';
import { formatDurationCompact } from '../utils/parseDuration';
import type { WorkoutBlock } from '../types/workout';

const BLOCK_TYPE_ICONS: Record<string, string> = {
  Warmup: '🌅', Cooldown: '🌙', SteadyState: '📊',
  Ramp: '📈', IntervalsT: '⚡', FreeRide: '🚴', MaxEffort: '💥',
};

const EXAMPLE = `# Week 3, Day 2 — Sweet Spot intervals
10m warmup 45-75%
5m @ 60%
4x 8m @ 88% / 4m @ 55%
10m cooldown 65-45%`;

const SYNTAX_HELP = [
  { example: '10m warmup 45-75%',         label: 'Warm Up ramp' },
  { example: '20m @ 75%',                 label: 'Steady State' },
  { example: '4x 3m @ 110% / 2m @ 55%',  label: 'Intervals (verbose)' },
  { example: '4x 3m/2m @ 110%/55%',       label: 'Intervals (compact)' },
  { example: '5m ramp 50-100%',           label: 'Ramp' },
  { example: '10m free',                  label: 'Free Ride' },
  { example: '30s max',                   label: 'Max Effort' },
  { example: '5m cooldown 75-45%',        label: 'Cool Down' },
];

export default function QuickBuild({ onClose }: { onClose: () => void }) {
  const { blocks, importBlocks } = useWorkoutStore();
  const [text, setText] = useState(EXAMPLE);

  const results = useMemo(() => parseWorkoutText(text), [text]);
  const validBlocks = useMemo(
    () => results.filter((r) => r.block).map((r) => r.block as WorkoutBlock),
    [results]
  );
  const hasErrors = results.some((r) => r.error);
  const totalDur = validBlocks.reduce((s, b) => s + blockDuration(b), 0);

  const handleAppend = () => {
    if (!validBlocks.length) return;
    importBlocks([...blocks, ...validBlocks]);
    onClose();
  };

  const handleReplace = () => {
    if (!validBlocks.length) return;
    importBlocks(validBlocks);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-4xl flex flex-col overflow-hidden"
        style={{ maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700 shrink-0">
          <div>
            <h2 className="text-base font-bold text-white">Quick Build</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Write your workout in shorthand — one block per line. Lines starting with <code className="text-gray-300">#</code> are comments.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-200 text-2xl leading-none ml-4"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex flex-1 overflow-hidden divide-x divide-gray-700">

          {/* Left: textarea */}
          <div className="flex-1 flex flex-col gap-3 p-4 overflow-y-auto">
            <textarea
              autoFocus
              rows={12}
              className="w-full bg-gray-800 text-white text-sm font-mono rounded border border-gray-600 focus:outline-none focus:border-orange-500 px-3 py-2 resize-none leading-relaxed"
              value={text}
              onChange={(e) => setText(e.target.value)}
              spellCheck={false}
              aria-label="Workout text"
            />

            {/* Syntax reference */}
            <div className="bg-gray-800/60 rounded-lg p-3">
              <div className="text-xs font-semibold text-gray-300 mb-2">Syntax reference</div>
              <div className="grid grid-cols-1 gap-0.5">
                {SYNTAX_HELP.map(({ example, label }) => (
                  <div key={label} className="flex items-baseline gap-2 text-xs">
                    <code
                      className="text-orange-300 font-mono cursor-pointer hover:text-orange-200 transition-colors"
                      title="Click to insert"
                      onClick={() => setText((t) => t + '\n' + example)}
                    >
                      {example}
                    </code>
                    <span className="text-gray-500">{label}</span>
                  </div>
                ))}
              </div>
              <div className="mt-2 pt-2 border-t border-gray-700 text-xs text-gray-500 space-y-0.5">
                <div>Duration: <code className="text-gray-400">10m</code>, <code className="text-gray-400">1m30s</code>, <code className="text-gray-400">90s</code>, <code className="text-gray-400">1:30</code></div>
                <div>Power: <code className="text-gray-400">75%</code>, <code className="text-gray-400">0.75</code>, <code className="text-gray-400">110</code> (bare number &gt;2 = %)</div>
              </div>
            </div>
          </div>

          {/* Right: live preview */}
          <div className="w-64 shrink-0 flex flex-col p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-3 shrink-0">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Preview
              </span>
              <span className="text-xs text-gray-500">
                {validBlocks.length} blocks · {formatDurationCompact(totalDur)}
              </span>
            </div>

            {results.length === 0 && (
              <p className="text-xs text-gray-600">Start typing to preview…</p>
            )}

            <div className="space-y-1.5">
              {results.map((r, i) => (
                <div
                  key={i}
                  className={`rounded-lg px-3 py-2 text-xs border ${
                    r.error
                      ? 'bg-red-950/40 border-red-700/50 text-red-400'
                      : 'bg-gray-800 border-gray-700'
                  }`}
                >
                  {r.error ? (
                    <span>{r.error}</span>
                  ) : r.block ? (
                    <div className="flex items-start gap-2">
                      <span className="text-base leading-none mt-0.5">
                        {BLOCK_TYPE_ICONS[r.block.type] ?? '▪'}
                      </span>
                      <span className="text-gray-300 leading-snug font-mono">
                        {previewLine(r)}
                      </span>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>

            {hasErrors && (
              <p className="text-xs text-yellow-500 mt-3 italic">
                Blocks with errors will be skipped.
              </p>
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-700 shrink-0">
          <button
            onClick={onClose}
            className="text-sm text-gray-400 hover:text-gray-200 transition-colors"
          >
            Cancel
          </button>
          <div className="flex gap-2">
            <button
              onClick={handleAppend}
              disabled={validBlocks.length === 0}
              className="px-4 py-1.5 rounded text-sm font-medium bg-gray-700 text-gray-200 border border-gray-600 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Append to workout
            </button>
            <button
              onClick={handleReplace}
              disabled={validBlocks.length === 0}
              className="px-4 py-1.5 rounded text-sm font-medium bg-orange-600 text-white hover:bg-orange-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Replace workout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

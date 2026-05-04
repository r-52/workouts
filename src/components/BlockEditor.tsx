import type { ReactNode } from 'react';
import { useState } from 'react';
import { useWorkoutStore } from '../store/workoutStore';
import { parseDuration, formatDurationCompact } from '../utils/parseDuration';
import type {
  IntervalsTBlock,
  WarmupBlock,
  CooldownBlock,
  SteadyStateBlock,
  RampBlock,
  FreeRideBlock,
  MaxEffortBlock,
} from '../types/workout';
import { pctStr, toWatts } from '../utils/zones';

function Label({ children }: { children: ReactNode }) {
  return (
    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
      {children}
    </label>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mb-4">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function NumberInput({
  value, onChange, min = 0, max = 9999, step = 1, suffix,
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
}) {
  // Keep a local string so the user can freely edit mid-entry (e.g. clear to type 0)
  const [raw, setRaw] = useState(String(value));
  const [prevValue, setPrevValue] = useState(value);

  // Sync when the store value changes from outside (derived-state pattern, runs during render)
  if (value !== prevValue) {
    setPrevValue(value);
    setRaw(String(value));
  }

  const commit = (s: string) => {
    const v = parseFloat(s);
    if (!isNaN(v)) {
      const clamped = Math.min(max, Math.max(min, v));
      onChange(clamped);
      setRaw(String(clamped));
    } else {
      // Revert to last valid value if the field is empty or NaN on blur
      setRaw(String(value));
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        className="flex-1 bg-gray-800 text-white rounded px-2 py-1.5 text-sm border border-gray-600 focus:outline-none focus:border-orange-500"
        value={raw}
        min={min}
        max={max}
        step={step}
        onChange={(e) => setRaw(e.target.value)}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            commit((e.target as HTMLInputElement).value);
            (e.target as HTMLInputElement).blur();
          }
        }}
      />
      {suffix && <span className="text-xs text-gray-400 w-8">{suffix}</span>}
    </div>
  );
}

function DurationField({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [raw, setRaw] = useState(formatDurationCompact(value));
  const [error, setError] = useState(false);
  const [prevValue, setPrevValue] = useState(value);

  // Sync when the store value changes from outside (derived-state pattern, runs during render)
  if (value !== prevValue) {
    setPrevValue(value);
    setRaw(formatDurationCompact(value));
    setError(false);
  }

  const commit = (s: string) => {
    const parsed = parseDuration(s);
    if (!isNaN(parsed) && parsed > 0) {
      onChange(parsed);
      setRaw(formatDurationCompact(parsed));
      setError(false);
    } else {
      setError(true);
    }
  };

  return (
    <div>
      <input
        type="text"
        className={`w-full bg-gray-800 text-white rounded px-2 py-1.5 text-sm border ${
          error ? 'border-red-500' : 'border-gray-600'
        } focus:outline-none focus:border-orange-500`}
        value={raw}
        onChange={(e) => { setRaw(e.target.value); setError(false); }}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            commit((e.target as HTMLInputElement).value);
            (e.target as HTMLInputElement).blur();
          }
        }}
        placeholder="e.g. 10m, 1m30s, 90s, 1:30"
      />
      {error && (
        <p className="text-xs text-red-400 mt-1">Try: 10m · 1m30s · 90s · 1:30</p>
      )}
    </div>
  );
}

function PowerField({
  label, value, onChange, ftp,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  ftp: number;
}) {
  return (
    <div className="mb-4">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={0}
          max={160}
          step={1}
          value={Math.round(value * 100)}
          onChange={(e) => onChange(parseInt(e.target.value) / 100)}
          className="flex-1 accent-orange-500 h-2"
        />
        <span className="text-sm font-mono text-white w-16 text-right">
          {pctStr(value)}
        </span>
        <span className="text-xs text-gray-400 w-12 text-right">
          ~{toWatts(value, ftp)}W
        </span>
      </div>
    </div>
  );
}

export default function BlockEditor() {
  const { blocks, selectedBlockId, updateBlock, removeBlock, meta } = useWorkoutStore();
  const block = blocks.find((b) => b.id === selectedBlockId);

  if (!block) {
    return (
      <div className="w-64 flex-shrink-0 bg-gray-900 border-l border-gray-700 flex flex-col items-center justify-center p-6">
        <div className="text-4xl mb-3">✏️</div>
        <p className="text-sm text-gray-400 text-center">
          Click a block in the chart or timeline to edit its properties
        </p>
      </div>
    );
  }

  const update = (patch: Record<string, unknown>) => updateBlock(block.id, patch);

  const renderEditor = () => {
    if (block.type === 'Warmup' || block.type === 'Cooldown') {
      const b = block as WarmupBlock | CooldownBlock;
      return (
        <>
          <Field label="Duration">
            <DurationField value={b.duration} onChange={(n) => update({ duration: n })} />
          </Field>
          <PowerField label="Power Low" value={b.powerLow} onChange={(n) => update({ powerLow: n })} ftp={meta.ftp} />
          <PowerField label="Power High" value={b.powerHigh} onChange={(n) => update({ powerHigh: n })} ftp={meta.ftp} />
        </>
      );
    }

    if (block.type === 'SteadyState') {
      const b = block as SteadyStateBlock;
      return (
        <>
          <Field label="Duration">
            <DurationField value={b.duration} onChange={(n) => update({ duration: n })} />
          </Field>
          <PowerField label="Power" value={b.power} onChange={(n) => update({ power: n })} ftp={meta.ftp} />
        </>
      );
    }

    if (block.type === 'Ramp') {
      const b = block as RampBlock;
      return (
        <>
          <Field label="Duration">
            <DurationField value={b.duration} onChange={(n) => update({ duration: n })} />
          </Field>
          <PowerField label="Power Start" value={b.powerLow} onChange={(n) => update({ powerLow: n })} ftp={meta.ftp} />
          <PowerField label="Power End" value={b.powerHigh} onChange={(n) => update({ powerHigh: n })} ftp={meta.ftp} />
        </>
      );
    }

    if (block.type === 'IntervalsT') {
      const b = block as IntervalsTBlock;
      return (
        <>
          <Field label="Repeats">
            <NumberInput value={b.repeat} onChange={(n) => update({ repeat: n, duration: n * (b.onDuration + b.offDuration) })} min={1} max={30} />
          </Field>
          <Field label="On Duration (seconds)">
            <NumberInput value={b.onDuration} onChange={(n) => update({ onDuration: n, duration: b.repeat * (n + b.offDuration) })} min={5} max={3600} />
          </Field>
          <PowerField label="On Power" value={b.onPower} onChange={(n) => update({ onPower: n })} ftp={meta.ftp} />
          <Field label="Off Duration (seconds)">
            <NumberInput value={b.offDuration} onChange={(n) => update({ offDuration: n, duration: b.repeat * (b.onDuration + n) })} min={5} max={3600} />
          </Field>
          <PowerField label="Off Power" value={b.offPower} onChange={(n) => update({ offPower: n })} ftp={meta.ftp} />
        </>
      );
    }

    if (block.type === 'FreeRide') {
      const b = block as FreeRideBlock;
      return (
        <Field label="Duration">
          <DurationField value={b.duration} onChange={(n) => update({ duration: n })} />
        </Field>
      );
    }

    if (block.type === 'MaxEffort') {
      const b = block as MaxEffortBlock;
      return (
        <Field label="Duration">
          <DurationField value={b.duration} onChange={(n) => update({ duration: n })} />
        </Field>
      );
    }

    return null;
  };

  return (
    <div className="w-64 flex-shrink-0 bg-gray-900 border-l border-gray-700 flex flex-col overflow-y-auto">
      <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-white">{block.type}</h2>
          <p className="text-xs text-gray-400">Edit block properties</p>
        </div>
        <button
          onClick={() => removeBlock(block.id)}
          className="text-gray-500 hover:text-red-400 transition-colors p-1 rounded"
          title="Delete block"
        >
          🗑️
        </button>
      </div>
      <div className="flex-1 p-4">
        {renderEditor()}
        <Field label="Cadence (optional)">
          <NumberInput
            value={block.cadence ?? 0}
            onChange={(n) => update({ cadence: n > 0 ? n : undefined })}
            min={0}
            max={200}
            suffix="rpm"
          />
          <p className="text-xs text-gray-500 mt-1">Set to 0 to remove cadence target</p>
        </Field>
      </div>
    </div>
  );
}

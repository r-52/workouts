# zwo-workout-parser

A zero-dependency TypeScript library that converts shorthand workout text into structured ZWO block objects — compatible with the `.zwo` XML workout format used by indoor cycling training apps.

## Install

```bash
npm install zwo-workout-parser
```

## Usage

```ts
import { parseWorkoutText, previewLine } from 'zwo-workout-parser';

const results = parseWorkoutText(`
  10m warmup 45-75%
  20m @ 88%
  4x 3m @ 110% / 2m @ 55%
  10m cooldown 75-45%
`);

for (const r of results) {
  if (r.error) console.error(r.error);
  else console.log(previewLine(r), r.block);
}
```

## Syntax Reference

| Line | Block type |
|------|------------|
| `10m warmup 45-75%` | Warmup (ramps 45%→75%) |
| `10m cooldown 75-45%` | Cooldown (ramps 75%→45%) |
| `5m ramp 50-100%` | Ramp |
| `20m @ 75%` | SteadyState |
| `4x 3m @ 110% / 2m @ 55%` | IntervalsT (verbose) |
| `4x 3m/2m @ 110%/55%` | IntervalsT (compact) |
| `10m free` | FreeRide |
| `30s max` | MaxEffort |

Lines starting with `#` are treated as comments and ignored.

### Duration formats

`10m` · `1m30s` · `90s` · `1:30` · `1:30:00` · `300` (bare number = seconds)

### Power formats

`75%` · `0.75` · `110` (bare number >2 treated as %)

### powerLow / powerHigh semantics

For ramp-style blocks (`Warmup`, `Cooldown`, `Ramp`) the fields always store:
- `powerLow` — the **minimum** power value
- `powerHigh` — the **maximum** power value

The direction of the ramp is determined by the block type:
- **Warmup** ramps `powerLow` → `powerHigh` (increasing)
- **Cooldown** ramps `powerHigh` → `powerLow` (decreasing)
- **Ramp** ramps `powerLow` → `powerHigh` (increasing)

So `10m cooldown 75-45%` and `10m cooldown 45-75%` produce identical blocks; the Cooldown type itself implies the downward direction.

## API

### `parseWorkoutText(text: string): ParsedLine[]`

Parse multi-line workout text. Each non-empty, non-comment line produces one `ParsedLine`.

```ts
interface ParsedLine {
  block?: WorkoutBlock; // present when parsing succeeded
  error?: string;       // present when parsing failed
  raw: string;          // original line text
}
```

### `previewLine(result: ParsedLine): string`

Returns a human-readable summary string suitable for displaying in a list (e.g. `"Cool Down  10m  75%→45%"`).

### `parseDuration(input: string): number`

Parse a duration string into total seconds. Returns `NaN` on failure.

### `formatDurationCompact(seconds: number): string`

Format total seconds as a compact string like `"10m"`, `"1m30s"`, `"1h10m"`.

## Build

```bash
npm run build      # emits dist/ with .js + .d.ts files
npm run typecheck  # type-check without emitting
```

## License

MIT — Not affiliated with or endorsed by Zwift, Inc.

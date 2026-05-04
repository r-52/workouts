# ZWO Builder

A web-based structured workout editor for creating and editing `.zwo` files — the XML workout format used by indoor cycling training apps.

Built with **React 18**, **Vite**, and **TypeScript**.

---

## Features

- **Visual power profile** — SVG chart shows each block as a zone-coloured bar; height is proportional to power, width to duration
- **Drag-and-drop editing** — drag block types from the palette onto the timeline, then drag cards to reorder
- **Per-block property editor** — sliders and inputs for power (% FTP), duration, cadence, and repeat counts
- **Training zone colours** — Z1 grey through Z6 red, based on a standard 6-zone FTP model
- **ZWO import** — open any valid `.zwo` file and all blocks are reconstructed in the editor
- **ZWO export** — download a spec-compliant `.zwo` XML file ready to place in your app's workout folder
- **TSS estimate** — approximate Training Stress Score shown in the footer

## Block types

| Block | Description |
|---|---|
| Warm Up | Gradual power ramp at the start |
| Steady State | Constant ERG power target |
| Intervals | Repeating on/off blocks with separate power targets |
| Ramp | Linear power change (up or down) |
| Free Ride | No ERG — rider controls effort |
| Max Effort | Short all-out sprint |
| Cool Down | Gradual power ramp down at the end |

## Getting started

```bash
npm install
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173).

## Building for production

```bash
npm run build
```

Output goes to `dist/`.

## ZWO file format

`.zwo` files are plain XML. Power values are expressed as a decimal fraction of FTP (e.g. `0.75` = 75% FTP). Duration is in seconds. Example:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<workout_file>
  <name>Sweet Spot 3x10</name>
  <author>Me</author>
  <description>Three 10-minute sweet spot intervals</description>
  <sportType>bike</sportType>
  <workout>
    <Warmup Duration="600" PowerLow="0.45" PowerHigh="0.75" Cadence="85"/>
    <IntervalsT Repeat="3" OnDuration="600" OnPower="0.88"
                OffDuration="300" OffPower="0.55"/>
    <Cooldown Duration="300" PowerLow="0.75" PowerHigh="0.45"/>
  </workout>
</workout_file>
```

Place exported files in your training application's workout folder (location varies by app).

## Tech stack

| Package | Purpose |
|---|---|
| React 18 | UI framework |
| Vite | Build tool and dev server |
| TypeScript | Type safety |
| @dnd-kit/core + sortable | Drag-and-drop |
| Zustand | Client state management |
| Tailwind CSS v4 | Utility-first styling |

## License

MIT

---

**Disclaimer:** ZWO Builder is an independent open-source project. It is not affiliated with, endorsed by, or connected to Zwift, Inc. in any way. "Zwift" is a registered trademark of Zwift, Inc. The `.zwo` file format is used here solely for interoperability purposes.


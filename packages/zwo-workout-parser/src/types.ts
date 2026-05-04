export type BlockType =
  | 'Warmup'
  | 'Cooldown'
  | 'SteadyState'
  | 'Ramp'
  | 'IntervalsT'
  | 'FreeRide'
  | 'MaxEffort';

export interface BaseBlock {
  id: string;
  type: BlockType;
  /** Duration in seconds */
  duration: number;
  /** Optional cadence target (RPM) */
  cadence?: number;
}

export interface WarmupBlock extends BaseBlock {
  type: 'Warmup';
  /** Minimum power (fraction of FTP, e.g. 0.45).
   *  Warmup ramps powerLow → powerHigh. */
  powerLow: number;
  powerHigh: number;
}

export interface CooldownBlock extends BaseBlock {
  type: 'Cooldown';
  /** Minimum power (fraction of FTP, e.g. 0.45).
   *  Cooldown ramps powerHigh → powerLow. */
  powerLow: number;
  powerHigh: number;
}

export interface SteadyStateBlock extends BaseBlock {
  type: 'SteadyState';
  power: number; // fraction of FTP
}

export interface RampBlock extends BaseBlock {
  type: 'Ramp';
  powerLow: number;  // start power
  powerHigh: number; // end power
}

export interface IntervalsTBlock extends BaseBlock {
  type: 'IntervalsT';
  repeat: number;
  onDuration: number;
  onPower: number;
  offDuration: number;
  offPower: number;
  onCadence?: number;
  offCadence?: number;
  /** computed – total duration = repeat * (onDuration + offDuration) */
}

export interface FreeRideBlock extends BaseBlock {
  type: 'FreeRide';
}

export interface MaxEffortBlock extends BaseBlock {
  type: 'MaxEffort';
}

export type WorkoutBlock =
  | WarmupBlock
  | CooldownBlock
  | SteadyStateBlock
  | RampBlock
  | IntervalsTBlock
  | FreeRideBlock
  | MaxEffortBlock;

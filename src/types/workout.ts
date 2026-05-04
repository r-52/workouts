// Block types are defined in and re-exported from the standalone zwo-workout-parser package.
export type {
  BlockType,
  BaseBlock,
  WarmupBlock,
  CooldownBlock,
  SteadyStateBlock,
  RampBlock,
  IntervalsTBlock,
  FreeRideBlock,
  MaxEffortBlock,
  WorkoutBlock,
} from 'zwo-workout-parser';

// App-specific metadata — not part of the parser package.
export interface WorkoutMeta {
  name: string;
  author: string;
  description: string;
  sportType: 'bike' | 'run';
  ftp: number;
}


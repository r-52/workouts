import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import SummaryBar from '../SummaryBar';
import { useWorkoutStore } from '../../store/workoutStore';
import type { WorkoutBlock, WorkoutMeta } from '../../types/workout';

vi.mock('../../store/workoutStore');

const BASE_META: WorkoutMeta = {
  name: 'Test',
  author: '',
  description: '',
  sportType: 'bike',
  ftp: 200,
};

function setupStore(blocks: WorkoutBlock[], meta: Partial<WorkoutMeta> = {}) {
  vi.mocked(useWorkoutStore).mockReturnValue({
    blocks,
    meta: { ...BASE_META, ...meta },
    selectedBlockId: null,
    importBlocks: vi.fn(),
    setMeta: vi.fn(),
    addBlock: vi.fn(),
    updateBlock: vi.fn(),
    removeBlock: vi.fn(),
    moveBlock: vi.fn(),
    setSelectedBlockId: vi.fn(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);
}

beforeEach(() => {
  setupStore([]);
});

describe('SummaryBar', () => {
  it('renders with no blocks showing 0s and 0 blocks', () => {
    render(<SummaryBar />);
    expect(screen.getByText('0s')).toBeInTheDocument();
    // Both "Blocks" and "Est. TSS" show 0 with an empty workout
    expect(screen.getAllByText('0')).toHaveLength(2);
  });

  it('shows TSS of 0 with no blocks', () => {
    render(<SummaryBar />);
    const tssValues = screen.getAllByText('0');
    expect(tssValues.length).toBeGreaterThanOrEqual(1);
  });

  it('shows correct total time for a single SteadyState block', () => {
    setupStore([{ id: '1', type: 'SteadyState', duration: 300, power: 0.75 }]);
    render(<SummaryBar />);
    expect(screen.getByText('5m')).toBeInTheDocument();
  });

  it('shows correct block count', () => {
    setupStore([
      { id: '1', type: 'SteadyState', duration: 300, power: 0.75 },
      { id: '2', type: 'FreeRide', duration: 600 },
    ]);
    render(<SummaryBar />);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('accumulates total time across multiple blocks', () => {
    setupStore([
      { id: '1', type: 'SteadyState', duration: 600, power: 0.75 },  // 10m
      { id: '2', type: 'SteadyState', duration: 600, power: 0.80 },  // 10m
    ]);
    render(<SummaryBar />);
    expect(screen.getByText('20m')).toBeInTheDocument();
  });

  it('calculates total time for IntervalsT using repeat*(on+off)', () => {
    setupStore([{
      id: '1', type: 'IntervalsT', duration: 480,
      repeat: 4, onDuration: 60, offDuration: 60, onPower: 1.05, offPower: 0.55,
    }]);
    render(<SummaryBar />);
    // 4 * (60 + 60) = 480s = 8m
    expect(screen.getByText('8m')).toBeInTheDocument();
  });

  it('shows non-zero TSS for a workout with blocks', () => {
    setupStore(
      [{ id: '1', type: 'SteadyState', duration: 3600, power: 1.0 }],
      { ftp: 200 },
    );
    render(<SummaryBar />);
    const tssEl = document.querySelector('.text-orange-400');
    expect(tssEl).not.toBeNull();
    expect(Number(tssEl!.textContent)).toBeGreaterThan(0);
  });
});

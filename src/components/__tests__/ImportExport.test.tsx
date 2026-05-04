import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ImportExport from '../ImportExport';
import { useWorkoutStore } from '../../store/workoutStore';
import type { WorkoutMeta } from '../../types/workout';

vi.mock('../../store/workoutStore');

const BASE_META: WorkoutMeta = {
  name: 'Test Workout',
  author: '',
  description: '',
  sportType: 'bike',
  ftp: 200,
};

function setupStore(overrides: Record<string, unknown> = {}) {
  vi.mocked(useWorkoutStore).mockReturnValue({
    blocks: [],
    meta: BASE_META,
    selectedBlockId: null,
    importBlocks: vi.fn(),
    setMeta: vi.fn(),
    addBlock: vi.fn(),
    updateBlock: vi.fn(),
    removeBlock: vi.fn(),
    moveBlock: vi.fn(),
    setSelectedBlockId: vi.fn(),
    ...overrides,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);
}

beforeEach(() => {
  setupStore();
  vi.spyOn(window, 'alert').mockImplementation(() => {});
});

describe('ImportExport', () => {
  it('renders Import ZWO, Share, and Export ZWO buttons', () => {
    render(<ImportExport />);
    expect(screen.getByTitle('Import a .zwo file')).toBeInTheDocument();
    expect(screen.getByTitle('Copy shareable link to clipboard')).toBeInTheDocument();
    expect(screen.getByTitle('Export as .zwo file')).toBeInTheDocument();
  });

  it('alerts when exporting with no blocks', () => {
    render(<ImportExport />);
    fireEvent.click(screen.getByTitle('Export as .zwo file'));
    expect(window.alert).toHaveBeenCalledWith(
      'Add some blocks to your workout before exporting.'
    );
  });

  it('alerts when sharing with no blocks', () => {
    render(<ImportExport />);
    fireEvent.click(screen.getByTitle('Copy shareable link to clipboard'));
    expect(window.alert).toHaveBeenCalledWith(
      'Add some blocks to your workout before sharing.'
    );
  });

  it('copies URL to clipboard when sharing with blocks', async () => {
    const mockWrite = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: mockWrite },
      configurable: true,
    });

    setupStore({
      blocks: [{ id: '1', type: 'SteadyState', duration: 300, power: 0.75 }],
    });

    render(<ImportExport />);
    fireEvent.click(screen.getByTitle('Copy shareable link to clipboard'));

    await waitFor(() => {
      expect(mockWrite).toHaveBeenCalledOnce();
      const url: string = mockWrite.mock.calls[0][0];
      expect(url).toContain('#w=');
    });
  });

  it('shows "Copied!" feedback after successful share', async () => {
    const mockWrite = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: mockWrite },
      configurable: true,
    });

    setupStore({
      blocks: [{ id: '1', type: 'SteadyState', duration: 300, power: 0.75 }],
    });

    render(<ImportExport />);
    fireEvent.click(screen.getByTitle('Copy shareable link to clipboard'));

    await waitFor(() => {
      expect(screen.getByText('✅ Copied!')).toBeInTheDocument();
    });
  });
});

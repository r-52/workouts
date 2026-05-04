import { create } from 'zustand';
import type { WorkoutBlock, WorkoutMeta } from '../types/workout';

function nanoid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

interface WorkoutStore {
  meta: WorkoutMeta;
  blocks: WorkoutBlock[];
  selectedBlockId: string | null;

  setMeta: (patch: Partial<WorkoutMeta>) => void;
  addBlock: (block: Omit<WorkoutBlock, 'id'>, atIndex?: number) => void;
  updateBlock: (id: string, patch: Record<string, unknown>) => void;
  removeBlock: (id: string) => void;
  moveBlock: (fromIndex: number, toIndex: number) => void;
  setSelectedBlockId: (id: string | null) => void;
  importBlocks: (blocks: WorkoutBlock[], meta?: Partial<WorkoutMeta>) => void;
}

export const useWorkoutStore = create<WorkoutStore>((set) => ({
  meta: {
    name: 'My Workout',
    author: '',
    description: '',
    sportType: 'bike',
    ftp: 200,
  },
  blocks: [],
  selectedBlockId: null,

  setMeta: (patch) =>
    set((s) => ({ meta: { ...s.meta, ...patch } })),

  addBlock: (block, atIndex) =>
    set((s) => {
      const newBlock = { ...block, id: nanoid() } as WorkoutBlock;
      const arr = [...s.blocks];
      if (atIndex !== undefined && atIndex >= 0) {
        arr.splice(atIndex, 0, newBlock);
      } else {
        arr.push(newBlock);
      }
      return { blocks: arr, selectedBlockId: newBlock.id };
    }),

  updateBlock: (id, patch) =>
    set((s) => ({
      blocks: s.blocks.map((b) =>
        b.id === id ? ({ ...b, ...patch } as WorkoutBlock) : b
      ),
    })),

  removeBlock: (id) =>
    set((s) => ({
      blocks: s.blocks.filter((b) => b.id !== id),
      selectedBlockId: s.selectedBlockId === id ? null : s.selectedBlockId,
    })),

  moveBlock: (fromIndex, toIndex) =>
    set((s) => {
      const arr = [...s.blocks];
      const [item] = arr.splice(fromIndex, 1);
      arr.splice(toIndex, 0, item);
      return { blocks: arr };
    }),

  setSelectedBlockId: (id) => set({ selectedBlockId: id }),

  importBlocks: (blocks, meta) =>
    set((s) => ({
      blocks,
      selectedBlockId: null,
      meta: meta ? { ...s.meta, ...meta } : s.meta,
    })),
}));

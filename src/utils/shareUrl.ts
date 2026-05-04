import type { WorkoutBlock, WorkoutMeta } from '../types/workout';

interface SharePayload {
  meta: WorkoutMeta;
  blocks: WorkoutBlock[];
}

/**
 * Encode a workout into a URL-safe base64 string.
 * Pure function — no DOM access.
 */
export function encodeWorkout(blocks: WorkoutBlock[], meta: WorkoutMeta): string {
  const payload: SharePayload = { meta, blocks };
  return btoa(encodeURIComponent(JSON.stringify(payload)));
}

/**
 * Decode a workout from the string produced by encodeWorkout.
 * Returns null if the input is missing, malformed, or structurally invalid.
 */
export function decodeWorkout(encoded: string): { blocks: WorkoutBlock[]; meta: WorkoutMeta } | null {
  try {
    const json = decodeURIComponent(atob(encoded));
    const payload = JSON.parse(json) as Partial<SharePayload>;
    if (!Array.isArray(payload.blocks) || typeof payload.meta !== 'object' || payload.meta === null) {
      return null;
    }
    return { blocks: payload.blocks as WorkoutBlock[], meta: payload.meta as WorkoutMeta };
  } catch {
    return null;
  }
}

/**
 * Build a shareable URL for the given workout using the current page's origin and path.
 * The workout is stored entirely in the URL fragment — nothing is sent to a server.
 */
export function buildShareUrl(blocks: WorkoutBlock[], meta: WorkoutMeta): string {
  const encoded = encodeWorkout(blocks, meta);
  const { origin, pathname, search } = window.location;
  return `${origin}${pathname}${search}#w=${encoded}`;
}

/**
 * Read a workout encoded in the current page's URL hash (#w=...).
 * Returns null if the hash is absent or malformed.
 */
export function readWorkoutFromHash(): { blocks: WorkoutBlock[]; meta: WorkoutMeta } | null {
  const { hash } = window.location;
  if (!hash.startsWith('#w=')) return null;
  return decodeWorkout(hash.slice(3));
}

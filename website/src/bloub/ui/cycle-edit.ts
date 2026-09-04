import {
  type Block,
  clampDuration,
  type Cycle,
  makeBlock,
  SEQUENCE,
  type StateId,
} from 'bloub-react';

/**
 * Limites et helpers d'EDITION / stockage du studio — pas du lecteur BloubBot.
 * Bornes contre un localStorage hostile (montages gigantesques).
 */
export const MAX_BLOCS = 200;
export const MAX_CYCLES = 50;

/** Ajoute une animation a la fin du montage (palette ou carte « + »). */
export function blocksWith(blocks: Block[], state: StateId): Block[] {
  if (blocks.length >= MAX_BLOCS) return blocks;
  return [...blocks, makeBlock(state)];
}

/** Deplace un bloc, en rendant une nouvelle liste. */
export function moveBlock(blocks: Block[], from: number, to: number): Block[] {
  const next = blocks.slice();
  const [moved] = next.splice(from, 1);
  if (!moved) return blocks;
  next.splice(Math.min(Math.max(to, 0), next.length), 0, moved);
  return next;
}

/** `Mon cycle`, `Mon cycle 2`, … — jamais deux fois le meme nom. */
export function uniqueName(base: string, cycles: Cycle[]): string {
  const taken = new Set(cycles.map((c) => c.name));
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base} ${n}`)) n++;
  return `${base} ${n}`;
}

/** Identifiant sans collision, y compris avec un localStorage bricole. */
export function nextCycleId(cycles: Cycle[]): string {
  const taken = new Set(cycles.map((c) => c.id));
  let n = 1;
  while (taken.has(`c${n}`)) n++;
  return `c${n}`;
}

function parseBlock(raw: unknown): Block | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const { state, duration } = raw as { state?: unknown; duration?: unknown };
  if (typeof state !== 'string' || !SEQUENCE.includes(state as StateId))
    return null;
  if (typeof duration !== 'number' || !Number.isFinite(duration)) return null;
  return {
    state: state as StateId,
    duration: clampDuration(state as StateId, duration),
  };
}

function parseCycle(raw: unknown, seen: Cycle[]): Cycle | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const { id, name, blocks } = raw as {
    id?: unknown;
    name?: unknown;
    blocks?: unknown;
  };
  if (typeof id !== 'string' || !id) return null;
  if (typeof name !== 'string') return null;
  if (!Array.isArray(blocks)) return null;
  const kept = blocks
    .slice(0, MAX_BLOCS)
    .map(parseBlock)
    .filter((b): b is Block => b !== null);
  if (!kept.length) return null;
  if (seen.some((c) => c.id === id)) return null;
  return { id, name, blocks: kept };
}

/**
 * Relecture GARDEE du stockage. Tout ce qui ne se relit pas est jete
 * silencieusement plutot que de casser l'application au demarrage.
 */
export function parseCycles(raw: string | null): Cycle[] {
  if (!raw) return [];
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(data)) return [];
  const out: Cycle[] = [];
  for (const item of data.slice(0, MAX_CYCLES)) {
    const cycle = parseCycle(item, out);
    if (cycle) out.push(cycle);
  }
  return out;
}

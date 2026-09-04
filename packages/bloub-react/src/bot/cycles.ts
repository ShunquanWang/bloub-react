import { SEQUENCE, STATE_BY_ID, type StateId, STATES } from './states';

/**
 * Un cycle est un montage : une suite de blocs, chacun un etat tenu pendant une
 * duree. Donnees pures, aucune horloge — le meme cycle peut etre relu par les
 * tests, par BloubBot et par un editeur externe.
 *
 * Un bloc n'a pas d'identifiant : c'est une position dans une liste.
 */
export interface Block {
  state: StateId;
  duration: number;
}

export interface Cycle {
  id: string;
  name: string;
  blocks: Block[];
}

/**
 * Plancher commun a tous les blocs. Le moteur ne garde qu'une case d'historique
 * (`BotEngine.setState` ecrase `prev`), donc un bloc plus court que le fondu
 * d'entree du bloc suivant saute a l'image au lieu de se fondre.
 *
 * DERIVE du catalogue et non ecrit a la main.
 */
export const MIN_BLOCK = Math.max(...STATES.map((s) => s.morph));

/**
 * Garde-fou de duree max d'un bloc (secondes). Allonger est sans risque moteur,
 * mais une piste de blocs d'une minute n'est plus lisible.
 */
export const MAX_BLOCK = 10;

/** Pas de duree, en secondes. */
export const STEP = 0.1;

const DEFAULT_CYCLE_ID = 'defaut';

/** Duree minimale d'un bloc : le plancher moteur, ou la mesure de l'etat. */
export function minDurationOf(state: StateId): number {
  return Math.max(MIN_BLOCK, STATE_BY_ID.get(state)?.minDuration ?? MIN_BLOCK);
}

/** Ramene une duree dans ses bornes et sur le pas, sans trainee de flottants. */
export function clampDuration(state: StateId, seconds: number): number {
  const snapped = Math.round(seconds / STEP) * STEP;
  const bounded = Math.min(MAX_BLOCK, Math.max(minDurationOf(state), snapped));
  return Math.round(bounded * 100) / 100;
}

export function makeBlock(state: StateId): Block {
  return {
    state,
    duration: clampDuration(state, STATE_BY_ID.get(state)?.duration ?? 2),
  };
}

/**
 * Le montage releve sur la video : l'ordre de `SEQUENCE`, chaque etat tenu sa
 * duree mesuree. Amorce de lecture / personnalisation.
 */
export function defaultCycle(): Cycle {
  return {
    name: '',
    id: DEFAULT_CYCLE_ID,
    blocks: SEQUENCE.map(makeBlock),
  };
}

export function totalDuration(blocks: Block[]): number {
  return blocks.reduce((sum, b) => sum + b.duration, 0);
}

/** Date de debut d'un bloc dans le montage. */
export function offsetOf(blocks: Block[], index: number): number {
  let acc = 0;
  for (let i = 0; i < index && i < blocks.length; i++)
    acc += blocks[i]!.duration;
  return acc;
}

/**
 * Bloc joue a la date `t` et temps ecoule dedans. Au-dela du dernier bloc on
 * retombe au debut : la lecture boucle.
 */
export function blockAt(
  blocks: Block[],
  t: number
): { index: number; elapsed: number } {
  const total = totalDuration(blocks);
  if (!blocks.length || total <= 0) return { index: 0, elapsed: 0 };
  const wrapped = t >= 0 && t < total ? t : ((t % total) + total) % total;
  let acc = 0;
  for (let i = 0; i < blocks.length; i++) {
    const end = acc + blocks[i]!.duration;
    if (wrapped < end) return { index: i, elapsed: wrapped - acc };
    acc = end;
  }
  return { index: blocks.length - 1, elapsed: 0 };
}

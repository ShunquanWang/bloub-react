import type { ExpressionId, GazeScript } from 'bloub-react';

/**
 * Humeurs traversees pendant le suivi du curseur (vue reglages).
 * Toutes a roulis nul — critere de selection, pas une liste de gouts.
 */
export const HUMEURS: readonly ExpressionId[] = [
  'surpris',
  'heureux',
  'hilare',
  'excite',
  'fier',
  'blase',
];

function clamp(v: number, lo = 0, hi = 1) {
  return Math.min(hi, Math.max(lo, v));
}

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

/** Duree du tour d'arrivee (secondes). */
export const TOUR_TIME = 1.5;

/**
 * « Le tour » : mix reste a 0, seul spin fond — les yeux font le tour de la boule.
 */
export const tourLook: GazeScript = (t) => ({
  yaw: 0,
  pitch: 0,
  mix: 0,
  spin: 360 * (1 - easeInOutCubic(clamp(t / TOUR_TIME))),
  wander: 1,
});

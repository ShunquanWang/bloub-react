import type { Look } from './engine';

/**
 * Regard qui suit le pointeur — regle pure, sans DOM.
 * Les scripts d'arrivee / humeurs studio vivent cote website.
 */

export const YAW_MAX = 16;
export const PITCH_MAX = 13;
export const PITCH = 10;
/** Direction de la tete en mode suivi (vers le panneau / a gauche). */
export const TURN = 26;
export const SPIN = 360;
/** Duree du demi-tour vers la cible de suivi. */
export const TURN_TIME = 1.1;

/** Regard scripte : evalue avec le temps ecoule depuis le debut, en secondes. */
export type GazeScript = (t: number) => Look;

export interface Aim {
  /** ecart horizontal du pointeur au centre du bot, -1 a 1 (droite positive) */
  nx: number;
  /** ecart vertical, -1 a 1, dans le sens de l'ecran (bas positif) */
  ny: number;
  /** avancement de l'arrivee, 0 a 1 */
  tour: number;
  /** false = aucun pointeur connu : la tete reste tournee, mais elle revit */
  pointer: boolean;
}

/**
 * Cible de regard pour le suivi du pointeur.
 * `tour` mene tout : emprise (`mix`) et tour parcouru (`spin`) en meme temps.
 */
export function lookTarget({ nx, ny, tour, pointer }: Aim): Look {
  return {
    yaw: -TURN + nx * YAW_MAX,
    pitch: PITCH - ny * PITCH_MAX,
    mix: tour,
    spin: SPIN * (1 - tour),
    wander: pointer ? 0 : 1,
  };
}

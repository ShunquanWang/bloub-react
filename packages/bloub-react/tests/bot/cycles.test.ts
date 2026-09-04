import { describe, expect, it } from 'vitest';
import {
  blockAt,
  clampDuration,
  type Cycle,
  defaultCycle,
  makeBlock,
  MAX_BLOCK,
  MIN_BLOCK,
  minDurationOf,
  totalDuration,
} from '../../src/bot/cycles';
import { SEQUENCE, STATE_BY_ID, STATES } from '../../src/bot/states';

describe('cycle par defaut', () => {
  it('reprend la sequence relevee sur la video, dans l ordre', () => {
    expect(defaultCycle().blocks.map((b) => b.state)).toEqual(SEQUENCE);
  });

  it('tient chaque etat sa duree mesuree', () => {
    for (const block of defaultCycle().blocks) {
      expect(block.duration).toBe(STATE_BY_ID.get(block.state)!.duration);
    }
  });

  it('est reconstruit a l identique a chaque appel', () => {
    expect(defaultCycle()).toEqual(defaultCycle());
    // ...sans partager d'objet, sinon editer un montage toucherait l amorce
    expect(defaultCycle().blocks[0]).not.toBe(defaultCycle().blocks[0]);
  });
});

describe('durees', () => {
  it('ne descend pas sous le plancher du moteur', () => {
    // en dessous, le bloc est plus court que le fondu d entree du suivant
    expect(clampDuration('idle', 0.1)).toBe(MIN_BLOCK);
    expect(clampDuration('idle', -5)).toBe(MIN_BLOCK);
  });

  it('respecte la mesure des etats qui ont besoin d aboutir', () => {
    // le "!" revient a 2.0, le corps se recompose a 2.4
    expect(minDurationOf('alert')).toBe(2);
    expect(minDurationOf('burst')).toBe(2.4);
    expect(clampDuration('orbit', 1)).toBe(2.5);
    // un etat qui ignore le temps n a que le plancher
    expect(minDurationOf('idle')).toBe(MIN_BLOCK);
  });

  it('n autorise aucun etat a descendre sous sa mesure', () => {
    for (const state of SEQUENCE) {
      expect(clampDuration(state, 0)).toBeGreaterThanOrEqual(
        minDurationOf(state)
      );
    }
  });

  it('plafonne et tombe sur le pas, sans trainee de flottants', () => {
    expect(clampDuration('idle', 999)).toBe(MAX_BLOCK);
    expect(clampDuration('idle', 2.44)).toBe(2.4);
    expect(clampDuration('idle', 2.46)).toBe(2.5);
  });

  /*
   * Le plancher est DERIVE du plus long `morph`, il n'est plus ecrit a la main. Ce test
   * garde le lien visible : il valait 0,6 en dur, ce qui ne marchait que parce que 0,6
   * etait justement le morph d'`orbit`. Un etat qui morphe plus lentement le suit.
   */
  it('le plancher de bloc couvre le plus long fondu du catalogue', () => {
    const plusLong = Math.max(...STATES.map((s) => s.morph));
    expect(MIN_BLOCK).toBeGreaterThanOrEqual(plusLong);
    // et il n'est pas gratuitement plus grand : c'est exactement ce fondu
    expect(MIN_BLOCK).toBe(plusLong);
  });
});

describe('lecture', () => {
  const cycle: Cycle = {
    id: 'c1',
    name: 'Test',
    blocks: [
      { state: 'idle', duration: 2 },
      { state: 'wink', duration: 1 },
      { state: 'egg', duration: 3 },
    ],
  };

  it('additionne les blocs', () => {
    expect(totalDuration(cycle.blocks)).toBe(6);
  });

  it('trouve le bloc joue et le temps ecoule dedans', () => {
    expect(blockAt(cycle.blocks, 0)).toEqual({ index: 0, elapsed: 0 });
    expect(blockAt(cycle.blocks, 1.9)).toEqual({ index: 0, elapsed: 1.9 });
    // la borne appartient au bloc suivant
    expect(blockAt(cycle.blocks, 2)).toEqual({ index: 1, elapsed: 0 });
    expect(blockAt(cycle.blocks, 3.5)).toEqual({ index: 2, elapsed: 0.5 });
  });

  it('boucle au-dela du dernier bloc', () => {
    expect(blockAt(cycle.blocks, 6)).toEqual({ index: 0, elapsed: 0 });
    expect(blockAt(cycle.blocks, 8)).toEqual({ index: 1, elapsed: 0 });
  });

  it('ne casse pas sur un cycle vide', () => {
    expect(blockAt([], 3)).toEqual({ index: 0, elapsed: 0 });
    expect(totalDuration([])).toBe(0);
  });

  it('makeBlock utilise la duree catalogue bornee', () => {
    expect(makeBlock('idle').state).toBe('idle');
    expect(makeBlock('orbit').duration).toBe(
      STATE_BY_ID.get('orbit')!.duration
    );
  });
});

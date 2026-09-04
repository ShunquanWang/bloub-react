import {
  clampDuration,
  type Cycle,
  defaultCycle,
  makeBlock,
  MAX_BLOCK,
  MIN_BLOCK,
} from 'bloub-react';
import { describe, expect, it } from 'vitest';
import {
  blocksWith,
  MAX_BLOCS,
  MAX_CYCLES,
  moveBlock,
  nextCycleId,
  parseCycles,
  uniqueName,
} from '@/bloub/ui/cycle-edit';

describe('identifiants et noms de cycle', () => {
  it('laisse toujours de la place pour un nouveau cycle, sans collision', () => {
    const reference = defaultCycle();
    const un: Cycle = {
      id: nextCycleId([reference]),
      name: uniqueName('Mon cycle', [reference]),
      blocks: [],
    };
    const deux: Cycle = {
      id: nextCycleId([reference, un]),
      name: uniqueName('Mon cycle', [reference, un]),
      blocks: [],
    };
    expect(un.id).not.toBe(reference.id);
    expect(deux.id).not.toBe(un.id);
    expect(deux.name).not.toBe(un.name);
  });
});

describe('edition de montage', () => {
  const cycle: Cycle = {
    id: 'c1',
    name: 'Test',
    blocks: [
      { state: 'idle', duration: 2 },
      { state: 'wink', duration: 1 },
      { state: 'egg', duration: 3 },
    ],
  };

  it('deplace un bloc sans toucher la liste d origine', () => {
    const blocks = cycle.blocks;
    expect(moveBlock(blocks, 0, 2).map((b) => b.state)).toEqual([
      'wink',
      'egg',
      'idle',
    ]);
    expect(moveBlock(blocks, 2, 0).map((b) => b.state)).toEqual([
      'egg',
      'idle',
      'wink',
    ]);
    expect(blocks.map((b) => b.state)).toEqual(['idle', 'wink', 'egg']);
  });

  it('borne aussi l ajout depuis l editeur, pas seulement la relecture', () => {
    let blocs = Array.from({ length: MAX_BLOCS }, () => makeBlock('idle'));
    expect(blocksWith(blocs, 'egg')).toHaveLength(MAX_BLOCS);
    blocs = blocs.slice(0, MAX_BLOCS - 1);
    expect(blocksWith(blocs, 'egg')).toHaveLength(MAX_BLOCS);
  });
});

describe('relecture du stockage', () => {
  it('ne casse pas sur du vide ou du JSON invalide', () => {
    expect(parseCycles(null)).toEqual([]);
    expect(parseCycles('')).toEqual([]);
    expect(parseCycles('{pas du json')).toEqual([]);
    expect(parseCycles('{"id":"c1"}')).toEqual([]);
  });

  it('jette les blocs dont l etat n existe plus', () => {
    const raw =
      '[{"id":"c1","name":"A","blocks":[{"state":"idle","duration":2},' +
      '{"state":"disparu","duration":2}]}]';
    expect(parseCycles(raw)[0]!.blocks.map((b) => b.state)).toEqual(['idle']);
  });

  it('ramene les durees aberrantes dans leurs bornes', () => {
    const raw =
      '[{"id":"c1","name":"A","blocks":[{"state":"idle","duration":-4},' +
      '{"state":"egg","duration":9999}]}]';
    expect(parseCycles(raw)[0]!.blocks.map((b) => b.duration)).toEqual([
      MIN_BLOCK,
      MAX_BLOCK,
    ]);
  });

  it('jette un cycle vide, sans nom, ou en double', () => {
    expect(parseCycles('[{"id":"c1","name":"A","blocks":[]}]')).toEqual([]);
    expect(
      parseCycles('[{"id":"c1","blocks":[{"state":"idle","duration":2}]}]')
    ).toEqual([]);
    const doublon =
      '[{"id":"c1","name":"A","blocks":[{"state":"idle","duration":2}]},' +
      '{"id":"c1","name":"B","blocks":[{"state":"egg","duration":2}]}]';
    expect(parseCycles(doublon).map((c) => c.name)).toEqual(['A']);
  });

  it('ne garde que les champs du modele, pas ce qu on lui glisse en plus', () => {
    const raw =
      '[{"id":"defaut","name":"Mon montage","locked":true,"secret":1,' +
      '"blocks":[{"state":"idle","duration":2,"vitesse":3}]}]';
    const cycle = parseCycles(raw)[0]!;
    expect(Object.keys(cycle).sort()).toEqual(['blocks', 'id', 'name']);
    expect(Object.keys(cycle.blocks[0]!).sort()).toEqual(['duration', 'state']);
  });

  /*
   * Le stockage est modifiable et tient quelques megaoctets, alors que rien en aval n'est
   * dimensionne pour ca. Un seul cycle de 150 000 blocs — environ 4 Mo de JSON, donc dans
   * le budget — donnait 1 500 000 s de duree, autant de graduations a allouer et une piste
   * de 29 700 000 px : l'onglet figeait en entrant dans la vue Animations.
   */
  it('borne la taille d un montage relu', () => {
    const blocs = Array.from({ length: 200_000 }, () => ({
      state: 'idle',
      duration: 10,
    }));
    const raw = JSON.stringify([{ id: 'c1', name: 'A', blocks: blocs }]);
    expect(parseCycles(raw)[0]!.blocks).toHaveLength(MAX_BLOCS);
  });

  it('borne le nombre de montages relus', () => {
    const raw = JSON.stringify(
      Array.from({ length: 5000 }, (_, i) => ({
        id: `c${i}`,
        name: `A${i}`,
        blocks: [{ state: 'idle', duration: 2 }],
      }))
    );
    expect(parseCycles(raw)).toHaveLength(MAX_CYCLES);
  });

  /*
   * `swirl` est la transition d'entree des reglages, deliberement hors de `SEQUENCE` : un
   * test la garde hors de la palette et de la planche. Un montage utilisateur ne se
   * construit qu'a partir de la palette, donc elle ne peut arriver ici que par un stockage
   * bricole a la main — et on l'y refuse comme partout ailleurs.
   */
  it('refuse un etat hors catalogue, `swirl` compris', () => {
    const raw =
      '[{"id":"c1","name":"A","blocks":[{"state":"swirl","duration":2},' +
      '{"state":"idle","duration":2}]}]';
    expect(parseCycles(raw)[0]!.blocks.map((b) => b.state)).toEqual(['idle']);
    expect(
      parseCycles(
        '[{"id":"c1","name":"A","blocks":[{"state":"swirl","duration":2}]}]'
      )
    ).toEqual([]);
  });

  it('clampDuration reste utilisee a la relecture', () => {
    expect(clampDuration('idle', -1)).toBe(MIN_BLOCK);
  });
});

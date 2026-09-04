import { describe, expect, it } from 'vitest';
import { BotEngine } from '../src/bot/engine';
import { EXPRESSION_BY_ID, EXPRESSIONS } from '../src/bot/expressions';
import {
  type Aim,
  lookTarget,
  PITCH,
  SPIN,
  TURN,
  YAW_MAX,
} from '../src/bot/gaze';
import { SHAPE_BY_ID } from '../src/bot/skins';

const cercle = () => SHAPE_BY_ID.get('cercle')!.radii;

/** Visee au repos : pointeur au centre du bot, demi-tour acheve. */
const vise = (o: Partial<Aim> = {}): Aim => ({
  nx: 0,
  ny: 0,
  tour: 1,
  pointer: true,
  ...o,
});

describe('cible de regard', () => {
  it('laisse la pose commander avant que l arrivee ne commence', () => {
    // sans pointeur : rien n'est pilote du tout, ni la direction ni la derive
    const cible = lookTarget(vise({ tour: 0, pointer: false }));
    // emprise nulle : peu importe la direction visee, la pose commande seule...
    expect(cible.mix).toBe(0);
    // ...et un tour entier reste a parcourir, qui est le meme angle que zero
    expect(cible.spin).toBe(SPIN);

    // ce qui compte n'est pas la valeur des champs mais l'image rendue :
    // au depart, elle doit etre celle d'un bot qu'on ne pilote pas du tout
    const nu = new BotEngine(
      100,
      'idle',
      cercle(),
      EXPRESSION_BY_ID.get('neutre')!
    );
    const debut = new BotEngine(
      100,
      'idle',
      cercle(),
      EXPRESSION_BY_ID.get('neutre')!
    );
    debut.setLook(cible, 0);
    expect(debut.sample(1).eyes[0]!.matrix).toBe(nu.sample(1).eyes[0]!.matrix);
  });

  it('tourne la tete vers la gauche, du cote du panneau', () => {
    // lacet negatif = le bot regarde a gauche
    expect(lookTarget(vise()).yaw).toBe(-TURN);
  });

  it('suit le curseur dans le bon sens sur les deux axes', () => {
    const gauche = lookTarget(vise({ nx: -1 }));
    const droite = lookTarget(vise({ nx: 1 }));
    expect(droite.yaw).toBeGreaterThan(gauche.yaw);

    // tangage positif = regard vers le haut, alors que le y de l'ecran descend :
    // c'est le signe sur lequel on se trompe
    expect(lookTarget(vise({ ny: -1 })).pitch).toBeGreaterThan(0);
    expect(lookTarget(vise({ ny: 1 })).pitch).toBeLessThan(0);
  });

  it('fond le tour a mesure que l arrivee se fait', () => {
    expect(lookTarget(vise({ tour: 0.5 })).spin).toBe(SPIN / 2);
    expect(lookTarget(vise({ tour: 1 })).spin).toBe(0);
  });
});

describe('les deux yeux restent visibles', () => {
  /**
   * L'invariant qui protege la fonctionnalite : passe un certain lacet, l'oeil
   * exterieur passe derriere le limbe de la sphere et le moteur le RETIRE de
   * l'image — le bot se retrouve borgne. On balaie donc les 16 expressions aux
   * quatre coins de l'ecran, demi-tour compris.
   */
  it('sur les 16 expressions, aux quatre coins de l ecran', () => {
    for (const e of EXPRESSIONS) {
      for (const nx of [-1, 0, 1]) {
        for (const ny of [-1, 0, 1]) {
          const moteur = new BotEngine(
            100,
            'idle',
            cercle(),
            EXPRESSION_BY_ID.get(e.id)!
          );
          moteur.setLook(lookTarget(vise({ nx, ny })), 0);
          const image = moteur.sample(1);
          expect(image.eyes, `${e.id} nx=${nx} ny=${ny}`).toHaveLength(2);
          // ...et pas seulement presents : encore franchement opaques
          for (const oeil of image.eyes) {
            expect(oeil.alpha, `${e.id} nx=${nx} ny=${ny}`).toBeGreaterThan(
              0.5
            );
          }
        }
      }
    }
  });

  it('garde de la marge : le suivi ne va pas jusqu au point de rupture', () => {
    // si cette marge disparait, c'est que YAW_MAX ou TURN a ete pousse trop loin
    const moteur = new BotEngine(
      100,
      'idle',
      cercle(),
      EXPRESSION_BY_ID.get('neutre')!
    );
    moteur.setLook(
      { yaw: -(TURN + YAW_MAX) - 25, pitch: 0, mix: 1, spin: 0, wander: 0 },
      0
    );
    expect(moteur.sample(1).eyes).toHaveLength(2);
  });
});

describe('le tour sur soi-meme', () => {
  it('fait passer les yeux derriere la boule, puis les ramene a gauche', () => {
    /**
     * C'est voulu, et c'est ce qui fait le tourbillon : au milieu du tour les yeux
     * sont de l'autre cote de la sphere, donc le moteur les retire de l'image. Ce
     * test est la pour qu'on ne « corrige » pas cette disparition en croyant a un
     * bug — et pour verifier qu'ils reviennent bien, au bon endroit.
     */
    const image = (tour: number) => {
      const moteur = new BotEngine(
        100,
        'idle',
        cercle(),
        EXPRESSION_BY_ID.get('neutre')!
      );
      moteur.setLook(lookTarget(vise({ tour })), 0);
      return moteur.sample(1);
    };
    expect(image(0).eyes).toHaveLength(2);
    // a mi-parcours, la face est a l'oppose du spectateur
    expect(image(0.5).eyes).toHaveLength(0);
    expect(image(1).eyes).toHaveLength(2);

    // ...et un tour complet repose les yeux exactement ou un simple demi-tour
    // les aurait mis : c'est ce qui rend l'atterrissage juste sans reglage
    const complet = image(1).eyes[0]!.matrix;
    const sansTour = new BotEngine(
      100,
      'idle',
      cercle(),
      EXPRESSION_BY_ID.get('neutre')!
    );
    sansTour.setLook(
      { yaw: -TURN, pitch: PITCH, mix: 1, spin: 0, wander: 0 },
      0
    );
    expect(complet).toBe(sansTour.sample(1).eyes[0]!.matrix);
  });
});

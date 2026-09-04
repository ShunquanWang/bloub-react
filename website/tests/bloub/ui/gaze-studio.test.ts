import {
  EXPRESSION_BY_ID,
  type ExpressionId,
  EXPRESSIONS,
  type GazeScript,
} from 'bloub-react';
import { describe, expect, it } from 'vitest';
import { HUMEURS, TOUR_TIME, tourLook } from '@/bloub/ui/gaze-studio';
import { BotEngine } from '../../../../packages/bloub-react/src/bot/engine';
import {
  type Aim,
  lookTarget,
  SPIN,
} from '../../../../packages/bloub-react/src/bot/gaze';
import { SHAPE_BY_ID } from '../../../../packages/bloub-react/src/bot/skins';
import { STATE_BY_ID } from '../../../../packages/bloub-react/src/bot/states';

const cercle = () => SHAPE_BY_ID.get('cercle')!.radii;

const vise = (o: Partial<Aim> = {}): Aim => ({
  nx: 0,
  ny: 0,
  tour: 1,
  pointer: true,
  ...o,
});

describe('tour d arrivee sur le site', () => {
  const bot = (id: ExpressionId) =>
    new BotEngine(100, 'idle', cercle(), EXPRESSION_BY_ID.get(id)!);

  /**
   * LA regle d'un script de regard, et ce qui le rend sans entretien : il finit a
   * `mix: 0`, ou la pose de l'etat commande seule. Il n'y a donc rien a relacher —
   * et un relachement se verrait sous la forme d'un dernier glissement des yeux,
   * juste au moment ou tout devrait etre pose.
   */
  it('rend la main a la pose en finissant', () => {
    expect(tourLook(TOUR_TIME).mix).toBe(0);
    expect(tourLook(TOUR_TIME + 5).spin).toBe(0);
  });

  it('repose les yeux sur l expression choisie, quelle qu elle soit', () => {
    for (const id of EXPRESSIONS.map((e) => e.id)) {
      const joue = bot(id);
      joue.setLook(tourLook(TOUR_TIME), 0);
      expect(joue.sample(1).eyes[0]!.matrix, id).toBe(
        bot(id).sample(1).eyes[0]!.matrix
      );
    }
  });

  it('laisse le bot vivre pendant le tour', () => {
    // la derive n'est pas eteinte : il n'y a pas de pointeur a suivre, donc rien
    // ne justifie de figer le regard comme le fait `lookTarget`
    expect(tourLook(TOUR_TIME / 2).wander).toBe(1);
  });

  it('n impose aucune direction, a aucun moment', () => {
    // `mix` a zero sur tout le parcours : seul `spin` travaille, ce qui fait
    // passer les yeux derriere la boule au lieu de les glisser en travers
    for (const k of [0, 0.25, 0.5, 0.75, 1]) {
      expect(tourLook(k * TOUR_TIME).mix, `tour ${k}`).toBe(0);
    }
  });

  it('le tour part d un tour ENTIER, qui est deja le bon angle', () => {
    // -360deg est le meme angle que 0 : la premiere image est deja posee juste,
    // et c'est ce qui fait atterrir le tour sans reglage
    expect(tourLook(0).spin).toBe(SPIN);
    const depart = bot('neutre');
    depart.setLook(tourLook(0), 0);
    expect(depart.sample(1).eyes[0]!.matrix).toBe(
      bot('neutre').sample(1).eyes[0]!.matrix
    );
  });

  it('le tour fait passer les yeux DERRIERE la boule', () => {
    // a mi-parcours ils ont franchi le limbe, donc le moteur ne les dessine plus
    // du tout : c'est la preuve que le tour est un vrai trajet SUR LA SPHERE et
    // non un glissement en travers du visage
    const milieu = bot('neutre');
    milieu.setLook(tourLook(TOUR_TIME / 2), 0);
    expect(milieu.sample(1).eyes).toHaveLength(0);
  });

  /**
   * Pourquoi l'arrivee ne joue QUE le repos, et ce qu'on casserait en y glissant
   * un etat de plus.
   *
   * Un script de regard peut amener les yeux ou il veut, sauf sur un axe : `Look`
   * ne touche volontairement pas au ROULIS — la tete penchee est la signature du
   * bot et ne suit ni le curseur ni un script. Or chaque etat a son propre roulis
   * (le clin d'oeil penche a +6,7deg la ou le repos penche a -13). Ces degres-la
   * ne s'anticipent pas : ils sautent au changement d'etat, sous un clignement de
   * 0,2 s qui ne couvre pas un fondu de 0,3.
   */
  it('ne peut pas anticiper le roulis, d ou une arrivee sans changement d etat', () => {
    expect(STATE_BY_ID.get('wink')!.pose(0).gaze.roll).not.toBe(
      EXPRESSION_BY_ID.get('neutre')!.gaze.roll
    );
    expect(tourLook(0)).not.toHaveProperty('roll');
  });

  it('est un GazeScript', () => {
    const script: GazeScript = tourLook;
    expect(script(0).spin).toBe(360);
  });
});

describe('stabilite du regard entre expressions', () => {
  /** Ordonnee de l'oeil interieur, en px de viewBox (y descend a l'ecran). */
  const oeilY = (m: BotEngine) =>
    +/matrix\([^,]+,[^,]+,[^,]+,[^,]+,-?[\d.]+,(-?[\d.]+)/.exec(
      m.sample(1).eyes[0]!.matrix
    )![1]!;

  it('garde les yeux a la meme hauteur, quelle que soit l humeur affichee', () => {
    /**
     * Le bug qu'on verrouille : quand le tangage etait un ECART, la hauteur des
     * yeux suivait celle de l'expression. « Neutre » regarde a +28,6deg et les
     * humeurs entre -9 et +9, donc les yeux tombaient d'un coup au premier
     * changement d'humeur — ce qui se lit comme un defaut, pas comme une
     * expression.
     */
    const hauteurs = HUMEURS.map((id) => {
      const m = new BotEngine(100, 'idle', cercle(), EXPRESSION_BY_ID.get(id)!);
      m.setLook(lookTarget(vise()), 0);
      return oeilY(m);
    });
    const ecart = Math.max(...hauteurs) - Math.min(...hauteurs);
    // sur une boule de 100 de rayon : quelques pixels, pas trente
    expect(ecart, `ecart de hauteur de ${ecart.toFixed(1)} px`).toBeLessThan(4);
  });

  it('sans pilotage, les expressions gardent bien des hauteurs differentes', () => {
    // le contre-test : c'est le SUIVI qui stabilise, pas les expressions qui
    // auraient perdu leur caractere vertical
    const hauteurs = EXPRESSIONS.map((e) =>
      oeilY(new BotEngine(100, 'idle', cercle(), EXPRESSION_BY_ID.get(e.id)!))
    );
    expect(Math.max(...hauteurs) - Math.min(...hauteurs)).toBeGreaterThan(30);
  });

  it('ne retient que des humeurs a roulis nul, sinon la tete penche', () => {
    // c'est le critere de la liste, et il ne se devine pas : le roulis n'est pas
    // neutralise par le suivi, contrairement au lacet et au tangage
    for (const id of HUMEURS) {
      expect(EXPRESSION_BY_ID.get(id)!.gaze.roll, id).toBe(0);
    }
  });
});

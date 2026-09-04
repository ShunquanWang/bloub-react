import {
  blockAt,
  EXPRESSION_BY_ID,
  type GazeScript,
  minDurationOf,
  offsetOf,
  SHAPE_BY_ID,
  STATE_BY_ID,
} from 'bloub-react';
import { describe, expect, it } from 'vitest';
import { TOUR_TIME } from '@/bloub/ui/gaze-studio';
import {
  type Arrivee,
  INTRO,
  INTRO_GAZE,
  introDue,
  POSE_AT,
} from '@/bloub/ui/intro';
import { BotEngine } from '../../../../packages/bloub-react/src/bot/engine';

/** Arrivee ordinaire : URL nue, venue directe, aucune preference de calme. */
const arrive = (o: Partial<Arrivee> = {}): Arrivee => ({
  named: false,
  gallery: false,
  rechargement: false,
  calme: false,
  ...o,
});

describe('declenchement de l arrivee', () => {
  it('se joue quand on vient sur le site', () => {
    expect(introDue(arrive())).toBe(true);
  });

  it('ne se rejoue pas sur une page deja ouverte', () => {
    // rechargement, precedent, suivant : on ne VIENT pas, on revient
    expect(introDue(arrive({ rechargement: true }))).toBe(false);
  });

  it('laisse la place aux liens qui visent le lecteur ou la planche', () => {
    // `#etat=` decrit deja une lecture : la mise en scene d'accueil ne doit pas
    // s'y superposer, sinon le lien n'ouvre pas ce qu'il demande
    expect(introDue(arrive({ named: true }))).toBe(false);
    // `#planche` est le chemin de verification visuelle : il ne depend de rien
    expect(introDue(arrive({ gallery: true }))).toBe(false);
  });

  it('se tait quand on demande moins d animation', () => {
    expect(introDue(arrive({ calme: true }))).toBe(false);
  });
});

describe('montage de l arrivee', () => {
  it('laisse chaque animation aboutir', () => {
    for (const b of INTRO) {
      expect(b.duration, b.state).toBeGreaterThanOrEqual(
        minDurationOf(b.state)
      );
    }
  });

  /*
   * Le moteur ne garde qu'une case d'historique : un bloc plus court que le fondu
   * d'entree du suivant saute a l'image au lieu de se fondre. Le plancher general
   * (`MIN_BLOCK`) suffit pour les etats du catalogue, mais l'arrivee ecrit ses
   * durees a la main.
   */
  it('ne coupe aucun bloc plus court que le fondu du suivant', () => {
    for (let i = 0; i < INTRO.length - 1; i++) {
      const suivant = STATE_BY_ID.get(INTRO[i + 1]!.state)!;
      expect(INTRO[i]!.duration, INTRO[i]!.state).toBeGreaterThanOrEqual(
        suivant.morph
      );
    }
  });

  /*
   * LA lecon de la comparaison de variantes, et ce qui se casserait en glissant
   * un etat « qui fait joli » dans le montage : tout etat autre que le repos
   * apporte sa PROPRE pose de regard, donc un saut des yeux au changement. Le
   * clignement cense le masquer ne dure que 0,2 s quand le fondu en dure 0,3 : les
   * yeux se rouvrent en cours de route et ca se lit comme une teleportation.
   */
  it('ne joue que le repos, du debut a la fin', () => {
    for (const b of INTRO) {
      expect(
        b.state,
        'un autre etat apporte sa pose de regard, donc un saut'
      ).toBe('idle');
    }
  });

  it('garde la forme ET l expression choisies', () => {
    // corollaire du precedent, mais c'est ce qu'on VOIT : la boule qui parait est
    // bien l'avatar de l'utilisateur, sans morph de silhouette ni de visage
    for (const b of INTRO) {
      const def = STATE_BY_ID.get(b.state)!;
      expect(def.baseBody, b.state).toBe(true);
      expect(def.baseFace, b.state).toBe(true);
    }
  });

  it('pose l interface sur un bloc qui existe', () => {
    expect(POSE_AT).toBeGreaterThan(0);
    expect(POSE_AT).toBeLessThan(INTRO.length);
  });

  it('laisse le tour du regard se terminer avant de poser l interface', () => {
    // sinon la boule part rejoindre sa place alors que ses yeux sont encore en
    // train de faire le tour : deux mouvements a la fois, et le tour coupe net
    expect(offsetOf(INTRO, POSE_AT)).toBeGreaterThanOrEqual(TOUR_TIME);
  });

  it('rend la main vite', () => {
    // Ce qui compte n'est pas la duree totale mais la date ou l'interface arrive :
    // apres, la page est utilisable. C'est donc CETTE date qu'on borne.
    expect(offsetOf(INTRO, POSE_AT)).toBeLessThanOrEqual(2);
  });
});

/**
 * Le test qui verrouille la plainte d'origine : « d'un coup, bam, il se
 * teleporte ».
 *
 * On rejoue l'arrivee image par image comme le fait le lecteur — meme
 * enchainement de blocs, meme script de regard — et on mesure le deplacement des
 * yeux d'une image a l'autre. Un saut, c'est exactement ca : une seule image ou
 * ils parcourent une grande distance.
 *
 * La logique de lecture est reproduite ici plutot qu'importee parce qu'elle vit
 * dans un composant Vue, hors de portee de ces tests sans DOM. Elle tient en
 * quelques lignes et suit `BloubBot.apply`.
 */
describe('fluidite de l arrivee', () => {
  const cercle = SHAPE_BY_ID.get('cercle')!.radii;
  const neutre = EXPRESSION_BY_ID.get('neutre')!;
  const IMAGE = 1 / 60;

  /**
   * Plus grand deplacement de l'oeil interieur entre deux images, en px.
   *
   * `pendantMorph` restreint la mesure aux images qui suivent un changement
   * d'etat. C'est LA que se produisait la teleportation, et la seule fenetre ou un
   * grand deplacement est forcement un defaut : ailleurs il peut etre la
   * trajectoire voulue — le tour du regard fait 20 px par image au passage du
   * limbe, parce qu'un petit angle y devient un grand deplacement a l'ecran.
   */
  function pireSaut(
    gaze: GazeScript | null = INTRO_GAZE,
    pendantMorph = false
  ): number {
    const moteur = new BotEngine(100, INTRO[0]!.state, cercle, neutre);
    const fin = offsetOf(INTRO, INTRO.length - 1) + 1;
    let courant = 0;
    let avant: { x: number; y: number } | null = null;
    let pire = 0;
    /** Date de fin du fondu en cours, ou -1 si aucun changement d'etat recent. */
    let morphJusqu = -1;

    // amorce datee d'un rattrapage plus tot, comme le composant : sinon la
    // premiere image sort au repos et la deuxieme sur le script
    if (gaze) moteur.setLook(gaze(0), -IMAGE, IMAGE);

    for (let t = 0; t < fin; t += IMAGE) {
      const { index } = blockAt(INTRO, t);
      if (index !== courant) {
        const entrant = INTRO[index]!.state;
        // `setState` ignore un etat inchange : pas de fondu, donc pas de fenetre
        if (entrant !== moteur.state)
          morphJusqu = t + STATE_BY_ID.get(entrant)!.morph;
        moteur.setState(entrant, t);
        courant = index;
      }
      if (gaze) moteur.setLook(gaze(t), t, IMAGE);

      const oeil = moteur.sample(t).eyes[0];
      if (!oeil) {
        // yeux passes derriere la boule : rien a comparer, on repart proprement
        avant = null;
        continue;
      }
      const p = /matrix\(([^)]+)\)/
        .exec(oeil.matrix)![1]!
        .split(',')
        .map(Number);
      const ici = { x: p[4]!, y: p[5]! };
      if (avant && (!pendantMorph || t <= morphJusqu)) {
        pire = Math.max(pire, Math.hypot(ici.x - avant.x, ici.y - avant.y));
      }
      avant = ici;
    }
    return pire;
  }

  it('ne fait sauter les yeux a aucun changement d etat', () => {
    const saut = pireSaut(INTRO_GAZE, true);
    expect(saut, `${saut.toFixed(1)} px pendant un fondu`).toBeLessThan(4);
  });

  /*
   * Et le contre-test, sans quoi le precedent passerait tout seul : le montage
   * n'ayant que des blocs de repos, il n'y a AUCUN fondu d'entree a surveiller.
   * C'est precisement ce qui rend l'arrivee lisse, et ca doit rester vrai.
   */
  it('et il n y a justement aucun fondu d etat a subir', () => {
    expect(new Set(INTRO.map((b) => b.state)).size).toBe(1);
  });

  /*
   * Pourquoi la boule est RONDE le temps du tour, quelle que soit la forme
   * choisie (voir `forme` dans `App.vue`).
   *
   * Les yeux sont recolles au contour reel pour ne pas deborder de la silhouette
   * (`radiusAtAngle`). Sur un cercle ce rayon est constant, donc le tour est
   * lisse. Sur une forme non circulaire, ils suivent le profil et sautillent —
   * c'est ce que ce test mesure, et c'est un constat, pas un defaut a corriger :
   * `radiusAtAngle` fait exactement ce pour quoi il est la.
   */
  it('un tour sur une forme non circulaire ferait sautiller les yeux', () => {
    /** Ordonnee de l'oeil interieur image par image, `NaN` quand il est cache. */
    const trajectoire = (forme: string) => {
      const m = new BotEngine(
        100,
        'idle',
        SHAPE_BY_ID.get(forme)!.radii,
        neutre
      );
      const ys: number[] = [];
      for (let t = 0; t < TOUR_TIME; t += IMAGE) {
        m.setLook(INTRO_GAZE(t), t, IMAGE);
        const e = m.sample(t).eyes[0];
        if (!e) {
          ys.push(NaN);
          continue;
        }
        ys.push(Number(/matrix\(([^)]+)\)/.exec(e.matrix)![1]!.split(',')[5]));
      }
      return ys;
    };

    const rond = trajectoire('cercle');
    const goutte = trajectoire('goutte');
    let ecart = 0;
    for (let i = 0; i < rond.length; i++) {
      if (Number.isNaN(rond[i]!) || Number.isNaN(goutte[i]!)) continue;
      ecart = Math.max(ecart, Math.abs(goutte[i]! - rond[i]!));
    }
    // sur une boule de 100 de rayon : des dizaines de px, pas un ou deux
    expect(
      ecart,
      `${ecart.toFixed(1)} px d ecart vertical avec le cercle`
    ).toBeGreaterThan(15);
  });

  it('fait bien parcourir un tour aux yeux', () => {
    // le tour est le seul mouvement de l'arrivee : s'il disparaissait, il ne
    // resterait qu'un fondu et plus personne ne s'en apercevrait ici
    const avec = pireSaut(INTRO_GAZE);
    const sans = pireSaut(null);
    expect(sans, 'sans script, seule la derive au repos bouge').toBeLessThan(1);
    expect(
      avec,
      'le tour passe le limbe, donc il va vite a cet instant'
    ).toBeGreaterThan(5);
  });
});

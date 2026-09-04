import * as react from 'react';
import { CSSProperties } from 'react';

interface DotRender {
    x: number;
    y: number;
    r: number;
    opacity: number;
    /** couleur explicite ; par defaut le rendu prend celle du corps */
    color?: string;
    /**
     * Brume de profondeur : 0 = fondu dans le fond, 1 = couleur du corps pleine.
     * Le melange se fait au rendu, qui seul connait la couleur choisie.
     */
    depth?: number;
    /**
     * Forme non circulaire, en unites de rayon de boule et centree sur l'origine
     * (le point du "!" penche est une goutte, pas un disque). Quand elle est
     * fournie, `r` n'est plus utilise pour le trace.
     */
    d?: string;
    /** rotation appliquee a `d`, en degres */
    rot?: number;
}
/**
 * Ce qu'un etat declare : la geometrie de l'arc reste en unites de rayon de
 * boule, c'est le moteur (seul a connaitre l'echelle du viewBox) qui la
 * rasterise. Sans ca les etats devraient connaitre le viewBox.
 */
interface ArcSpec {
    id: string;
    seed: ArcSeed;
    t: number;
    opacity: number;
}
interface ArcSeed {
    /** demi-grand axe, en unites de rayon de boule */
    a: number;
    /** aplatissement b/a : mesure <= 0.45, les plans d'orbite sont vus par la tranche */
    k: number;
    /** inclinaison du grand axe a l'ecran, radians */
    tilt: number;
    /** tours par seconde */
    speed: number;
    phase: number;
    /** fraction du tour reellement tracee */
    sweep: number;
    hue: number;
    hueSpan: number;
    width: number;
    cx: number;
    cy: number;
}

interface HeadGaze {
    /** lacet, degres, positif = regarde a droite */
    yaw: number;
    /** tangage, degres, positif = regarde en haut */
    pitch: number;
    /** roulis, degres, inclinaison de la tete */
    roll: number;
}

/**
 * Une silhouette = un profil radial r(theta) plus une pose.
 *
 * Tout passe par des profils echantillonnes au MEME nombre d'angles : deux
 * formes quelconques ont donc des points qui se correspondent un a un, et le
 * morphing se reduit a une interpolation lineaire des rayons. C'est ce qui
 * rend les transitions propres sans librairie de morphing de path.
 */
interface Silhouette {
    radii: number[];
    /** rotation du profil, en radians */
    rot: number;
    /** decalage du centre, en unites de rayon de boule */
    cx: number;
    cy: number;
    /** squash & stretch, applique en repere ecran (apres rotation) */
    sx: number;
    sy: number;
}

interface EyeCfg {
    /** largeur locale (axe court de la gelule), en unites de rayon de boule */
    w: number;
    /** hauteur locale (axe long) */
    h: number;
    /** 1 = ouvert, 0 = ferme */
    open: number;
    /**
     * Inclinaison propre de la gelule, en degres, positif = le haut part a
     * droite. Appliquee APRES le repere tangent de la sphere. Sans elle, les deux
     * yeux penchent forcement du meme cote (le roulis de tete) et la colere comme
     * la tristesse, qui demandent des inclinaisons en miroir, sont hors de portee.
     */
    tilt?: number;
}
interface Pose {
    /** silhouette du corps, en unites de rayon de boule */
    sil: Silhouette;
    /** decalage global du corps ET des yeux */
    offX: number;
    offY: number;
    gaze: HeadGaze;
    /** demi-ecart des yeux sur la sphere, en degres */
    split: number;
    /** [oeil interieur, oeil exterieur] */
    eyes: [EyeCfg, EyeCfg];
    /** opacite des yeux : sert aux etats sans visage */
    eyeAlpha: number;
    bodyAlpha: number;
    dots: DotRender[];
    arcs: ArcSpec[];
    notif: {
        x: number;
        y: number;
        r: number;
        notch: number;
    } | null;
    /** true = le decor passe derriere le corps (particules de l'eclatement) */
    dotsBehind: boolean;
}
type StateId = 'idle' | 'thinking' | 'wink' | 'wide' | 'alert' | 'notify' | 'exclaim' | 'sleep' | 'egg' | 'hexagon' | 'play' | 'orbit' | 'burst' | 'comet'
/** transition d'interface, pas une animation du catalogue : hors `SEQUENCE` */
 | 'swirl';
interface StateDef {
    id: StateId;
    /** duree de maintien quand la sequence complete est jouee */
    duration: number;
    /**
     * duree en dessous de laquelle l'animation est coupee avant d'aboutir : le
     * "!" ne revient pas, le corps reste eclate. Elle se lit dans les constantes
     * de `pose` ci-dessous, elle ne se choisit pas. Absente = l'etat ignore le
     * temps ou boucle, n'importe quelle duree lui va (voir `MIN_BLOCK`).
     */
    minDuration?: number;
    /** duree du morph d'entree */
    morph: number;
    /** true = l'entree est masquee par un clignement, comme dans la video */
    blinkIn: boolean;
    /**
     * true = le corps est la silhouette "au repos", donc remplacable par la forme
     * choisie dans le personnalisateur. Les etats qui dessinent leur propre forme
     * (le "!", les points, l'oeuf, le triangle...) valent false : c'est cette forme
     * la qui EST l'animation.
     */
    baseBody: boolean;
    /**
     * true = l'etat porte le visage "au repos", donc remplacable par l'expression
     * choisie. Seul `idle` : les autres etats a visage ont une expression relevee
     * sur la video, c'est precisement ce qu'on reproduit.
     */
    baseFace: boolean;
    pose(local: number): Pose;
}
declare const STATES: StateDef[];
declare const STATE_BY_ID: Map<StateId, StateDef>;
/** Ordre de lecture de la sequence complete, calque sur la video de reference. */
/**
 * Date, en temps local, ou chaque etat est le plus lisible : c'est la pose que
 * montrent les vignettes et la planche. Rendu deterministe, donc comparable
 * d'une execution a l'autre. Le type force a couvrir tout nouvel etat.
 */
declare const POSES: Record<StateId, number>;
declare const SEQUENCE: StateId[];

/**
 * Un cycle est un montage : une suite de blocs, chacun un etat tenu pendant une
 * duree. Donnees pures, aucune horloge — le meme cycle peut etre relu par les
 * tests, par BloubBot et par un editeur externe.
 *
 * Un bloc n'a pas d'identifiant : c'est une position dans une liste.
 */
interface Block {
    state: StateId;
    duration: number;
}
interface Cycle {
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
declare const MIN_BLOCK: number;
/**
 * Garde-fou de duree max d'un bloc (secondes). Allonger est sans risque moteur,
 * mais une piste de blocs d'une minute n'est plus lisible.
 */
declare const MAX_BLOCK = 10;
/** Pas de duree, en secondes. */
declare const STEP = 0.1;
/** Duree minimale d'un bloc : le plancher moteur, ou la mesure de l'etat. */
declare function minDurationOf(state: StateId): number;
/** Ramene une duree dans ses bornes et sur le pas, sans trainee de flottants. */
declare function clampDuration(state: StateId, seconds: number): number;
declare function makeBlock(state: StateId): Block;
/**
 * Le montage releve sur la video : l'ordre de `SEQUENCE`, chaque etat tenu sa
 * duree mesuree. Amorce de lecture / personnalisation.
 */
declare function defaultCycle(): Cycle;
declare function totalDuration(blocks: Block[]): number;
/** Date de debut d'un bloc dans le montage. */
declare function offsetOf(blocks: Block[], index: number): number;
/**
 * Bloc joue a la date `t` et temps ecoule dedans. Au-dela du dernier bloc on
 * retombe au debut : la lecture boucle.
 */
declare function blockAt(blocks: Block[], t: number): {
    index: number;
    elapsed: number;
};

/**
 * Expression de repos du bot.
 *
 * Le visage ne tient qu'à deux gélules, donc tout se joue sur quatre leviers :
 * l'orientation de la tête, l'écart des yeux, leurs proportions, et
 * l'inclinaison propre de chaque œil. C'est ce dernier qui permet la colère et
 * la tristesse : elles demandent des inclinaisons EN MIROIR (les hauts qui
 * convergent ou divergent), impossible avec le seul roulis de tête qui incline
 * les deux yeux du même côté.
 *
 * Seul l'état de repos porte cette expression. Les états expressifs de la vidéo
 * (clin d'œil, yeux écarquillés, notification) gardent la leur : c'est elle
 * qu'on est venu reproduire.
 *
 * Les amplitudes s'appuient sur bible-strong-avatar-lab, qui expose le même
 * modèle (tête X/Y/Z, largeur et hauteur par œil, écart, angle par œil) : chez
 * eux la largeur va de 0,8 à 2,7 fois le neutre, la hauteur de 0,3 à 1,5, et
 * les angles jusqu'à ±80°. On reste dans cette enveloppe.
 */
/** Enumeres pour que la couche i18n verifie leurs traductions a la compilation. */
type ExpressionId = 'neutre' | 'attentif' | 'surpris' | 'excite' | 'heureux' | 'hilare' | 'colere' | 'triste' | 'effraye' | 'mefiant' | 'confus' | 'curieux' | 'fier' | 'timide' | 'blase' | 'somnolent';
interface BotExpression {
    id: ExpressionId;
    gaze: HeadGaze;
    split: number;
    eyes: [EyeCfg, EyeCfg];
}
declare const EXPRESSIONS: BotExpression[];
declare const EXPRESSION_BY_ID: Map<string, BotExpression>;
declare const DEFAULT_EXPRESSION = "neutre";

/**
 * Ou le bot porte son regard quand quelque chose d'exterieur le pilote — le
 * pointeur de la souris, aujourd'hui.
 *
 * `yaw` et `pitch` sont des directions ABSOLUES, qui remplacent celles de la pose
 * a mesure que `mix` monte. Deux raisons, chacune un piege deja tombe :
 *
 * - c'est le MOTEUR qui doit faire ce melange, pas l'appelant, parce que lui seul
 *   connait la pose A CET INSTANT. Un appelant qui compenserait l'orientation de
 *   l'expression lirait sa valeur d'arrivee pendant que le morph est encore en
 *   cours, et les yeux sautaient a chaque changement d'humeur ;
 * - et il faut que ce soit absolu sur les DEUX axes. En relatif, la hauteur des
 *   yeux suivait celle de chaque expression — « neutre » regarde a +28,6deg quand
 *   les autres sont entre -9 et +9 — donc les yeux tombaient d'un coup au premier
 *   changement d'humeur. Ce qui fait le caractere d'une expression pendant le
 *   suivi, c'est la FORME de ses yeux (plisses, ronds, dissymetriques), pas
 *   l'endroit ou elle regarde : celui-la, c'est le curseur qui le decide.
 *
 * `mix` dit a quel point l'exterieur commande la DIRECTION (0 = pas du tout).
 *
 * `wander` dit, separement, ce qui reste de derive automatique. Les deux ne se
 * confondent pas : quand le pointeur bouge, la derive doit s'eteindre — cumulees,
 * le bot aurait l'air de chercher le curseur sans jamais le tenir. Mais quand il
 * n'y a PAS de pointeur (arrivee au clavier, au tactile, ou souris sortie de la
 * fenetre), la tete doit rester tournee ET continuer de vivre. Les confondre
 * figeait le regard des que la vue s'ouvrait.
 *
 * `spin` est un tour a parcourir EN CHEMIN, en degres, qu'on fait fondre vers 0
 * avec l'arrivee. Comme les yeux vivent sur une sphere, un tour les fait passer
 * derriere la boule et revenir de l'autre cote — et `-360deg` etant le meme
 * angle que `0`, il ne change rien a l'endroit ou ils se posent.
 */
interface Look {
    yaw: number;
    pitch: number;
    mix: number;
    spin: number;
    wander: number;
}

/** Regard scripte : evalue avec le temps ecoule depuis le debut, en secondes. */
type GazeScript = (t: number) => Look;

/**
 * Props for the animated SVG avatar.
 *
 * Two common modes:
 * - **Live** — omit `frozenAt`; the bot advances with `requestAnimationFrame`
 *   (timeline / studio player). Drive `block` / `state` / `playing` / `elapsed`
 *   as a controlled player, or leave defaults for a self-running cycle.
 * - **Still** — set `frozenAt` to a time in seconds; no RAF loop. Used for
 *   customizer thumbnails and exports (`sample(t)` is pure).
 */
type BloubBotProps = {
    /**
     * Side length of the square SVG, in CSS pixels.
     * @default 320
     */
    size?: number;
    /**
     * Body shape id from the skin catalog (`SHAPES` / `ShapeId`).
     * Unknown ids fall back to the circular silhouette.
     * @default DEFAULT_SHAPE (`"cercle"`)
     */
    shape?: string;
    /**
     * Fill / ink color id from the skin catalog (`COLORS` / `ColorId`).
     * Unknown ids fall back to near-black ink.
     * @default DEFAULT_COLOR (`"encre"`)
     */
    color?: string;
    /**
     * Resting face expression id (`EXPRESSIONS` / `ExpressionId`).
     * Applied on idle / `baseFace` states; animated states keep their own faces.
     * @default DEFAULT_EXPRESSION (`"neutre"`)
     */
    expression?: string;
    /**
     * Background color behind the bot (CSS color).
     * Also tints depth fog on decorative particles via `mixHex`.
     * @default `"#f9f9f9"`
     */
    paper?: string;
    /**
     * Accessible name for the root SVG (`role="img"`).
     * @default `"Animated bot avatar"`
     */
    'aria-label'?: string;
    /**
     * Freeze rendering at this time (seconds since the current state started).
     * Disables the animation loop; the frame is reproducible pixel-for-pixel.
     * Omit for live playback.
     */
    frozenAt?: number;
    /**
     * Playback montage: ordered blocks (`state` + `duration`).
     * When omitted, uses `defaultCycle().blocks` (full video sequence).
     */
    cycle?: Block[];
    /**
     * When `true`, eyes track the pointer (after a short turn-in).
     * Ignored while `frozenAt` is set. Typical for the studio hero, not tiles.
     * @default false
     */
    follow?: boolean;
    /**
     * Scripted look evaluated each frame as `(tSeconds) => Look`.
     * Used for the site intro spin; `null` leaves pose / follow in charge.
     * @default null
     */
    gaze?: GazeScript | null;
    /**
     * Controlled index of the current block in `cycle`.
     * @default 0
     */
    block?: number;
    /** Called when playback advances (or seeks) to another block index. */
    onBlockChange?: (block: number) => void;
    /**
     * Controlled animation state id (`StateId`).
     * In the player this mirrors the active block; tiles pass a fixed state.
     * @default `"idle"`
     */
    state?: StateId;
    /** Called when the engine switches state (block change or external seek). */
    onStateChange?: (state: StateId) => void;
    /**
     * When `true`, the cycle advances through blocks on the clock.
     * When `false`, the current block holds (eyes / idle motion may still run).
     * @default false
     */
    playing?: boolean;
    /** Reserved for controlled `playing` updates (not wired in all hosts yet). */
    onPlayingChange?: (playing: boolean) => void;
    /**
     * Controlled elapsed time within the current block, in seconds.
     * Surfaced for timeline scrubbers / playhead UI.
     * @default 0
     */
    elapsed?: number;
    /** Called as time progresses inside the current block while playing. */
    onElapsedChange?: (elapsed: number) => void;
    /** Extra class names on the root `<svg>`. */
    className?: string;
    /** Inline styles on the root `<svg>`. */
    style?: CSSProperties;
};
/** Imperative API via `ref` (seek / off-screen export). */
type BloubBotHandle = {
    /** Jump to a cycle block; optional offset in seconds inside that block. */
    seek: (index: number, offset?: number) => void;
    /**
     * Render absolute cycle time `t` (seconds from montage start).
     * Used by off-screen capture; applies block transitions like live playback.
     */
    rendAt: (t: number) => void;
};
declare const BloubBot: react.ForwardRefExoticComponent<BloubBotProps & react.RefAttributes<BloubBotHandle>>;

/**
 * Formes et couleurs proposees par le personnalisateur du bot.
 *
 * A la difference des silhouettes d'animation (`profiles.ts`), celles-ci ne sont
 * PAS relevees sur la video : elles sont construites analytiquement d'apres la
 * grille du personnalisateur d'origine. Deux sources distinctes, donc, et c'est
 * volontaire — les etats animes doivent rester fideles a la video, les formes de
 * base sont un choix d'utilisateur.
 */
/**
 * Les identifiants sont enumeres plutot que deduits du tableau : c'est ce qui
 * permet a la couche i18n de verifier A LA COMPILATION que chaque forme a bien
 * sa traduction dans les trois langues (`t(\`shapes.${id}\`)` ne compile que si
 * la cle existe). Un `as const` sur le tableau aurait le meme effet mais
 * rendrait `radii` en lecture seule, alors que le moteur le passe tel quel.
 */
type ShapeId = 'cercle' | 'galet' | 'squircle' | 'capsule' | 'triangle' | 'hexagone' | 'nuage' | 'goutte';
interface BotShape {
    id: ShapeId;
    radii: number[];
}
declare const SHAPES: BotShape[];
declare const SHAPE_BY_ID: Map<string, BotShape>;
declare const DEFAULT_SHAPE = "cercle";
type ColorId = 'encre' | 'creme' | 'brun' | 'rouge' | 'orange' | 'ambre' | 'vert' | 'turquoise' | 'bleu' | 'violet' | 'rose' | 'gris';
interface BotColor {
    id: ColorId;
    hex: string;
}
/** Palette du personnalisateur d'origine. */
declare const COLORS: BotColor[];
declare const COLOR_BY_ID: Map<string, BotColor>;
declare const DEFAULT_COLOR = "encre";

export { type Block, BloubBot, type BloubBotHandle, type BloubBotProps, type BotExpression, COLORS, COLOR_BY_ID, type ColorId, type Cycle, DEFAULT_COLOR, DEFAULT_EXPRESSION, DEFAULT_SHAPE, EXPRESSIONS, EXPRESSION_BY_ID, type ExpressionId, type GazeScript, MAX_BLOCK, MIN_BLOCK, POSES, SEQUENCE, SHAPES, SHAPE_BY_ID, STATES, STATE_BY_ID, STEP, type ShapeId, type StateId, blockAt, clampDuration, defaultCycle, makeBlock, minDurationOf, offsetOf, totalDuration };

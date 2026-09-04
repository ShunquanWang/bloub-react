'use client';

import {
  type CSSProperties,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { type Block, blockAt, defaultCycle, offsetOf } from './bot/cycles';
import { NOTIF_BLUE } from './bot/decor';
import { BotEngine, type BotFrame } from './bot/engine';
import {
  type BotExpression,
  DEFAULT_EXPRESSION,
  EXPRESSION_BY_ID,
} from './bot/expressions';
import { type GazeScript, lookTarget, TURN_TIME } from './bot/gaze';
import { clamp, easings } from './bot/math';
import { DEMI_VIEWBOX, RAYON } from './bot/repere';
import {
  COLOR_BY_ID,
  DEFAULT_COLOR,
  DEFAULT_SHAPE,
  mixHex,
  SHAPE_BY_ID,
} from './bot/skins';
import { STATE_BY_ID, type StateId } from './bot/states';

export type BloubBotProps = {
  size?: number;
  /** identifiant de forme du personnalisateur */
  shape?: string;
  /** identifiant de couleur du personnalisateur */
  color?: string;
  /** identifiant d'expression de repos du personnalisateur */
  expression?: string;
  /** couleur du fond, utilisee pour la brume de profondeur des particules */
  paper?: string;
  /** accessible name; defaults to a short English label */
  'aria-label'?: string;
  /**
   * Fige le rendu a cette date (en secondes depuis le debut de l'etat).
   * Le moteur etant une fonction pure du temps, on obtient une image
   * reproductible au pixel pres, sans boucle d'animation.
   */
  frozenAt?: number;
  /**
   * Montage joue par le lecteur : une suite d'etats, chacun tenu la duree de
   * son bloc. Par defaut, le cycle releve sur la video.
   */
  cycle?: Block[];
  /**
   * Le regard suit le pointeur. Hors de portee des vignettes figees.
   */
  follow?: boolean;
  /**
   * Regard scripte de l'arrivee : evalue a chaque image avec le temps ecoule
   * depuis qu'il a ete pose.
   */
  gaze?: GazeScript | null;
  /** index de bloc courant (curseur de lecture) */
  block?: number;
  onBlockChange?: (block: number) => void;
  /** etat courant — sortie du lecteur en lecture, entree pour les vignettes */
  state?: StateId;
  onStateChange?: (state: StateId) => void;
  playing?: boolean;
  onPlayingChange?: (playing: boolean) => void;
  /** Temps ecoule dans le bloc courant, pour la tete de lecture de la timeline. */
  elapsed?: number;
  onElapsedChange?: (elapsed: number) => void;
  className?: string;
  style?: CSSProperties;
};

export type BloubBotHandle = {
  seek: (index: number, offset?: number) => void;
  rendAt: (t: number) => void;
};

const R = RAYON;
const VB = DEMI_VIEWBOX;
const SCRIPT_MORPH = 1 / 60;

type Dot = BotFrame['dots'][number];

function dotAttrs(dot: Dot, ink: string, paper: string) {
  const fill =
    dot.color ??
    (dot.depth === undefined ? ink : mixHex(paper, ink, dot.depth));
  const common = { fill, opacity: dot.opacity };
  return dot.d
    ? {
        ...common,
        d: dot.d,
        transform: `translate(${dot.x} ${dot.y}) rotate(${dot.rot ?? 0}) scale(${R})`,
      }
    : { ...common, cx: dot.x, cy: dot.y, r: dot.r };
}

function DotEl({ dot, ink, paper }: { dot: Dot; ink: string; paper: string }) {
  const attrs = dotAttrs(dot, ink, paper);
  if (dot.d) {
    return <path {...attrs} />;
  }
  return <circle {...attrs} />;
}

export const BloubBot = forwardRef<BloubBotHandle, BloubBotProps>(
  function BloubBot(props, ref) {
    const {
      size = 320,
      shape = DEFAULT_SHAPE,
      color = DEFAULT_COLOR,
      expression: expressionId = DEFAULT_EXPRESSION,
      paper = '#f9f9f9',
      'aria-label': ariaLabel = 'Animated bot avatar',
      frozenAt,
      cycle: cycleProp,
      follow = false,
      gaze = null,
      block: blockProp = 0,
      onBlockChange,
      state: stateProp = 'idle',
      onStateChange,
      playing: playingProp = false,
      onPlayingChange: _onPlayingChange,
      elapsed: elapsedProp = 0,
      onElapsedChange,
      className,
      style,
    } = props;

    const cycle = cycleProp ?? defaultCycle().blocks;
    const shapeRadii = SHAPE_BY_ID.get(shape)?.radii ?? null;
    const ink = COLOR_BY_ID.get(color)?.hex ?? '#0a0a0c';
    const expression =
      EXPRESSION_BY_ID.get(expressionId) ?? (null as BotExpression | null);

    const svgRef = useRef<SVGSVGElement | null>(null);
    const uid = useMemo(() => Math.random().toString(36).slice(2, 8), []);
    const maskId = `bot-mask-${uid}`;

    const engineRef = useRef<BotEngine | null>(null);
    if (!engineRef.current) {
      engineRef.current = new BotEngine(R, stateProp, shapeRadii, expression);
    }
    const engine = engineRef.current;

    const [frame, setFrame] = useState<BotFrame>(() =>
      engine.sample(frozenAt ?? 0)
    );

    // Mutable playback clock — mirrors the Vue script locals.
    const clock = useRef({
      raf: 0,
      nextAt: Infinity,
      last: 0,
      clock: 0,
      blockStart: 0,
      pendingOffset: 0,
      dernierBloc: -1,
      pointer: null as { x: number; y: number } | null,
      aiming: false,
      turnSince: 0,
      gazeSince: 0,
      scripted: false,
      block: blockProp,
      state: stateProp,
      playing: playingProp,
      elapsed: elapsedProp,
      cycle,
      follow,
      gaze,
      frozenAt,
      shapeRadii,
      expression,
      paper,
    });

    const c = clock.current;
    c.block = blockProp;
    c.playing = playingProp;
    c.elapsed = elapsedProp;
    c.cycle = cycle;
    c.follow = follow;
    c.gaze = gaze;
    c.frozenAt = frozenAt;
    c.paper = paper;

    const setBlock = (i: number) => {
      c.block = i;
      onBlockChange?.(i);
    };
    const setState = (id: StateId) => {
      c.state = id;
      onStateChange?.(id);
    };
    const setElapsed = (v: number) => {
      c.elapsed = v;
      onElapsedChange?.(v);
    };

    function apply(i: number, from = 0) {
      const b = c.cycle[i];
      if (!b) {
        c.nextAt = Infinity;
        return;
      }
      c.blockStart = c.clock - from;
      setElapsed(from);
      setState(b.state);
      engine.setState(b.state, c.clock);
      c.nextAt = c.playing ? c.blockStart + b.duration : Infinity;
    }

    function goToBlock(i: number) {
      setBlock(i);
      apply(i);
    }

    function seek(index: number, offset = 0) {
      if (c.block === index) {
        apply(index, offset);
        return;
      }
      c.pendingOffset = offset;
      setBlock(index);
    }

    function rendAt(t: number) {
      const blocs = c.cycle;
      if (!blocs.length) return;
      const { index } = blockAt(blocs, t);
      if (index !== c.dernierBloc) {
        const b = blocs[index]!;
        setState(b.state);
        if (index < c.dernierBloc)
          engine.reset(b.state, offsetOf(blocs, index));
        else engine.setState(b.state, offsetOf(blocs, index));
        c.dernierBloc = index;
      }
      setFrame(engine.sample(t));
    }

    useImperativeHandle(ref, () => ({ seek, rendAt }), [
      // stable API; closes over latest refs via `c` / engine
    ]);

    function onPointerMove(event: PointerEvent) {
      if (event.pointerType === 'touch') return;
      c.pointer = { x: event.clientX, y: event.clientY };
    }

    function onPointerLeave() {
      c.pointer = null;
    }

    function release() {
      if (!c.aiming) return;
      engine.setLook(null, c.clock, TURN_TIME);
      c.aiming = false;
    }

    function aim() {
      if (!STATE_BY_ID.get(c.state)?.baseFace) {
        release();
        return;
      }
      const box = svgRef.current?.getBoundingClientRect();
      if (!box || box.width === 0 || box.height === 0) return;
      if (!c.aiming) c.turnSince = c.clock;
      const demiLargeur = Math.max(1, window.innerWidth / 2);
      const demiHauteur = Math.max(1, window.innerHeight / 2);
      const pointer = c.pointer;
      engine.setLook(
        lookTarget({
          nx: pointer
            ? clamp(
                (pointer.x - (box.left + box.width / 2)) / demiLargeur,
                -1,
                1
              )
            : 0,
          ny: pointer
            ? clamp(
                (pointer.y - (box.top + box.height / 2)) / demiHauteur,
                -1,
                1
              )
            : 0,
          tour: easings.easeOutQuint(
            clamp((c.clock - c.turnSince) / TURN_TIME)
          ),
          pointer: pointer !== null,
        }),
        c.clock
      );
      c.aiming = true;
    }

    function scriptedGaze(run: GazeScript) {
      engine.setLook(run(c.clock - c.gazeSince), c.clock, SCRIPT_MORPH);
    }

    function redrawFrozen() {
      if (c.frozenAt === undefined) return;
      setFrame(engine.sample(c.frozenAt));
    }

    function detach() {
      window.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerleave', onPointerLeave);
    }

    // Gaze script attach / release
    useLayoutEffect(() => {
      if (gaze) {
        c.gazeSince = c.clock;
        c.scripted = true;
        engine.setLook(gaze(0), c.clock - SCRIPT_MORPH, SCRIPT_MORPH);
        return;
      }
      if (!c.scripted) return;
      engine.setLook(null, c.clock);
      c.scripted = false;
    }, [gaze]);

    // External block cursor
    useLayoutEffect(() => {
      const from = c.pendingOffset;
      c.pendingOffset = 0;
      apply(blockProp, from);
    }, [blockProp]);

    // External state (frozen tiles)
    useLayoutEffect(() => {
      if (engine.state === stateProp) return;
      engine.setState(stateProp, c.clock);
      c.state = stateProp;
      redrawFrozen();
    }, [stateProp]);

    // Playing toggle
    useLayoutEffect(() => {
      if (playingProp) apply(c.block, c.elapsed);
      else c.nextAt = Infinity;
    }, [playingProp]);

    // Cycle changed
    useLayoutEffect(() => {
      const blocks = cycle;
      if (!blocks.length) {
        c.nextAt = Infinity;
        return;
      }
      const i = Math.min(c.block, blocks.length - 1);
      if (i !== c.block) {
        goToBlock(i);
        return;
      }
      c.nextAt = c.playing ? c.blockStart + blocks[i]!.duration : Infinity;
    }, [cycle]);

    // Shape morph
    useLayoutEffect(() => {
      if (c.shapeRadii === shapeRadii) return;
      c.shapeRadii = shapeRadii;
      engine.setShape(shapeRadii, c.clock);
      redrawFrozen();
    }, [shapeRadii]);

    // Expression morph
    useLayoutEffect(() => {
      if (c.expression === expression) return;
      c.expression = expression;
      engine.setExpression(expression, c.clock);
      redrawFrozen();
    }, [expression]);

    // frozenAt scrubbing (export)
    useLayoutEffect(() => {
      redrawFrozen();
    }, [frozenAt]);

    // Pointer follow listeners
    useEffect(() => {
      const on = follow && frozenAt === undefined;
      if (on) {
        window.addEventListener('pointermove', onPointerMove);
        document.addEventListener('pointerleave', onPointerLeave);
        return () => {
          detach();
          release();
        };
      }
      detach();
      release();
      return undefined;
    }, [follow, frozenAt]);

    // Animation loop
    useEffect(() => {
      if (frozenAt !== undefined) {
        setFrame(engine.sample(frozenAt));
        return;
      }
      apply(c.block, c.elapsed);

      const tick = (ms: number) => {
        c.raf = requestAnimationFrame(tick);
        const dt = c.last ? Math.min((ms - c.last) / 1000, 0.064) : 0;
        c.last = ms;
        c.clock += dt;

        if (c.playing) {
          if (c.clock >= c.nextAt && c.cycle.length) {
            goToBlock((c.block + 1) % c.cycle.length);
          } else {
            setElapsed(c.clock - c.blockStart);
          }
        }

        if (c.follow) aim();
        else if (c.gaze) scriptedGaze(c.gaze);

        setFrame(engine.sample(c.clock));
      };
      c.raf = requestAnimationFrame(tick);
      return () => {
        cancelAnimationFrame(c.raf);
        detach();
      };
    }, [frozenAt === undefined]);

    const dots = frame.dots.map((dot, i) => (
      <DotEl key={i} dot={dot} ink={ink} paper={paper} />
    ));

    return (
      <svg
        ref={svgRef}
        width={size}
        height={size}
        viewBox={`${-VB} ${-VB} ${VB * 2} ${VB * 2}`}
        role="img"
        aria-label={ariaLabel}
        className={className}
        style={style}
      >
        <defs>
          <mask
            id={maskId}
            maskUnits="userSpaceOnUse"
            x={-VB}
            y={-VB}
            width={VB * 2}
            height={VB * 2}
          >
            <path d={frame.bodyPath} fill="#fff" />
            {frame.eyes.map((eye, i) => (
              <path
                key={i}
                d={eye.d}
                transform={eye.matrix}
                opacity={eye.alpha}
                fill="#000"
              />
            ))}
            {frame.notch ? (
              <circle
                cx={frame.notch.x}
                cy={frame.notch.y}
                r={frame.notch.r}
                fill="#000"
              />
            ) : null}
          </mask>

          {frame.arcs.map((arc) => (
            <linearGradient
              key={arc.id}
              id={`${uid}-${arc.id}`}
              gradientUnits="userSpaceOnUse"
              x1={arc.grad.x1}
              y1={arc.grad.y1}
              x2={arc.grad.x2}
              y2={arc.grad.y2}
            >
              {arc.grad.stops.map((stopColor, i) => (
                <stop
                  key={i}
                  offset={i / (arc.grad.stops.length - 1)}
                  stopColor={stopColor}
                />
              ))}
            </linearGradient>
          ))}
        </defs>

        <g fill="none" strokeLinecap="round">
          {frame.arcs.map((arc) => (
            <path
              key={`b${arc.id}`}
              d={arc.back}
              stroke={`url(#${uid}-${arc.id})`}
              strokeWidth={arc.width}
              opacity={arc.opacity}
            />
          ))}
        </g>

        {frame.dotsBehind ? <g>{dots}</g> : null}

        <g opacity={frame.bodyAlpha}>
          <path d={frame.bodyPath} fill={paper} />
          <g mask={`url(#${maskId})`}>
            <rect x={-VB} y={-VB} width={VB * 2} height={VB * 2} fill={ink} />
          </g>
        </g>

        {!frame.dotsBehind ? <g>{dots}</g> : null}

        {frame.notif ? (
          <circle
            cx={frame.notif.x}
            cy={frame.notif.y}
            r={frame.notif.r}
            fill={NOTIF_BLUE}
          />
        ) : null}

        <g fill="none" strokeLinecap="round">
          {frame.arcs.map((arc) => (
            <path
              key={`f${arc.id}`}
              d={arc.front}
              stroke={`url(#${uid}-${arc.id})`}
              strokeWidth={arc.width}
              opacity={arc.opacity}
            />
          ))}
        </g>
      </svg>
    );
  }
);

export default BloubBot;

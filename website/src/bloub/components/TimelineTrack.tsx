'use client';

import {
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type WheelEvent,
} from 'react';
import {
  type Block,
  BloubBot,
  clampDuration,
  offsetOf,
  POSES,
  type StateId,
  STEP,
  totalDuration,
} from 'bloub-react';
import { secondes, secondesCourtes, t } from '../i18n';
import { moveBlock } from '../ui/cycle-edit';
import { BASE_SCALE, clampZoom, ticksFor } from '../ui/timeline';
import { BlockPicker } from './BlockPicker';

/**
 * La piste : une regle graduee, les cartes du montage, et les gestes qui vont
 * avec (deplacer, etirer, promener la tete de lecture, zoomer). Elle ne connait
 * ni les cycles ni le lecteur — elle recoit une suite de blocs et rend celle
 * qu'on obtient apres le geste.
 */
export type TimelineTrackProps = {
  blocks: Block[];
  onBlocksChange: (blocks: Block[]) => void;
  /** temps ecoule dans le bloc courant, pour la tete de lecture */
  elapsed: number;
  shape: string;
  color: string;
  expression: string;
  block: number;
  onBlockChange: (block: number) => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  /** date visee sur la regle */
  onSeek: (seconds: number) => void;
  onAdd: (state: StateId) => void;
};

/**
 * Glisser-deposer : pendant le geste, le montage n'est PAS modifie. La carte
 * saisie suit le pointeur et les autres s'ecartent de sa largeur — c'est ce qui
 * donne la sensation de deplacer un objet. Le montage n'est recompose qu'au
 * lacher : reordonner en direct ferait sauter la carte d'un emplacement a
 * l'autre sous le doigt.
 */
type Drag = {
  from: number;
  to: number;
  startX: number;
  dx: number;
  moved: boolean;
};
type Resize = { index: number; startX: number; startDuration: number };

export function TimelineTrack({
  blocks,
  onBlocksChange,
  elapsed,
  shape,
  color,
  expression,
  block,
  onBlockChange,
  zoom,
  onZoomChange,
  onSeek,
  onAdd,
}: TimelineTrackProps) {
  /** Curseur de lecture et loupe : la barre les affiche, la piste les manipule. */
  const scale = BASE_SCALE * zoom;
  const total = totalDuration(blocks);
  const at = offsetOf(blocks, block) + elapsed;
  const ticks = ticksFor(total, scale);
  const exact = secondes(at);

  const trackRef = useRef<HTMLDivElement>(null);
  /** Debordement de la piste, pour n'afficher les degrades que s'ils servent. */
  const [overflow, setOverflow] = useState({ left: false, right: false });
  /**
   * Defilement de la piste. L'infobulle de temps ne peut pas vivre dedans — le
   * conteneur rogne ce qui depasse en hauteur, et elle flotte au-dessus de la
   * regle — donc elle se positionne dehors, et doit retrancher ce defilement.
   */
  const [scrolled, setScrolled] = useState(0);

  function width(index: number) {
    return blocks[index]!.duration * scale;
  }

  function label(index: number) {
    return t(`states.${blocks[index]!.state}`);
  }

  /* ------------------------------------------------------- defilement, loupe */

  function onScroll() {
    const el = trackRef.current;
    if (!el) return;
    setScrolled(el.scrollLeft);
    setOverflow({
      left: el.scrollLeft > 4,
      right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4,
    });
  }

  /**
   * Point d'ancrage du prochain changement d'echelle, en coordonnees d'ecran :
   * la seconde qui s'y trouve doit y rester. Sans ca, zoomer sur une carte
   * precise la fait fuir hors de l'ecran. `null` = le centre de ce qu'on voit,
   * c'est le bon compromis quand le zoom vient du curseur de la barre.
   */
  const anchorXRef = useRef<number | null>(null);
  const prevScaleRef = useRef(scale);

  function setZoom(next: number, clientX?: number) {
    anchorXRef.current = clientX ?? null;
    onZoomChange(clampZoom(next));
  }

  useLayoutEffect(() => {
    const before = prevScaleRef.current;
    const now = scale;
    prevScaleRef.current = now;
    if (before === now) return;
    const el = trackRef.current;
    if (!el) return;
    const x =
      (anchorXRef.current ??
        el.getBoundingClientRect().left + el.clientWidth / 2) -
      el.getBoundingClientRect().left;
    const seconde = (el.scrollLeft + x) / before;
    anchorXRef.current = null;
    el.scrollLeft = seconde * now - x;
    onScroll();
  }, [scale]);

  /**
   * Molette et trackpad sur la piste :
   * - pincement du trackpad (le navigateur l'annonce comme une molette + `ctrl`,
   *   c'est la convention) ou `ctrl`/`cmd` + molette → loupe ;
   * - deux doigts a l'horizontale → defilement, c'est deja `deltaX` ;
   * - molette de souris, qui n'a pas d'axe horizontal → on renvoie son `deltaY`
   *   sur le defilement de la piste, sinon elle ne servirait a rien ici.
   * `deltaMode` vaut 1 quand le systeme compte en lignes et pas en pixels (des
   * souris sous Firefox) : sans le facteur, le geste serait quinze fois trop lent.
   */
  function onWheel(e: WheelEvent) {
    const el = trackRef.current;
    if (!el) return;
    const unit = e.deltaMode === 1 ? 16 : 1;
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      setZoom(zoom * Math.exp((-e.deltaY * unit) / 180), e.clientX);
      return;
    }
    if (el.scrollWidth <= el.clientWidth) return;
    const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (!d) return;
    e.preventDefault();
    el.scrollLeft += d * unit;
  }

  useEffect(() => {
    onScroll();
  }, []);

  useEffect(() => {
    requestAnimationFrame(onScroll);
  }, [total, blocks]);

  // La carte courante reste visible quand la piste deborde de la fenetre.
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const x = offsetOf(blocks, block) * scale;
    const blockWidth = blocks[block]!.duration * scale;
    if (x < el.scrollLeft || x + blockWidth > el.scrollLeft + el.clientWidth) {
      el.scrollTo({ left: Math.max(0, x - 24), behavior: 'smooth' });
    }
  }, [block, blocks, scale]);

  /* --------------------------------------------------------------- montage */

  function removeBlock(index: number) {
    // la derniere carte ne part pas : un montage vide n'aurait rien a jouer
    if (blocks.length < 2) return;
    onBlocksChange(blocks.filter((_, i) => i !== index));
    // le curseur suit : une carte retiree avant lui le decale d'un cran, et il ne
    // doit jamais pointer au-dela de la piste
    if (index < block) onBlockChange(block - 1);
    else if (block >= blocks.length - 1) onBlockChange(blocks.length - 2);
  }

  function setDuration(index: number, wanted: number) {
    const b = blocks[index];
    if (!b) return;
    const duration = clampDuration(b.state, wanted);
    if (duration === b.duration) return;
    onBlocksChange(
      blocks.map((old, i) => (i === index ? { ...old, duration } : old))
    );
  }

  /* ------------------------------------------------------ glisser / etirer */

  const [drag, setDrag] = useState<Drag | null>(null);
  const [resize, setResize] = useState<Resize | null>(null);
  const [scrubbing, setScrubbing] = useState(false);
  const dragRef = useRef<Drag | null>(null);
  const resizeRef = useRef<Resize | null>(null);

  /** Decalage a appliquer a une carte pendant qu'on en deplace une autre. */
  function shiftOf(i: number) {
    const d = drag;
    if (!d?.moved) return 0;
    if (i === d.from) return d.dx;
    const w = width(d.from);
    if (d.to > d.from && i > d.from && i <= d.to) return -w;
    if (d.to < d.from && i >= d.to && i < d.from) return w;
    return 0;
  }

  /** Vrai pour la carte qu'on est en train de deplacer : elle se souleve. */
  function lifted(i: number) {
    return Boolean(drag?.moved) && i === drag?.from;
  }

  /** Index de la carte sous une position, en secondes depuis le debut de la piste. */
  function indexAt(t: number) {
    let acc = 0;
    for (let i = 0; i < blocks.length; i++) {
      acc += blocks[i]!.duration;
      if (t < acc) return i;
    }
    return blocks.length - 1;
  }

  function pointerSeconds(e: ReactPointerEvent | PointerEvent) {
    const box = trackRef.current?.getBoundingClientRect();
    if (!box) return 0;
    return (e.clientX - box.left + (trackRef.current?.scrollLeft ?? 0)) / scale;
  }

  function onBlockDown(index: number, e: ReactPointerEvent) {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const next = {
      from: index,
      to: index,
      startX: e.clientX,
      dx: 0,
      moved: false,
    };
    dragRef.current = next;
    setDrag(next);
  }

  function onBlockMove(e: ReactPointerEvent) {
    const d = dragRef.current;
    if (!d) return;
    // quelques pixels de tolerance : un clic tremble toujours un peu
    if (!d.moved && Math.abs(e.clientX - d.startX) <= 4) return;
    const next = {
      ...d,
      moved: true,
      dx: e.clientX - d.startX,
      to: Math.max(0, indexAt(pointerSeconds(e))),
    };
    dragRef.current = next;
    setDrag(next);
  }

  function onBlockUp(index: number) {
    const d = dragRef.current;
    dragRef.current = null;
    setDrag(null);
    if (!d) return;
    // un clic sans deplacement, c'est un saut de la tete de lecture
    if (!d.moved) {
      onBlockChange(index);
      return;
    }
    if (d.to === d.from) return;
    // le curseur suit la carte qu'on deplace, sinon la lecture sauterait ailleurs
    const suivi = block === d.from ? d.to : block;
    onBlocksChange(moveBlock(blocks, d.from, d.to));
    onBlockChange(suivi);
  }

  function onResizeDown(index: number, e: ReactPointerEvent) {
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const next = {
      index,
      startX: e.clientX,
      startDuration: blocks[index]!.duration,
    };
    resizeRef.current = next;
    setResize(next);
  }

  function onResizeMove(e: ReactPointerEvent) {
    const r = resizeRef.current;
    if (!r) return;
    setDuration(r.index, r.startDuration + (e.clientX - r.startX) / scale);
  }

  /** Le clavier etire aussi : la poignee est un bouton, pas seulement une zone. */
  function onResizeKey(index: number, delta: number) {
    setDuration(index, blocks[index]!.duration + delta);
  }

  /* -------------------------------------------------------------- au clavier */

  /**
   * Reordonner et pointer AU CLAVIER.
   *
   * Le glisser-deposer n'avait aucun equivalent : on pouvait ajouter, supprimer et etirer un
   * bloc — la poignee gere deja les fleches — mais jamais le REORDONNER, et le pointage
   * precis n'existait qu'au pointeur, sur la regle. C'etait le seul geste de l'editeur
   * inaccessible.
   *
   * `Alt` + fleches deplace la carte, les fleches nues promenent la tete de lecture de `STEP`.
   * Alt et pas les fleches nues pour le deplacement : une carte est un bouton dans une liste,
   * et les fleches y servent d'abord a se deplacer.
   *
   * Le focus SUIT la carte deplacee, sinon on se retrouve a en pousser une autre au coup
   * suivant. Il faut attendre le rendu : la liste est recomposee, donc le bouton d'arrivee
   * n'existe pas encore.
   *
   * La carte porte `aria-keyshortcuts` : un raccourci que rien n'annonce n'est pas une
   * affordance. C'est l'attribut fait pour ca, et il evite d'allonger l'etiquette, qui est
   * relue a chaque carte de la piste.
   */
  function onCardKey(index: number, e: KeyboardEvent) {
    const sens = e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowRight' ? 1 : 0;
    if (!sens) return;
    e.preventDefault();

    if (!e.altKey) {
      // pointage : la tete de lecture avance d'un pas, dans tout le montage
      onSeek(Math.max(0, Math.min(total - 0.001, at + sens * STEP)));
      return;
    }

    const cible = index + sens;
    if (cible < 0 || cible >= blocks.length) return;
    onBlocksChange(moveBlock(blocks, index, cible));
    onBlockChange(cible);
    requestAnimationFrame(() => {
      const liste =
        trackRef.current?.querySelectorAll<HTMLButtonElement>('[data-carte]');
      liste?.[cible]?.focus();
    });
  }

  /* ----------------------------------------------------------------- scrub */

  function scrubTo(e: ReactPointerEvent) {
    onSeek(Math.max(0, Math.min(total - 0.001, pointerSeconds(e))));
  }

  function onRulerDown(e: ReactPointerEvent) {
    // sans ca, promener la tete de lecture surligne les graduations au passage :
    // le navigateur demarre une selection de texte sur le `mousedown` induit
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setScrubbing(true);
    scrubTo(e);
  }

  function onRulerMove(e: ReactPointerEvent) {
    if (scrubbing) scrubTo(e);
  }

  // silence unused resize state (tracked for potential UI; logic uses resizeRef)
  void resize;

  return (
    <div className="relative flex-1">
      <div
        ref={trackRef}
        className="h-full overflow-x-auto overflow-y-hidden [scrollbar-width:none]"
        onScroll={onScroll}
        onWheel={onWheel}
      >
        {/* la piste garde de la place pour la carte « + » a sa suite */}
        <div
          className="relative flex h-full flex-col"
          style={{ width: `${total * scale + 76}px` }}
        >
          {/*
            Regle graduee : elle sert aussi de zone de deplacement. On attrape
            n'importe ou dessus pour promener la tete de lecture, comme sur un
            montage video — c'est la seule facon d'atteindre un point PRECIS
            d'une carte, le clic sur une carte ne fait que sauter a son debut.
          */}
          <div
            className="relative h-7 shrink-0 cursor-ew-resize pt-1 select-none"
            onPointerDown={onRulerDown}
            onPointerMove={onRulerMove}
            onPointerUp={() => setScrubbing(false)}
            onPointerCancel={() => setScrubbing(false)}
          >
            {ticks.map((tick) => (
              <span
                key={tick.t}
                className="absolute bottom-1.5 flex items-end gap-1"
                style={{ transform: `translateX(${tick.t * scale}px)` }}
              >
                <span
                  className={`block w-px bg-[var(--line)] ${tick.major ? 'h-3' : 'h-1.5'}`}
                />
                {tick.major && (
                  <span className="-mb-0.5 text-xs leading-none text-[var(--muted)]">
                    {secondesCourtes(tick.t, Number.isInteger(tick.t) ? 0 : 1)}
                  </span>
                )}
              </span>
            ))}
          </div>

          <ul className="flex flex-1 items-stretch">
            {/*
              La largeur du <li> vaut exactement la duree de la carte : la
              gouttiere est un padding interne, sinon les cartes decaleraient la
              piste et la tete de lecture ne tomberait plus en face.
            */}
            {blocks.map((b, i) => (
              <li
                // Block has no stable id; position in the montage is the identity.
                // eslint-disable-next-line @eslint-react/no-array-index-key -- montage order is the key
                key={`${i}-${b.state}-${b.duration}`}
                className={`group relative shrink-0 pr-1 ${
                  lifted(i)
                    ? 'z-20'
                    : 'transition-transform duration-150 ease-out'
                }`}
                style={{
                  width: `${b.duration * scale}px`,
                  transform: shiftOf(i)
                    ? `translateX(${shiftOf(i)}px)`
                    : undefined,
                }}
              >
                <button
                  type="button"
                  className={`flex h-full w-full cursor-grab flex-col justify-between overflow-hidden rounded-lg px-1.5 py-1 text-left transition select-none active:cursor-grabbing ${
                    i === block
                      ? 'bg-white ring-2 ring-[var(--ink)] ring-inset'
                      : 'bg-black/[0.045] hover:bg-black/[0.08]'
                  } ${lifted(i) ? 'scale-[1.02] opacity-75 shadow-lg' : ''}`}
                  aria-label={t('timeline.blockAria', {
                    state: label(i),
                    duration: secondes(b.duration),
                  })}
                  aria-current={i === block ? 'true' : undefined}
                  onPointerDown={(e) => onBlockDown(i, e)}
                  onPointerMove={onBlockMove}
                  onPointerUp={() => onBlockUp(i)}
                  onPointerCancel={() => {
                    dragRef.current = null;
                    setDrag(null);
                  }}
                  data-carte
                  aria-keyshortcuts="Alt+ArrowLeft Alt+ArrowRight ArrowLeft ArrowRight"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onBlockChange(i);
                    } else if (
                      e.key === 'ArrowLeft' ||
                      e.key === 'ArrowRight'
                    ) {
                      onCardKey(i, e);
                    }
                  }}
                >
                  {/* la miniature EST l'identite de la carte, comme la vignette
                       d'une page : le nom n'apprendrait rien de plus, il ne reste
                       que dans l'etiquette du bouton, pour le lecteur d'ecran */}
                  <span className="flex min-w-0 flex-1 items-center justify-center">
                    {width(i) > 44 && (
                      <BloubBot
                        className="shrink-0"
                        state={b.state}
                        size={Math.min(56, Math.max(30, width(i) * 0.5))}
                        shape={shape}
                        color={color}
                        expression={expression}
                        paper={i === block ? '#ffffff' : '#f2f2f2'}
                        frozenAt={POSES[b.state]}
                      />
                    )}
                  </span>
                  {width(i) > 50 && (
                    <span
                      className={`tronque text-center text-xs leading-none font-semibold tabular-nums ${
                        i === block
                          ? 'text-[var(--ink)]'
                          : 'text-[var(--muted)]'
                      }`}
                    >
                      {secondes(b.duration)}
                    </span>
                  )}
                </button>

                {/* poignee de duree : bouton a part entiere, donc utilisable au clavier */}
                <button
                  type="button"
                  className="absolute inset-y-2 right-0.5 w-1 cursor-ew-resize rounded-full bg-[var(--muted)] opacity-0 transition group-hover:opacity-60 hover:opacity-100! focus-visible:opacity-100"
                  aria-label={t('timeline.blockDurationAria', {
                    state: label(i),
                    duration: secondes(b.duration),
                  })}
                  onPointerDown={(e) => onResizeDown(i, e)}
                  onPointerMove={onResizeMove}
                  onPointerUp={() => {
                    resizeRef.current = null;
                    setResize(null);
                  }}
                  onPointerCancel={() => {
                    resizeRef.current = null;
                    setResize(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowLeft') {
                      e.preventDefault();
                      onResizeKey(i, -STEP);
                    } else if (e.key === 'ArrowRight') {
                      e.preventDefault();
                      onResizeKey(i, STEP);
                    }
                  }}
                />
                {blocks.length > 1 && (
                  <button
                    type="button"
                    className="absolute top-1 right-2 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full bg-black/10 text-[var(--ink)] opacity-0 transition group-hover:opacity-100 hover:bg-black/20 focus-visible:opacity-100"
                    aria-label={t('timeline.blockRemoveAria', {
                      state: label(i),
                    })}
                    onClick={() => removeBlock(i)}
                  >
                    {/* croix dessinee : le glyphe « × » de la police ne tombe pas au
                         centre optique de la pastille */}
                    <svg
                      width="9"
                      height="9"
                      viewBox="0 0 10 10"
                      aria-hidden="true"
                    >
                      <path
                        d="M2.6 2.6 7.4 7.4M7.4 2.6 2.6 7.4"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                )}
              </li>
            ))}

            <li className="w-[72px] shrink-0 pl-1">
              <BlockPicker
                shape={shape}
                color={color}
                expression={expression}
                onPick={onAdd}
              />
            </li>
          </ul>

          {/*
            Tete de lecture : seule sa transformation change d'une image a l'autre,
            et elle vit dans la piste, donc elle defile avec elle. Sa poignee est
            dans la regle, la ou on l'attrape.
          */}
          <div
            className="pointer-events-none absolute inset-y-0 left-0 w-0.5 rounded-full bg-[var(--ink)]"
            style={{ transform: `translateX(${at * scale}px)` }}
          >
            <span className="absolute -top-0.5 -left-[5px] h-3 w-3 rounded-full border-2 border-[var(--paper)] bg-[var(--ink)]" />
          </div>
        </div>
      </div>

      {/*
        Temps exact pendant le deplacement : au dixieme, la ou le compteur de la
        barre arrondit a la seconde. Il flotte au-dessus de la regle, donc hors du
        conteneur qui defile — d'ou le `scrolled` retranche.
      */}
      {scrubbing && (
        <div
          className="pointer-events-none absolute top-0 left-0 z-10"
          style={{ transform: `translate(${at * scale - scrolled}px, -70%)` }}
        >
          <span className="block -translate-x-1/2 rounded-md bg-[var(--ink)] px-2 py-1 text-xs text-[var(--paper)] tabular-nums shadow-sm">
            {exact}
          </span>
        </div>
      )}

      {/* degrades de debordement : la piste continue par la */}
      {overflow.left && (
        <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-[var(--paper)] to-transparent" />
      )}
      {overflow.right && (
        <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-[var(--paper)] to-transparent" />
      )}
    </div>
  );
}

export default TimelineTrack;

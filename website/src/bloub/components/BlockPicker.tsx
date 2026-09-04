'use client';

import { type CSSProperties, useRef, useState } from 'react';
import { POSES, SEQUENCE, STATE_BY_ID, type StateId } from 'bloub-react';
import { t } from '../i18n';
import { BotTile } from './BotTile';

/**
 * Carte « + » de la piste et sa palette. Ajouter depuis la piste evite d'aller
 * jusqu'au panneau de droite quand on monte.
 */
export type BlockPickerProps = {
  shape: string;
  color: string;
  expression: string;
  onPick: (state: StateId) => void;
};

/** Les animations dans l'ordre de la video. */
const PALETTE = SEQUENCE.map((id) => STATE_BY_ID.get(id)!);

/** Largeur de la palette, en pixels — elle sert aussi a la caler. */
const WIDTH = 288;

export function BlockPicker({
  shape,
  color,
  expression,
  onPick,
}: BlockPickerProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<CSSProperties>({});

  /**
   * La palette est-elle ouverte ? Pour `aria-expanded`, que le declencheur doit porter comme
   * ceux de la barre d'export et du menu de cycles.
   *
   * Suivi par l'evenement `toggle` du popover et non par notre propre `toggle()` : la
   * fermeture LEGERE — clic a cote, Echap — est faite par le navigateur, donc un drapeau que
   * nous tiendrions nous-memes resterait bloque sur « ouvert ».
   */
  const [ouvert, setOuvert] = useState(false);

  /**
   * Ouvre la palette au-dessus du « + ». Elle vit dans la couche superieure du
   * navigateur, donc sa position se calcule ici, en coordonnees d'ecran, et se
   * borne pour ne pas sortir par la droite quand le bouton est en bout de piste.
   */
  function toggle() {
    const bouton = triggerRef.current;
    const boite = panelRef.current;
    if (!bouton || !boite) return;
    // au clavier, `Entree` ne declenche pas la fermeture legere (qui ecoute le
    // pointeur) : sans ce garde on rouvrirait une palette deja ouverte, et
    // `showPopover` leve une exception dans ce cas
    if (boite.matches(':popover-open')) {
      boite.hidePopover();
      return;
    }
    const r = bouton.getBoundingClientRect();
    setPosition({
      position: 'fixed',
      // les styles par defaut d'un popover posent `inset: 0` : sans remettre le
      // haut et la droite a `auto`, le calage est sur-contraint et c'est `top: 0`
      // qui gagne — la palette se colle en haut de l'ecran
      top: 'auto',
      right: 'auto',
      left: `${Math.max(8, Math.min(r.right - WIDTH, window.innerWidth - WIDTH - 8))}px`,
      bottom: `${window.innerHeight - r.top + 8}px`,
    });
    boite.showPopover();
  }

  function pick(state: StateId) {
    onPick(state);
    panelRef.current?.hidePopover();
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="flex h-full w-full cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-[var(--line)] text-lg leading-none text-[var(--muted)] transition hover:border-[var(--muted)] hover:text-[var(--ink)]"
        aria-label={t('timeline.addAnimation')}
        aria-haspopup="true"
        aria-expanded={ouvert}
        onClick={toggle}
      >
        +
      </button>

      {/*
        `popover` promeut la palette dans la couche superieure du navigateur : c'est
        ce qui la fait echapper au conteneur de la piste, qui rogne verticalement —
        elle y etait coupee en deux. En prime, le clic a cote et Echap la referment
        sans code a nous. `m-0` : un popover est centre par une marge auto, comme
        une modale.
      */}
      <div
        ref={panelRef}
        popover="auto"
        onToggle={(e) => {
          const te = e.nativeEvent as ToggleEvent;
          setOuvert(te.newState === 'open');
        }}
        className="m-0 w-72 rounded-xl bg-white p-2 shadow-lg ring-1 ring-black/5"
        style={position}
      >
        <div className="grid grid-cols-4 gap-1.5">
          {PALETTE.map((s) => (
            <BotTile
              key={s.id}
              label={t(`states.${s.id}`)}
              selected={false}
              state={s.id}
              shape={shape}
              color={color}
              expression={expression}
              frozenAt={POSES[s.id]}
              onClick={() => pick(s.id)}
            />
          ))}
        </div>
      </div>
    </>
  );
}

export default BlockPicker;

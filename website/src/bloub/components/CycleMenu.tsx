'use client';

import { useEffect, useRef, useState } from 'react';
import type { Cycle } from 'bloub-react';
import { nomDeCycle, t } from '../i18n';

/**
 * Choix du montage. Un `<select>` natif ne peut pas porter la ligne "Nouveau"
 * ni la suppression d'une entree, d'ou ce menu — et il s'ouvre vers le haut,
 * la barre etant en bas de l'ecran.
 */
export type CycleMenuProps = {
  cycles: Cycle[];
  current: Cycle;
  activeId: string;
  onActiveIdChange: (id: string) => void;
  onCreate: () => void;
  onRemove: (id: string) => void;
  onRename: (id: string) => void;
};

export function CycleMenu({
  cycles,
  current,
  activeId,
  onActiveIdChange,
  onCreate,
  onRemove,
  onRename,
}: CycleMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  function choose(id: string) {
    onActiveIdChange(id);
    setOpen(false);
  }

  function create() {
    setOpen(false);
    onCreate();
  }

  useEffect(() => {
    if (!open) return;
    function onOutside(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    window.addEventListener('pointerdown', onOutside);
    return () => window.removeEventListener('pointerdown', onOutside);
  }, [open]);

  return (
    /*
      `text-left` sur le declencheur : les navigateurs centrent le texte des
      boutons. Ca ne se voyait pas avec l'ancienne troncature, qui remplissait
      toute la boite ; la troncature au mot laisse une ligne plus courte, et le
      nom se retrouvait au milieu.
    */
    <div
      ref={rootRef}
      className="relative"
      onKeyDown={(e) => {
        if (e.key === 'Escape') setOpen(false);
      }}
    >
      <button
        type="button"
        className="flex max-w-56 cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1 text-left text-sm font-medium transition hover:bg-black/5"
        aria-haspopup="true"
        aria-expanded={open}
        title={nomDeCycle(current)}
        onClick={() => setOpen(!open)}
      >
        <span className="tronque">{nomDeCycle(current)}</span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          aria-hidden="true"
          className="shrink-0 text-[var(--muted)]"
        >
          <path
            d="M2 3.5 5 6.5l3-3"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute bottom-full left-0 z-10 mb-2 w-56 rounded-xl bg-white p-1 shadow-lg ring-1 ring-black/5">
          {cycles.map((c) => (
            <div key={c.id} className="group/row flex items-center gap-1">
              {/* `min-w-0` sur le bouton : sans lui, un nom long pousse la ligne au
                   lieu d'etre coupe, et deborde du menu avec ses deux actions */}
              <button
                type="button"
                className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs transition hover:bg-black/5"
                title={nomDeCycle(c)}
                onClick={() => choose(c.id)}
              >
                <span className="w-3 shrink-0 text-[var(--ink)]">
                  {c.id === activeId ? '✓' : ''}
                </span>
                <span className="tronque">{nomDeCycle(c)}</span>
              </button>
              {/* renommer et supprimer vivent ici : la barre n'a pas a porter deux
                   boutons de plus pour une action qu'on fait une fois */}
              <button
                type="button"
                className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-md text-[var(--muted)] opacity-0 transition group-hover/row:opacity-100 hover:bg-black/5 hover:text-[var(--ink)] focus-visible:opacity-100"
                aria-label={t('cycles.menuRenameAria', { name: nomDeCycle(c) })}
                onClick={() => {
                  setOpen(false);
                  onRename(c.id);
                }}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  aria-hidden="true"
                >
                  <path
                    d="M8.2 1.8 10.2 3.8 4.4 9.6 1.8 10.2 2.4 7.6z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.1"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              {/* le dernier montage ne se supprime pas : il n'y aurait plus rien a jouer */}
              {cycles.length > 1 && (
                <button
                  type="button"
                  className="mr-1 flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-md text-[var(--muted)] opacity-0 transition group-hover/row:opacity-100 hover:bg-black/5 hover:text-[var(--danger)] focus-visible:opacity-100"
                  aria-label={t('cycles.menuRemoveAria', {
                    name: nomDeCycle(c),
                  })}
                  onClick={() => {
                    setOpen(false);
                    onRemove(c.id);
                  }}
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 14 14"
                    aria-hidden="true"
                  >
                    <path
                      d="M2.8 3.9h8.4M5.5 3.9V2.7h3v1.2M4.1 3.9l.5 7.4h4.8l.5-7.4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.1"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              )}
            </div>
          ))}

          <div className="my-1 h-px bg-[var(--line)]" />

          <button
            type="button"
            className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs transition hover:bg-black/5"
            onClick={create}
          >
            <span className="w-3 shrink-0 text-[var(--muted)]">+</span>
            {t('cycles.menuNew')}
          </button>
        </div>
      )}
    </div>
  );
}

export default CycleMenu;

'use client';

import { type SyntheticEvent, useRef } from 'react';
import { t } from '../i18n';
import { type FondGif, FONDS_GIF } from '../ui/export';
import { useModalDialog } from '../ui/useModalDialog';

/**
 * Choix du fond avant de telecharger le GIF.
 *
 * Ce format est le seul a poser la question : sa transparence n'a qu'un bit, donc
 * son bord transparent est dur et se voit. Le fond plein le lisse, en echange
 * d'une couleur cuite dans l'image — aucun des deux ne gagne dans tous les cas,
 * d'ou le choix laisse a l'utilisateur.
 *
 * De vrais `<input type="radio">` et non des boutons : le navigateur donne le
 * groupe, la navigation aux fleches et l'annonce « 1 sur 2 » au lecteur d'ecran.
 * Le comportement modal vient de `useModalDialog`, l'animation de `styles.css`.
 */
export type GifDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fond: FondGif;
  onFondChange: (fond: FondGif) => void;
  onConfirm: () => void;
};

export function GifDialog({
  open,
  onOpenChange,
  fond,
  onFondChange,
  onConfirm,
}: GifDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useModalDialog(open, dialogRef);

  function confirm(e: SyntheticEvent) {
    e.preventDefault();
    onConfirm();
    onOpenChange(false);
  }

  return (
    <dialog
      ref={dialogRef}
      className="dialogue m-auto w-80 rounded-2xl bg-white p-5 text-[var(--ink)] shadow-xl"
      aria-label={t('export.gifTitle')}
      onClose={() => onOpenChange(false)}
      onCancel={(e) => {
        e.preventDefault();
        onOpenChange(false);
      }}
    >
      <form className="flex flex-col gap-4" onSubmit={confirm}>
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-semibold">{t('export.gifTitle')}</h2>
          <p className="text-xs text-[var(--muted)]">{t('export.gifDetail')}</p>
        </div>

        <fieldset className="flex flex-col gap-1">
          <legend className="sr-only">{t('export.gifBackground')}</legend>
          {FONDS_GIF.map((choix, i) => (
            <label
              key={choix}
              className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition hover:bg-black/5"
            >
              <input
                type="radio"
                name="fond"
                value={choix}
                checked={fond === choix}
                autoFocus={i === 0}
                className="accent-[var(--ink)]"
                onChange={() => onFondChange(choix)}
              />
              <span className="flex flex-col">
                {t(`export.fond_${choix}`)}
                <span className="text-xs text-[var(--muted)]">
                  {t(`export.fond_${choix}_aide`)}
                </span>
              </span>
            </label>
          ))}
        </fieldset>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            className="h-8 cursor-pointer rounded-lg px-3 text-xs text-[var(--muted)] transition hover:bg-black/5 hover:text-[var(--ink)]"
            onClick={() => onOpenChange(false)}
          >
            {t('dialog.cancel')}
          </button>
          <button
            type="submit"
            className="h-8 cursor-pointer rounded-lg bg-[var(--ink)] px-3 text-xs text-[var(--paper)] transition hover:opacity-90 active:scale-95"
          >
            {t('export.gifConfirm')}
          </button>
        </div>
      </form>
    </dialog>
  );
}

export default GifDialog;

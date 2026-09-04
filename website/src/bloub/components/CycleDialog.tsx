'use client';

import { type SyntheticEvent, useEffect, useMemo, useRef } from 'react';
import { t } from '../i18n';
import {
  cycleAccepteTransparence,
  type FondGif,
  FONDS_GIF,
  type FormatCycle,
  FORMATS_CYCLE,
  videoPossible,
} from '../ui/export';
import { useModalDialog } from '../ui/useModalDialog';

/**
 * Choix du format avant d'exporter le montage.
 *
 * Le groupe « fond » n'apparait QUE pour le GIF, au lieu d'etre affiche grise :
 * la video n'a pas de canal alpha du tout, donc il n'y a pas de choix a refuser,
 * il n'y a pas de choix.
 */
export type CycleDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  format: FormatCycle;
  onFormatChange: (format: FormatCycle) => void;
  fond: FondGif;
  onFondChange: (fond: FondGif) => void;
  avancement: number | null;
  /** true = le dernier essai a echoue. La boite le dit et propose de reessayer. */
  erreur: boolean;
  onConfirm: () => void;
  onAnnuler: () => void;
};

export function CycleDialog({
  open,
  onOpenChange,
  format,
  onFormatChange,
  fond,
  onFondChange,
  avancement,
  erreur,
  onConfirm,
  onAnnuler,
}: CycleDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useModalDialog(open, dialogRef);

  /**
   * La video n'est proposee que la ou le navigateur sait encoder — meme regle que
   * la copie d'image dans la barre d'export. Sans ce filtre, choisir MP4 sur un
   * navigateur sans `VideoEncoder` echouait sur l'erreur generique.
   *
   * Le garde vient de `export.ts` et SURTOUT PAS de `video.ts` : l'importer d'ici
   * suffirait a ramener mediabunny dans le chunk d'entree (voir `videoPossible`).
   */
  const formats = useMemo(
    () => FORMATS_CYCLE.filter((f) => f !== 'mp4' || videoPossible()),
    []
  );

  /*
   * Le modele est corrige, pas seulement la liste. Le defaut est `mp4`, donc sur un
   * navigateur sans `VideoEncoder` la boite n'affichait qu'une radio « GIF » et elle etait
   * DECOCHEE : l'option etait cachee mais la valeur, elle, gagnait, et l'export partait
   * quand meme sur l'encodeur video pour echouer aussitot. Cacher un choix ne suffit pas, il
   * faut aussi ne plus le porter.
   */
  useEffect(() => {
    if (!formats.includes(format)) onFormatChange(formats[0]!);
  }, [format, formats, onFormatChange]);

  const occupe = avancement !== null;
  const pourcent = Math.round((avancement ?? 0) * 100);

  function confirm(e: SyntheticEvent) {
    e.preventDefault();
    // La boite reste ouverte pendant l'encodage : c'est elle qui porte la
    // progression, et un cycle de trente secondes ne s'exporte pas instantanement.
    if (!occupe) onConfirm();
  }

  /**
   * Fermer, c'est ABANDONNER quand l'encodage tourne.
   *
   * Sans ca, Echap ou le bouton refermaient la boite pendant que l'export continuait
   * jusqu'au bout et declenchait le telechargement d'un fichier que plus personne
   * n'attendait.
   */
  function ferme() {
    if (occupe) onAnnuler();
    onOpenChange(false);
  }

  return (
    <dialog
      ref={dialogRef}
      className="dialogue m-auto w-80 rounded-2xl bg-white p-5 text-[var(--ink)] shadow-xl"
      aria-label={t('timeline.export')}
      onClose={() => onOpenChange(false)}
      onCancel={(e) => {
        e.preventDefault();
        ferme();
      }}
    >
      <form className="flex flex-col gap-4" onSubmit={confirm}>
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-semibold">{t('timeline.export')}</h2>
          <p className="text-xs text-[var(--muted)]">
            {t('export.cycleDetail')}
          </p>
        </div>

        <fieldset className="flex flex-col gap-1" disabled={occupe}>
          <legend className="sr-only">{t('export.cycleFormat')}</legend>
          {formats.map((choix, i) => (
            <label
              key={choix}
              className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition hover:bg-black/5"
            >
              <input
                type="radio"
                name="format"
                value={choix}
                checked={format === choix}
                autoFocus={i === 0}
                className="accent-[var(--ink)]"
                onChange={() => onFormatChange(choix)}
              />
              <span className="flex flex-col">
                {t(`export.cycle_${choix}`)}
                <span className="text-xs text-[var(--muted)]">
                  {t(`export.cycle_${choix}_aide`)}
                </span>
              </span>
            </label>
          ))}
        </fieldset>

        {/* seul le GIF a un alpha a offrir : cf. la doc du composant */}
        {cycleAccepteTransparence(format) && (
          <fieldset className="flex flex-col gap-1" disabled={occupe}>
            <legend className="sr-only">{t('export.gifBackground')}</legend>
            {FONDS_GIF.map((choix) => (
              <label
                key={choix}
                className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition hover:bg-black/5"
              >
                <input
                  type="radio"
                  name="fondCycle"
                  value={choix}
                  checked={fond === choix}
                  className="accent-[var(--ink)]"
                  onChange={() => onFondChange(choix)}
                />
                {t(`export.fond_${choix}`)}
              </label>
            ))}
          </fieldset>
        )}

        {/* la progression remplace les boutons : rien d'autre a faire qu'attendre */}
        {/* l'echec s'affiche ICI et pas dans la barre d'export : celle-la n'est rendue
             que dans la vue Personnaliser, alors que cette boite vit dans les Animations,
             donc le message partait dans un composant absent de l'ecran */}
        {erreur && !occupe && (
          <p className="text-xs text-[var(--danger)]" role="alert">
            {t('export.failed')}
          </p>
        )}

        {occupe ? (
          <div className="flex flex-col gap-1.5">
            {/*
              Pas de `transition` sur la largeur : une transition sur `width` passe par
              le layout, donc par le thread principal — que l'encodage sature. La barre
              restait figee sur sa premiere valeur pendant que le pourcentage, lui,
              avancait. Et elle n'apporte rien : la valeur change des centaines de fois.
            */}
            <div className="h-1.5 overflow-hidden rounded-full bg-black/10">
              <div
                className="h-full rounded-full bg-[var(--ink)]"
                style={{ width: `${pourcent}%` }}
              />
            </div>
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-[var(--muted)] tabular-nums">
                {t('export.cycleProgress')} {pourcent} %
              </p>
              <button
                type="button"
                className="h-7 cursor-pointer rounded-lg px-2 text-xs text-[var(--muted)] transition hover:bg-black/5 hover:text-[var(--ink)]"
                onClick={ferme}
              >
                {t('dialog.cancel')}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="h-8 cursor-pointer rounded-lg px-3 text-xs text-[var(--muted)] transition hover:bg-black/5 hover:text-[var(--ink)]"
              onClick={ferme}
            >
              {t('dialog.cancel')}
            </button>
            <button
              type="submit"
              className="h-8 cursor-pointer rounded-lg bg-[var(--ink)] px-3 text-xs text-[var(--paper)] transition hover:opacity-90 active:scale-95"
            >
              {erreur ? t('export.cycleReessayer') : t('export.gifConfirm')}
            </button>
          </div>
        )}
      </form>
    </dialog>
  );
}

export default CycleDialog;

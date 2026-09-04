'use client';

import { type SyntheticEvent, useEffect, useRef, useState } from 'react';
import { t } from '../i18n';
import { useModalDialog } from '../ui/useModalDialog';

/**
 * Boite de dialogue de nommage. Le comportement modal vient de
 * `useModalDialog` ; l'animation, elle, est dans `styles.css` : elle a besoin
 * de `@starting-style`, hors de portee des classes.
 */
export type NameDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string;
  onValueChange: (value: string) => void;
  title: string;
  label: string;
  submitLabel: string;
  onSubmit: (name: string) => void;
};

export function NameDialog({
  open,
  onOpenChange,
  value,
  onValueChange: _onValueChange,
  title,
  label,
  submitLabel,
  onSubmit,
}: NameDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useModalDialog(open, dialogRef);
  const fieldRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState('');

  // le nom propose arrive avec l'ouverture, et le champ s'offre deja selectionne
  useEffect(() => {
    if (!open) return;
    setDraft(value);
    const id = requestAnimationFrame(() => fieldRef.current?.select());
    return () => cancelAnimationFrame(id);
  }, [open, value]);

  function submit(e: SyntheticEvent) {
    e.preventDefault();
    const clean = draft.trim();
    // un nom vide ne veut rien dire : on garde la main plutot que de valider
    if (!clean) {
      fieldRef.current?.focus();
      return;
    }
    onSubmit(clean);
    onOpenChange(false);
  }

  return (
    // `m-auto` remet le centrage natif de la modale : le reset de Tailwind
    // passe `margin: 0` sur tout, et c'est cette marge auto qui centre
    <dialog
      ref={dialogRef}
      className="dialogue m-auto w-80 rounded-2xl bg-white p-5 text-[var(--ink)] shadow-xl"
      aria-label={title}
      onClose={() => onOpenChange(false)}
      onCancel={(e) => {
        e.preventDefault();
        onOpenChange(false);
      }}
    >
      <form className="flex flex-col gap-4" onSubmit={submit}>
        <h2 className="text-sm font-semibold">{title}</h2>

        <label className="flex flex-col gap-1.5 text-xs text-[var(--muted)]">
          {label}
          <input
            ref={fieldRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="h-9 rounded-lg bg-black/5 px-2.5 text-sm text-[var(--ink)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--ink)]"
            type="text"
            maxLength={40}
            required
          />
        </label>

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
            {submitLabel}
          </button>
        </div>
      </form>
    </dialog>
  );
}

export default NameDialog;

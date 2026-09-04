'use client';

import { useRef } from 'react';
import { t } from '../i18n';
import { useModalDialog } from '../ui/useModalDialog';

/**
 * Confirmation d'une action destructrice. Le focus s'ouvre sur « Annuler » :
 * sur une suppression, la touche Entree ne doit pas detruire. L'animation vient
 * de `styles.css`, le reste du comportement modal de `useModalDialog`.
 */
export type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  detail: string;
  confirmLabel: string;
  onConfirm: () => void;
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  detail,
  confirmLabel,
  onConfirm,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useModalDialog(open, dialogRef);

  function confirm() {
    onConfirm();
    onOpenChange(false);
  }

  return (
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
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-semibold">{title}</h2>
          <p className="text-xs text-[var(--muted)]">{detail}</p>
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            autoFocus
            className="h-8 cursor-pointer rounded-lg px-3 text-xs text-[var(--muted)] transition hover:bg-black/5 hover:text-[var(--ink)]"
            onClick={() => onOpenChange(false)}
          >
            {t('dialog.cancel')}
          </button>
          <button
            type="button"
            className="h-8 cursor-pointer rounded-lg bg-[var(--danger)] px-3 text-xs text-white transition hover:opacity-90 active:scale-95"
            onClick={confirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}

export default ConfirmDialog;

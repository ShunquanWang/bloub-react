'use client';

import { type RefObject, useEffect } from 'react';

/**
 * Pilote un `<dialog>` natif ouvert en modal depuis un booleen.
 *
 * On passe par l'element natif plutot que par une div : le navigateur fournit
 * alors le piege a focus, la fermeture par Echap, le retour du focus au
 * declencheur, l'inertie du reste de la page et le fond assombri.
 */
export function useModalDialog(
  open: boolean,
  el: RefObject<HTMLDialogElement | null>
) {
  useEffect(() => {
    const dialog = el.current;
    if (!dialog) return;
    if (open) dialog.showModal();
    else if (dialog.open) dialog.close();
  }, [open, el]);

  useEffect(() => {
    return () => {
      if (el.current?.open) el.current.close();
    };
  }, [el]);
}

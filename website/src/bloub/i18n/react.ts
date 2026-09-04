'use client';

import { useEffect, useSyncExternalStore } from 'react';
import {
  bootLangue,
  getLangue,
  getServerLangue,
  type Langue,
  setLangue,
  subscribeLangue,
} from './index';

/** Hook : re-rend quand la langue change. */
export function useLangue(): [Langue, (v: Langue) => void] {
  const langue = useSyncExternalStore(
    subscribeLangue,
    getLangue,
    getServerLangue
  );

  // Apres hydratation seulement : sinon SSR (fr) et client (navigateur) divergent.
  useEffect(() => {
    bootLangue();
  }, []);

  return [langue, setLangue];
}

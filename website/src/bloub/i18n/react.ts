'use client';

import { useSyncExternalStore } from 'react';
import { getLangue, type Langue, setLangue, subscribeLangue } from './index';

/** Hook : re-rend quand la langue change. */
export function useLangue(): [Langue, (v: Langue) => void] {
  const langue = useSyncExternalStore(subscribeLangue, getLangue, getLangue);
  return [langue, setLangue];
}

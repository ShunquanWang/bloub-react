import type { Metadata } from 'next';
import type { FC } from 'react';
import Link from 'next/link';
import { SITE_NAME } from '@/config/site';

export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false, follow: true },
};

const NotFound: FC = () => {
  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1>404 — page not found</h1>
      <p>
        That URL is not part of {SITE_NAME}.{' '}
        <Link href="/">Back to the bloub studio</Link>
      </p>
    </main>
  );
};

export default NotFound;

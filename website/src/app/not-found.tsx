import type { FC } from 'react';
import Link from 'next/link';

const NotFound: FC = () => {
  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1>404</h1>
      <p>
        <Link href="/">Back to bloub</Link>
      </p>
    </main>
  );
};

export default NotFound;

/**
 * Must stay in sync with `basePath` in `next.config.ts`.
 * Used for URLs that bypass Next.js automatic basePath handling.
 */
export const SITE_BASE_PATH = '';

/** Canonical site origin (no trailing slash). Override with NEXT_PUBLIC_SITE_URL. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bloub-react.shunquan.wang/'
).replace(/\/$/, '');

export const SITE_NAME = 'bloub-react';

export const SITE_TITLE = 'bloub — animated SVG bot avatar';

export const SITE_DESCRIPTION =
  'React studio for the bloub SVG avatar: customise shapes and colours, edit animation timelines, and export SVG, PNG, GIF, or MP4. A React port of jeremy-prt/bloub.';

export const SITE_KEYWORDS = [
  'bloub',
  'bloub-react',
  'SVG',
  'avatar',
  'animation',
  'morphing',
  'React',
  'x.ai',
  'bot',
  'GIF export',
] as const;

export const SITE_REPO = 'https://github.com/ShunquanWang/bloub-react';

export const SITE_OG_IMAGE = '/logo.png';

export const SITE_AUTHOR = {
  name: 'Shunquan Wang',
  url: 'https://github.com/ShunquanWang',
} as const;

/** Absolute URL helper respecting optional basePath. */
export function siteUrl(path = '/'): string {
  const base = SITE_BASE_PATH.replace(/\/$/, '');
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return (
    `${SITE_URL}${base}${normalized === '/' ? '' : normalized}` || SITE_URL
  );
}

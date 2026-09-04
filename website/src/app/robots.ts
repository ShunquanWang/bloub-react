import type { MetadataRoute } from 'next';
import { SITE_BASE_PATH, SITE_URL } from '@/config/site';

export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  const base = `${SITE_URL}${SITE_BASE_PATH.replace(/\/$/, '')}`;
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: `${base}/sitemap.xml`,
    host: SITE_URL,
  };
}

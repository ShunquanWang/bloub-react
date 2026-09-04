/// <reference types="next" />
/// <reference types="next/image-types/global" />

declare namespace NodeJS {
  interface ProcessEnv {
    /** Canonical site origin for SEO (metadataBase, sitemap, robots). */
    NEXT_PUBLIC_SITE_URL?: string;
  }
}

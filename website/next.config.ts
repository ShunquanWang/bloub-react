import { z } from 'zod';
import { createNextConfig, createNextConfigEnv } from '@hyperse/next-config';
import { SITE_BASE_PATH } from './src/config/site';

const buildEnv = createNextConfigEnv(
  z.object({
    NEXT_BUILD_ENV_OUTPUT: z
      .union([z.literal('standalone'), z.literal('export')])
      .optional(),
  })
);

export default createNextConfig({
  basePath: SITE_BASE_PATH || undefined,
  transpilePackages: ['bloub-react'],
  output: buildEnv.NEXT_BUILD_ENV_OUTPUT,
  images: {
    unoptimized: buildEnv.NEXT_BUILD_ENV_OUTPUT === 'export' ? true : undefined,
  },
});

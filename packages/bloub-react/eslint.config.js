import { base, defineConfig } from '@hyperse/eslint-config-hyperse';
import pluginVitest from '@vitest/eslint-plugin';

export default defineConfig([
  {
    ignores: ['backup/**'],
  },
  ...base,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    files: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    plugins: { vitest: pluginVitest },
    rules: {
      // Vitest supports `expect(actual, message)` for assertion labels.
      'vitest/valid-expect': ['error', { maxArgs: 2 }],
    },
  },
]);

import { defineConfig, nextjs } from '@hyperse/eslint-config-hyperse';
import pluginVitest from '@vitest/eslint-plugin';

export default defineConfig(
  [
    ...nextjs,
    {
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-empty-object-type': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        '@eslint-react/dom-no-dangerously-set-innerhtml': 'off',
        // Studio ports Vue watchers: syncing derived UI state in effects is intentional.
        '@eslint-react/set-state-in-effect': 'off',
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
    {
      files: ['**/*.mdx'],
      rules: {
        'no-undef': 'off',
      },
    },
  ],
  ['**/out']
);

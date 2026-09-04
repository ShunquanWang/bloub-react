import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [],
  test: {
    globals: true,
    exclude: [...configDefaults.exclude, '**/backup/**'],
    include: ['tests/**/?(*.){test,spec}.?(c|m)[jt]s?(x)'],
  },
});

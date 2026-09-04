import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    exclude: [...configDefaults.exclude, '**/playwright/**'],
    alias: {
      '@/': new URL('./src/', import.meta.url).pathname,
    },
    include: ['tests/**/?(*.){test,spec}.?(c|m)[jt]s?(x)'],
  },
});

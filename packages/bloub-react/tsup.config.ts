import { defineConfig } from 'tsup';

/**
 * Bundle for npm. Declarations are emitted by `tsc -p tsconfig.build.json`
 * (tsup's dts path still trips on TS 6 `baseUrl` deprecations in some setups).
 */
export default defineConfig((options) => ({
  entry: {
    index: 'src/index.ts',
  },
  format: ['esm'],
  outDir: 'dist',
  dts: false,
  splitting: false,
  clean: false,
  sourcemap: !options.watch,
  minify: !options.watch,
  treeshake: true,
  tsconfig: './tsconfig.build.json',
  external: ['react', 'react-dom', 'react/jsx-runtime'],
  esbuildOptions(opts) {
    opts.jsx = 'automatic';
  },
}));

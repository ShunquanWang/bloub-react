import { defineConfig } from 'tsup';

export default defineConfig((options) => ({
  dts: true,
  entry: {
    index: 'src/index.ts',
  },
  splitting: false,
  sourcemap: !options.watch,
  clean: true,
  minify: !options.watch,
  treeshake: true,
  tsconfig: './tsconfig.build.json',
  format: ['esm'],
  outDir: 'dist',
  external: ['react', 'react-dom', 'react/jsx-runtime'],
  esbuildOptions(opts) {
    opts.jsx = 'automatic';
  },
}));

import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@opencrate/core': resolve(__dirname, 'src/index.ts'),
    },
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'OpenCrateCore',
      fileName: () => 'opencrate-core.js',
      formats: ['es'],
    },
    rollupOptions: {
      treeshake: true,
    },
    minify: 'esbuild',
    sourcemap: true,
  },
  root: '.',
  server: {
    open: '/examples/index.html',
  },
});

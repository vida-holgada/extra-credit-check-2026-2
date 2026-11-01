import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  root:path.resolve('pages'),
  base:'./',
  publicDir:false,
  plugins:[react()],
  css:{postcss:path.resolve('.')},
  build:{outDir:path.resolve('dist-pages'),emptyOutDir:true},
});

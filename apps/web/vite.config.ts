import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import pkg from './package.json' with { type: 'json' };

export default defineConfig({
  // la web app vit sous /app ; la racine du domaine est la landing (apps/site)
  base: '/app/',
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  plugins: [react()],
  server: { port: 5183 },
});

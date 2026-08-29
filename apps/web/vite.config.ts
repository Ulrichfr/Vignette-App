import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  // la web app vit sous /app ; la racine du domaine est la landing (apps/site)
  base: '/app/',
  plugins: [react()],
  server: { port: 5183 },
});

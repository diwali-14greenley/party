import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// On GitHub Pages the site lives at /<repo-name>/, so the deploy workflow
// sets VITE_BASE to that path. Locally it's just "/".
export default defineConfig({
  base: process.env.VITE_BASE || '/',
  plugins: [react()],
});

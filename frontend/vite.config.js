import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
});

export default defineConfig({
  plugins: [react()],
})

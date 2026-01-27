import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'robots.txt'],
      manifest: {
        name: 'NaildBy_Steph',
        short_name: 'NBS',
        description: 'Nail tech booking and showcase app',
        theme_color: '#ff69b4',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client'),
      '@shared': path.resolve(__dirname, './shared'),
      '@server': path.resolve(__dirname, './server'),
      '@drizzle': path.resolve(__dirname, './drizzle'),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "./client/styles/global.scss";`,
      },
    },
  },
  server: {
    port: 3000,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});


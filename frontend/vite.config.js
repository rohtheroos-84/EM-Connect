import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (/node_modules[\\/]recharts[\\/]/.test(id)) return 'charts';
          if (/node_modules[\\/]lucide-react[\\/]/.test(id)) return 'icons';
          if (/node_modules[\\/]@react-oauth[\\/]google[\\/]/.test(id)) return 'google-auth';
          if (/node_modules[\\/]react-router-dom[\\/]/.test(id)) return 'router';
          if (/node_modules[\\/]react-dom[\\/]/.test(id) || /node_modules[\\/]react[\\/]/.test(id)) return 'react-vendor';
        },
      },
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:8081',
        ws: true,
      },
    },
  },
});

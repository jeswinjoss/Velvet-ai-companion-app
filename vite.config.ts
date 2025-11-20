
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    // CRITICAL: This fixes the "Black Screen" on GitHub Pages
    base: './', 
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      'process.env': JSON.stringify(env) 
    },
    server: {
      host: true, // This allows the server to be accessed by your phone IP
      port: 5173
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false
    }
  };
});

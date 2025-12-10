import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  const apiKey = process.env.API_KEY || env.API_KEY || process.env.VITE_API_KEY || env.VITE_API_KEY;

  return {
    base: './', 
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(apiKey)
    },
    server: {
      host: '0.0.0.0',
      port: 5000,
      allowedHosts: true
    }
  };
});
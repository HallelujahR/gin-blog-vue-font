import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isDev = mode === 'development';
  return {
    plugins: [vue()],
    server: {
      port: 5173,
      proxy: isDev
        ? {
            '/api': {
              target: env.VITE_API_TARGET || 'http://localhost:8080',
              changeOrigin: true,
            },
          }
        : undefined,
    },
  };
});

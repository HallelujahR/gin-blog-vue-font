import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isDev = mode === 'development';
  return {
    plugins: [vue()],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('md-editor-v3')) {
              return 'markdown-editor';
            }
            if (id.includes('node_modules')) {
              if (id.includes('vue')) {
                return 'vue-vendor';
              }
              if (id.includes('axios')) {
                return 'http-vendor';
              }
            }
          },
        },
      },
    },
    server: {
      port: 5173,
      proxy: isDev
        ? {
            '/api': {
              target: env.VITE_API_TARGET || 'http://localhost:8080',
              changeOrigin: true,
              ws: true,
            },
          }
        : undefined,
    },
  };
});

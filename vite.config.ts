import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { quasar, transformAssetUrls } from '@quasar/vite-plugin';
import path from 'path';

export default defineConfig({
  plugins: [
    vue({
      template: { transformAssetUrls }
    }),
    quasar({
      sassVariables: path.resolve(__dirname, 'src/css/quasar.variables.scss')
    })
  ],
  css: {
    preprocessorOptions: {
      scss: {
        includePaths: [path.resolve(__dirname, '.')]
      },
      sass: {
        includePaths: [path.resolve(__dirname, '.')]
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  test: {
    globals: true,
    environment: 'node'
  }
});

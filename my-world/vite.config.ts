import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig(({ command }) => {
  const base = command === 'build' ? '/my-world/' : '/'

  return {
    base,
    plugins: [vue()],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
    assetsInclude: ['**/*.glsl'],
    server: {
      port: 3000,
      open: true,
    },
  }
})

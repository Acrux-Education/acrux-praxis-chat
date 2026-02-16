import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: 'src/standalone.ts',
      formats: ['iife'],
      name: 'AcruxChat',
      fileName: () => 'acrux-chat.iife.js',
    },
    rollupOptions: {
      output: {
        assetFileNames: 'style.css',
        exports: 'named',
      },
    },
    cssCodeSplit: false,
    sourcemap: true,
    outDir: 'dist',
    emptyOutDir: false,
  },
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
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
    sourcemap: false,
    outDir: 'dist',
    emptyOutDir: false,
  },
})

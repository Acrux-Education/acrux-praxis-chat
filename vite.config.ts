import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    react(),
    dts({
      include: ['src/index.ts', 'src/types.ts', 'src/ChatWidget.tsx'],
      outDir: 'dist',
    }),
  ],
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
      fileName: () => 'acrux-chat.es.js',
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: {
        assetFileNames: 'style.css',
      },
    },
    cssCodeSplit: false,
    sourcemap: false,
    // Versioned release files are immutable and must survive later builds.
    emptyOutDir: false,
  },
})

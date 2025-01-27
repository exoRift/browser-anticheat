import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'headers',
      configureServer (server) {
        server.middlewares.use((req, res, next) => {
          if (req.url?.startsWith('/fonts') || req.url?.startsWith('/images')) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
          }

          next()
        })
      }
    }
  ],
  build: {
    outDir: 'build/'
  }
})

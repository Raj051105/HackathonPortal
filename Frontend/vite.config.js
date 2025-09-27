import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
  allowedHosts: 'all',
  host: true,
  strictPort: false,
  cors: true,
  port: 3000,
  disableHostCheck: true,
}
})
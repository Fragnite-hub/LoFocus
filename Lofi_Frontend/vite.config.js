import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    global: {}   // <-- this line fixes SockJS
  },
  server: {
    proxy: {
      // REST API
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      },
      // SockJS endpoint (STOMP)
      '/ws-study': {
        target: 'http://localhost:8081',
        ws: true,
        changeOrigin: true,
      },
    },
  },
})

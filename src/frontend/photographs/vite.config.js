import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// Read API configuration from config.json
let apiHost = 'localhost'
let apiPort = 8000

try {
  const configPath = path.resolve(__dirname, '../../..', 'config.json')
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
  
  if (config.api_config) {
    apiHost = config.api_config.host === '0.0.0.0' ? 'localhost' : config.api_config.host
    apiPort = config.api_config.port
  }
} catch (error) {
  console.warn('Could not read config.json, using default API settings:', error)
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: `http://${apiHost}:${apiPort}`,
        changeOrigin: true,
      }
    }
  },
  define: {
    'import.meta.env.API_BASE_URL': JSON.stringify(`http://${apiHost}:${apiPort}`)
  }
})

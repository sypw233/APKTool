import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react()
  ],
  worker: {
    format: 'es'
  },
  resolve: {
    alias: {
      buffer: 'buffer/',
      process: path.resolve('src/lib/process-shim.js')
    }
  },
  define: {
    'global.Buffer': 'globalThis.Buffer'
  },
  // 如果是 CI 环境 (GitHub Actions) 部署，则使用仓库名 /APKTool/，否则本地开发使用 ./
  base: process.env.CI ? '/APKTool/' : './'
})

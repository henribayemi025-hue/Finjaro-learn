import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'node:child_process'
import { defineConfig } from 'vite'

// Version de la publication (empreinte git) : sert à nommer le cache hors-ligne, purgé à chaque nouvelle version.
let version = 'dev'
try { version = execSync('git rev-parse --short HEAD').toString().trim() } catch { /* pas de git : on garde « dev » */ }

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: { __LEARN_VERSION__: JSON.stringify(version) },
})

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Mode hors-ligne : seulement dans la version publiée (pas pendant le développement).
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(import.meta.env.BASE_URL + 'sw.js?v=' + encodeURIComponent(__LEARN_VERSION__), { scope: import.meta.env.BASE_URL }).catch(() => { /* pas de hors-ligne : l'appli marche quand même */ })
  })
}

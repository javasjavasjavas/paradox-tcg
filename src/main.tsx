import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

if ('fonts' in document && typeof document.fonts.load === 'function') {
  void document.fonts.load('64px "Lethal Craze"', 'STAGE 1').catch(() => undefined)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

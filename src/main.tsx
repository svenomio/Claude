import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { QuickCapture } from './QuickCapture.tsx'

const isQuickCapture = new URLSearchParams(window.location.search).has('quick')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isQuickCapture ? <QuickCapture /> : <App />}
  </StrictMode>,
)

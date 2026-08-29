import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'react-toastify/ReactToastify.css'
import './index.css'
import App from './App.jsx'
import { LangProvider } from './data/LangProvider.jsx'
import { StoreProvider } from './data/StoreProvider.jsx'
import { ThemeProvider } from './data/ThemeProvider.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <LangProvider>
        <StoreProvider>
          <App />
        </StoreProvider>
      </LangProvider>
    </ThemeProvider>
  </StrictMode>,
)

// ─────────────────────────────────────────────────────────────
//  Тема оформления: светлая / тёмная / как в системе
// ─────────────────────────────────────────────────────────────
import { createContext, useContext } from 'react'

export const THEMES = ['light', 'dark', 'system']
export const THEME_KEY = 'vibrant.theme'
export const ThemeContext = createContext(null)

let THEME = 'system'
try {
  const saved = localStorage.getItem(THEME_KEY)
  if (saved && THEMES.includes(saved)) THEME = saved
} catch {
  /* localStorage недоступен */
}

export const getTheme = () => THEME

/** «system» снимает атрибут — дальше решает prefers-color-scheme. */
export function applyTheme(theme) {
  THEME = theme
  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch {
    /* ignore */
  }
  const root = document.documentElement
  if (theme === 'system') root.removeAttribute('data-theme')
  else root.setAttribute('data-theme', theme)
}

applyTheme(THEME)

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme должен использоваться внутри ThemeProvider')
  return ctx
}

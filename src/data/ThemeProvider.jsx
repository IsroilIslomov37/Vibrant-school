import { useCallback, useMemo, useState } from 'react'
import { applyTheme, getTheme, ThemeContext } from './theme.js'

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getTheme)

  const setTheme = useCallback((next) => {
    applyTheme(next)
    setThemeState(next)
  }, [])

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

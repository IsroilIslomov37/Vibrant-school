import { useCallback, useMemo, useState } from 'react'
import { applyLang, getLang, LangContext, t } from './i18n.js'

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(getLang)

  const setLang = useCallback((next) => {
    applyLang(next)
    setLangState(next)
  }, [])

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang])

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>
}

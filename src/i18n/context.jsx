/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import es from './es.json'
import en from './en.json'

const dictionaries = { es, en }
const LocaleContext = createContext(null)

export function LocaleProvider({ children }) {
  const [locale, setLocale] = useState(() => localStorage.getItem('locale') || 'es')

  useEffect(() => {
    document.documentElement.lang = locale
    document.title = dictionaries[locale]['page.title']
    localStorage.setItem('locale', locale)
  }, [locale])

  const t = useCallback((key, params = {}) => {
    let str = dictionaries[locale][key]
    if (str === undefined) return key
    for (const [k, v] of Object.entries(params)) {
      str = str.replace(`{${k}}`, v)
    }
    return str
  }, [locale])

  const formatNumber = useCallback((n, opts = {}) => {
    const localeTag = locale === 'es' ? 'es-AR' : 'en-US'
    return n.toLocaleString(localeTag, opts)
  }, [locale])

  const dayAbbrev = useMemo(() => dictionaries[locale].dayAbbrev, [locale])

  const value = useMemo(() => ({ locale, setLocale, t, formatNumber, dayAbbrev }), [locale, t, formatNumber, dayAbbrev])

  return (
    <LocaleContext.Provider value={value}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale() {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider')
  return ctx
}

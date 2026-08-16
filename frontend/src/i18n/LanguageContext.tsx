import { createContext, useContext, useState, type ReactNode } from 'react'
import { translations, type Language, type Translations } from './translations'

type LanguageContextValue = {
  lang: Language
  setLang: (lang: Language) => void
  t: Translations
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Angles per defecte (audiencia principal del portfoli), toggle a espanyol
  const [lang, setLang] = useState<Language>('en')

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}

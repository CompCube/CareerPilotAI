import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext'

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (resp: { credential: string }) => void }) => void
          prompt: (callback?: (notification: { isNotDisplayed: () => boolean; isSkippedMoment: () => boolean }) => void) => void
        }
      }
    }
  }
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

function ProfileIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8" />
    </svg>
  )
}

/**
 * En lloc del boto per defecte de Google (renderButton, lleig i dificil
 * d'estilitzar), fem servir el nostre propi boto -- una icona de perfil
 * amb el nostre estil -- que en clicar obre el dialeg real de Google
 * (prompt()). Mateix flux de seguretat, aparença nostra. Patro oficial
 * de Google Identity Services, no un hack.
 */
export function GoogleLoginButton({ onToken }: { onToken: (googleIdToken: string) => void }) {
  const { t } = useLanguage()
  const initialized = useRef(false)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || initialized.current) return

    let attempts = 0
    const tryInit = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (resp) => onToken(resp.credential),
        })
        initialized.current = true
        setIsReady(true)
      } else if (attempts < 10) {
        attempts += 1
        setTimeout(tryInit, 200)
      }
    }
    tryInit()
  }, [onToken])

  if (!GOOGLE_CLIENT_ID) return null

  return (
    <div className="group relative">
      <button
        onClick={() => window.google?.accounts.id.prompt()}
        disabled={!isReady}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-panel-border text-muted transition-colors group-hover:border-accent group-hover:text-accent disabled:opacity-40"
      >
        <ProfileIcon />
      </button>

      {/* Pont invisible perque el hover no es talli entre el boto i el label */}
      <div className="absolute right-0 top-full h-2 w-32" />

      <div className="invisible absolute right-0 top-full z-50 whitespace-nowrap rounded-md border border-panel-border bg-panel px-3 py-1.5 opacity-0 shadow-lg transition-opacity group-hover:visible group-hover:opacity-100">
        <p className="font-mono text-[10px] uppercase tracking-wider text-accent">{t.auth.signIn}</p>
      </div>
    </div>
  )
}

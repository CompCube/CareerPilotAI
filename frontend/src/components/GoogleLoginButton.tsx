import { useEffect, useRef } from 'react'

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (resp: { credential: string }) => void }) => void
          renderButton: (parent: HTMLElement, options: { theme: string; size: string; text?: string }) => void
        }
      }
    }
  }
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

export function GoogleLoginButton({ onToken }: { onToken: (googleIdToken: string) => void }) {
  const buttonRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !buttonRef.current) return

    // El script de Google (carregat a index.html) pot trigar uns instants
    // a estar disponible -- reintentem un parell de cops si cal.
    let attempts = 0
    const tryInit = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (resp) => onToken(resp.credential),
        })
        window.google.accounts.id.renderButton(buttonRef.current!, {
          theme: 'outline',
          size: 'medium',
          text: 'signin_with',
        })
      } else if (attempts < 10) {
        attempts += 1
        setTimeout(tryInit, 200)
      }
    }
    tryInit()
  }, [onToken])

  if (!GOOGLE_CLIENT_ID) return null // encara no configurat, no trenquem la resta de l'app

  return <div ref={buttonRef} />
}

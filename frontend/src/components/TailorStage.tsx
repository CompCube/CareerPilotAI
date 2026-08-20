import { useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import type { TailoredBullet } from '../api'

export type TailorTurn = { agentMessage: string; userReply: string | null }

type Props = {
  history: TailorTurn[]
  tailoredBullets: TailoredBullet[]
  status: 'needs_info' | 'complete'
  onAnswer: (message: string) => void
  onComplete: () => void
  isLoading: boolean
}

export function TailorStage({
  history,
  tailoredBullets,
  status,
  onAnswer,
  onComplete,
  isLoading,
}: Props) {
  const { t } = useLanguage()
  const [reply, setReply] = useState('')

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-4xl font-semibold text-paper">{t.tailor.heading}</h1>

      {/* Historial tipus xat -- mateix patró que l'Interview */}
      <div className="mt-6 space-y-4">
        {history.map((turn, i) => (
          <div key={i}>
            <div className="rounded-lg border border-panel-border bg-panel px-4 py-3.5">
              <p className="font-mono text-[10px] uppercase tracking-wider text-accent">
                {t.tailor.agentAsks}
              </p>
              <p className="mt-1.5 text-base leading-relaxed text-paper">{turn.agentMessage}</p>
            </div>
            {turn.userReply && (
              <div className="ml-6 mt-2 rounded-lg border border-panel-border bg-ink px-4 py-3.5">
                <p className="font-mono text-[10px] uppercase tracking-wider text-muted">You</p>
                <p className="mt-1.5 text-base leading-relaxed text-paper">{turn.userReply}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {tailoredBullets.length > 0 && (
        <div className="mt-6 space-y-3">
          {tailoredBullets.map((b, i) => (
            <div key={i} className="rounded-lg border border-panel-border bg-panel p-4">
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted">
                {t.tailor.before}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-muted line-through decoration-muted/40">
                {b.original}
              </p>
              <p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-match">
                {t.tailor.after}
              </p>
              <p className="mt-1 text-base leading-relaxed text-paper">{b.rewritten}</p>
            </div>
          ))}
        </div>
      )}

      {status === 'needs_info' ? (
        <div className="mt-4 flex gap-2">
          <input
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && reply.trim() && !isLoading) {
                onAnswer(reply)
                setReply('')
              }
            }}
            placeholder={t.tailor.answerPlaceholder}
            className="flex-1 rounded-md border border-panel-border bg-panel px-4 py-3 text-base text-paper placeholder:text-muted/60 focus:border-accent focus:outline-none"
          />
          <button
            onClick={() => {
              onAnswer(reply)
              setReply('')
            }}
            disabled={!reply.trim() || isLoading}
            className="rounded-md bg-accent px-5 py-3 font-mono text-sm uppercase tracking-wider text-ink transition-opacity disabled:cursor-not-allowed disabled:opacity-30 enabled:hover:opacity-90"
          >
            {t.tailor.send}
          </button>
        </div>
      ) : (
        <button
          onClick={onComplete}
          className="mt-6 rounded-md bg-accent px-6 py-3 font-mono text-sm uppercase tracking-wider text-ink transition-opacity hover:opacity-90"
        >
          {t.tailor.complete}
        </button>
      )}
    </div>
  )
}

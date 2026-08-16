import { useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import type { TailorResponse } from '../api'

type Props = {
  tailorState: TailorResponse
  onAnswer: (message: string) => void
  onComplete: () => void
  isLoading: boolean
}

export function TailorStage({ tailorState, onAnswer, onComplete, isLoading }: Props) {
  const { t } = useLanguage()
  const [reply, setReply] = useState('')

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-4xl font-semibold text-paper">{t.tailor.heading}</h1>

      {tailorState.tailored_bullets.length > 0 && (
        <div className="mt-8 space-y-4">
          {tailorState.tailored_bullets.map((b, i) => (
            <div key={i} className="rounded-md border border-panel-border bg-panel p-4">
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted">
                {t.tailor.before}
              </p>
              <p className="mt-1 text-sm text-muted line-through decoration-muted/40">
                {b.original}
              </p>
              <p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-match">
                {t.tailor.after}
              </p>
              <p className="mt-1 text-sm text-paper">{b.rewritten}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 rounded-md border border-accent/40 bg-accent/10 p-4">
        <p className="font-mono text-[10px] uppercase tracking-wider text-accent">
          {tailorState.status === 'needs_info' ? t.tailor.agentAsks : t.tailor.summary}
        </p>
        <p className="mt-2 text-sm text-paper">{tailorState.agent_message}</p>
      </div>

      {tailorState.status === 'needs_info' ? (
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
            className="flex-1 rounded-md border border-panel-border bg-panel px-4 py-3 text-sm text-paper placeholder:text-muted/60 focus:border-accent focus:outline-none"
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

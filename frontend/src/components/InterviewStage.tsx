import { useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import type { InterviewMode, InterviewResponse } from '../api'

type Turn = { question: string; answer: string | null }

type Props = {
  mode: InterviewMode
  onModeChange: (mode: InterviewMode) => void
  onStart: () => void
  interviewState: InterviewResponse | null
  history: Turn[]
  onAnswer: (answer: string) => void
  isLoading: boolean
}

export function InterviewStage({
  mode,
  onModeChange,
  onStart,
  interviewState,
  history,
  onAnswer,
  isLoading,
}: Props) {
  const { t } = useLanguage()
  const [answer, setAnswer] = useState('')

  const MODES: { key: InterviewMode; label: string }[] = [
    { key: 'mixed', label: t.interview.modeMixed },
    { key: 'recruiter', label: t.interview.modeRecruiter },
    { key: 'technical', label: t.interview.modeTechnical },
    { key: 'behavioural', label: t.interview.modeBehavioural },
  ]

  if (!interviewState) {
    return (
      <div className="mx-auto max-w-5xl">
        <h1 className="font-display text-4xl font-semibold text-paper">{t.interview.heading}</h1>
        <p className="mt-2 text-muted">{t.interview.subheading}</p>

        <div className="mt-6 flex flex-wrap gap-2">
          {MODES.map((m) => (
            <button
              key={m.key}
              onClick={() => onModeChange(m.key)}
              className={`rounded-full border px-4 py-2 font-mono text-xs uppercase tracking-wider transition-colors ${
                mode === m.key
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-panel-border text-muted hover:border-muted'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <button
          onClick={onStart}
          disabled={isLoading}
          className="mt-8 rounded-md bg-accent px-6 py-3 font-mono text-sm uppercase tracking-wider text-ink transition-opacity disabled:opacity-30 enabled:hover:opacity-90"
        >
          {isLoading ? t.interview.starting : t.interview.start}
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-4xl font-semibold text-paper">{t.interview.heading}</h1>
        <span className="font-mono text-xs uppercase tracking-wider text-muted">
          {t.interview.questionCounter.replace('{n}', String(interviewState.turn_number))}
        </span>
      </div>

      <div className="mt-6 space-y-4">
        {history.map((turn, i) => (
          <div key={i}>
            <div className="rounded-md border border-panel-border bg-panel p-4">
              <p className="font-mono text-[10px] uppercase tracking-wider text-accent">
                {t.interview.interviewer}
              </p>
              <p className="mt-1 text-sm text-paper">{turn.question}</p>
            </div>
            {turn.answer && (
              <div className="ml-6 mt-2 rounded-md border border-panel-border bg-ink p-4">
                <p className="font-mono text-[10px] uppercase tracking-wider text-muted">
                  {t.interview.you}
                </p>
                <p className="mt-1 text-sm text-paper">{turn.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {interviewState.done ? (
        <div className="mt-6 rounded-md border border-match/40 bg-match/10 p-4 text-sm text-match">
          {t.interview.doneMsg}
        </div>
      ) : (
        <div className="mt-4 flex gap-2">
          <input
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && answer.trim() && !isLoading) {
                onAnswer(answer)
                setAnswer('')
              }
            }}
            placeholder={t.interview.answerPlaceholder}
            className="flex-1 rounded-md border border-panel-border bg-panel px-4 py-3 text-sm text-paper placeholder:text-muted/60 focus:border-accent focus:outline-none"
          />
          <button
            onClick={() => {
              onAnswer(answer)
              setAnswer('')
            }}
            disabled={!answer.trim() || isLoading}
            className="rounded-md bg-accent px-5 py-3 font-mono text-sm uppercase tracking-wider text-ink transition-opacity disabled:cursor-not-allowed disabled:opacity-30 enabled:hover:opacity-90"
          >
            {t.interview.send}
          </button>
        </div>
      )}
    </div>
  )
}

import { useState } from 'react'
import type { InterviewMode, InterviewResponse } from '../api'

const MODES: { key: InterviewMode; label: string }[] = [
  { key: 'mixed', label: 'Mixta' },
  { key: 'recruiter', label: 'Recruiter' },
  { key: 'technical', label: 'Tècnica' },
  { key: 'behavioural', label: 'Conductual' },
]

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
  const [answer, setAnswer] = useState('')

  if (!interviewState) {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="font-display text-4xl font-semibold text-paper">L'entrevista</h1>
        <p className="mt-2 text-muted">Tria el mode i comença quan vulguis.</p>

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
          {isLoading ? 'Preparant…' : 'Comença l\'entrevista'}
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-4xl font-semibold text-paper">L'entrevista</h1>
        <span className="font-mono text-xs uppercase tracking-wider text-muted">
          Pregunta {interviewState.turn_number} / 5
        </span>
      </div>

      <div className="mt-6 space-y-4">
        {history.map((turn, i) => (
          <div key={i}>
            <div className="rounded-md border border-panel-border bg-panel p-4">
              <p className="font-mono text-[10px] uppercase tracking-wider text-accent">
                Entrevistador
              </p>
              <p className="mt-1 text-sm text-paper">{turn.question}</p>
            </div>
            {turn.answer && (
              <div className="ml-6 mt-2 rounded-md border border-panel-border bg-ink p-4">
                <p className="font-mono text-[10px] uppercase tracking-wider text-muted">Tu</p>
                <p className="mt-1 text-sm text-paper">{turn.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {interviewState.done ? (
        <div className="mt-6 rounded-md border border-match/40 bg-match/10 p-4 text-sm text-match">
          Entrevista completada. (L'avaluació detallada arriba al Sprint 2 — Evaluate agent.)
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
            placeholder="La teva resposta..."
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
            Envia
          </button>
        </div>
      )}
    </div>
  )
}

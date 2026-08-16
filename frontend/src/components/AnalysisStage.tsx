import type { AnalyzeResponse } from '../api'

const STATUS_LABEL: Record<string, string> = {
  match: 'Coberta',
  partial: 'Parcial',
  gap: 'Buit',
}

const STATUS_COLOR: Record<string, string> = {
  match: 'text-match border-match/40 bg-match/10',
  partial: 'text-partial border-partial/40 bg-partial/10',
  gap: 'text-gap border-gap/40 bg-gap/10',
}

export function AnalysisStage({
  analysis,
  onContinue,
}: {
  analysis: AnalyzeResponse
  onContinue: () => void
}) {
  const sorted = [...analysis.competencies].sort((a, b) => a.priority - b.priority)

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-start justify-between gap-8">
        <div>
          <h1 className="font-display text-4xl font-semibold text-paper">Veredicte</h1>
          <p className="mt-3 max-w-md text-muted">{analysis.company_profile}</p>
        </div>

        {/* Segell -- element signatura de la pagina */}
        <div className="flex h-28 w-28 shrink-0 flex-col items-center justify-center rounded-full border-2 border-accent font-display text-3xl font-semibold text-accent">
          {Math.round(analysis.fit_score)}
          <span className="font-mono text-[10px] font-normal tracking-wider text-accent/70">
            FIT SCORE
          </span>
        </div>
      </div>

      <div className="mt-10 space-y-2">
        {sorted.map((c) => (
          <div
            key={c.competency}
            className="flex items-center justify-between gap-4 rounded-md border border-panel-border bg-panel px-4 py-3"
          >
            <div>
              <p className="text-sm font-medium text-paper">{c.competency}</p>
              <p className="mt-0.5 text-xs text-muted">{c.evidence}</p>
            </div>
            <span
              className={`shrink-0 rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-wider ${STATUS_COLOR[c.match_status]}`}
            >
              {STATUS_LABEL[c.match_status]}
            </span>
          </div>
        ))}
      </div>

      <button
        onClick={onContinue}
        className="mt-8 rounded-md bg-accent px-6 py-3 font-mono text-sm uppercase tracking-wider text-ink transition-opacity hover:opacity-90"
      >
        Retoca el CV →
      </button>
    </div>
  )
}

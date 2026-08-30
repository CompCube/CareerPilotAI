import { useLanguage } from '../i18n/LanguageContext'
import type { AnalyzeResponse } from '../api'

export function AnalysisStage({
  analysis,
  onContinue,
}: {
  analysis: AnalyzeResponse
  onContinue: () => void
}) {
  const { t } = useLanguage()

  const STATUS_LABEL: Record<string, string> = {
    match: t.analysis.statusMatch,
    partial: t.analysis.statusPartial,
    gap: t.analysis.statusGap,
  }
  const STATUS_COLOR: Record<string, string> = {
    match: 'text-match border-match/40 bg-match/10',
    partial: 'text-partial border-partial/40 bg-partial/10',
    gap: 'text-gap border-gap/40 bg-gap/10',
  }

  const sorted = [...analysis.competencies].sort((a, b) => a.priority - b.priority)
  const half = Math.ceil(sorted.length / 2)
  const firstHalf = sorted.slice(0, half)
  const secondHalf = sorted.slice(half)

  function RequirementCard({ c }: { c: (typeof sorted)[number] }) {
    return (
      <div
        key={c.competency}
        className="flex items-start justify-between gap-4 rounded-md border border-panel-border bg-panel px-4 py-3"
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
    )
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex items-center justify-between gap-8">
        <h1 className="font-display text-4xl font-semibold text-paper">{t.analysis.heading}</h1>

        <div className="flex h-28 w-28 shrink-0 flex-col items-center justify-center rounded-full border-2 border-accent font-display text-3xl font-semibold text-accent">
          {Math.round(analysis.fit_score)}
          <span className="font-mono text-[10px] font-normal tracking-wider text-accent/70">
            {t.analysis.fitScoreLabel}
          </span>
        </div>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-3">
        {/* --- Columna 1: els 3 panells de context --- */}
        <div className="max-h-[55vh] space-y-4 overflow-y-auto pr-1">
          <div className="rounded-lg border border-panel-border bg-panel p-4">
            <p className="font-mono text-[10px] uppercase tracking-wider text-accent">
              {t.analysis.companyLabel}
            </p>
            <p className="mt-2 text-justify text-sm leading-relaxed text-paper">
              {analysis.company_profile}
            </p>
          </div>

          <div className="rounded-lg border border-panel-border bg-panel p-4">
            <p className="font-mono text-[10px] uppercase tracking-wider text-accent">
              {t.analysis.roleSummaryLabel}
            </p>
            <p className="mt-2 text-justify text-sm leading-relaxed text-paper">
              {analysis.role_summary}
            </p>
          </div>

          <div className="rounded-lg border border-panel-border bg-panel p-4">
            <p className="font-mono text-[10px] uppercase tracking-wider text-accent">
              {t.analysis.idealCandidateLabel}
            </p>
            <p className="mt-2 text-justify text-sm leading-relaxed text-paper">
              {analysis.ideal_candidate_profile}
            </p>
          </div>
        </div>

        {/* --- Columnes 2 i 3: els requirements repartits en dues meitats,
            mateixa alçada que la columna 1 --- */}
        <div className="max-h-[55vh] space-y-3 overflow-y-auto pr-1">
          {firstHalf.map((c) => (
            <RequirementCard key={c.competency} c={c} />
          ))}
        </div>
        <div className="max-h-[55vh] space-y-3 overflow-y-auto pr-1">
          {secondHalf.map((c) => (
            <RequirementCard key={c.competency} c={c} />
          ))}
        </div>
      </div>

      <div className="mt-8 flex justify-center">
        <button
          onClick={onContinue}
          className="rounded-md bg-accent px-6 py-3 font-mono text-sm uppercase tracking-wider text-ink transition-opacity hover:opacity-90"
        >
          {t.analysis.continue}
        </button>
      </div>
    </div>
  )
}

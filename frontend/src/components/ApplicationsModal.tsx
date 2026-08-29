import { useEffect, useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import { listApplications, getApplication, ApiError, type ApplicationSummary, type ApplicationDetail } from '../api'
import { FormattedBullets } from '../utils/formatBullets'

function DetailSection({ label, content }: { label: string; content: string }) {
  if (!content) return null
  return (
    <div className="rounded-lg border border-panel-border bg-ink p-4">
      <p className="font-mono text-[10px] uppercase tracking-wider text-accent">{label}</p>
      <div className="mt-2">
        <FormattedBullets content={content} />
      </div>
    </div>
  )
}

export function ApplicationsModal({
  token,
  onClose,
  onPrepareInterview,
}: {
  token: string
  onClose: () => void
  onPrepareInterview: (jdText: string, cvTextUsed: string) => void
}) {
  const { t } = useLanguage()
  const [applications, setApplications] = useState<ApplicationSummary[]>([])
  const [selected, setSelected] = useState<ApplicationDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listApplications(token)
      .then(setApplications)
      .catch((err) => setError(err instanceof ApiError ? err.message : t.errors.generic))
      .finally(() => setIsLoading(false))
  }, [token, t.errors.generic])

  async function openDetail(id: number) {
    setError(null)
    try {
      const detail = await getApplication(token, id)
      setSelected(detail)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t.errors.generic)
    }
  }

  const topCompetencies = selected?.analysis
    ? [...selected.analysis.competencies].sort((a, b) => a.priority - b.priority).slice(0, 5)
    : []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-6" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-panel-border bg-panel p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-paper">
            {selected ? selected.title : t.auth.myApplications}
          </h2>
          <button onClick={onClose} className="text-muted transition-colors hover:text-accent" aria-label="Close">
            ✕
          </button>
        </div>

        {error && (
          <p className="mt-3 rounded-md border border-gap/40 bg-gap/10 px-4 py-2 text-sm text-gap">{error}</p>
        )}

        {selected ? (
          <div className="mt-4">
            <button
              onClick={() => setSelected(null)}
              className="font-mono text-xs uppercase tracking-wider text-muted transition-colors hover:text-accent"
            >
              {t.auth.backToList}
            </button>

            {selected.analysis && (
              <>
                <div className="mt-4 flex items-start justify-between gap-4 rounded-lg border border-accent/40 bg-accent/10 p-4">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-accent">
                      {t.analysis.roleSummaryLabel}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-paper">{selected.analysis.role_summary}</p>
                  </div>
                  <div className="shrink-0 text-center">
                    <p className="font-display text-2xl font-semibold text-accent">
                      {Math.round(selected.analysis.fit_score)}
                    </p>
                    <p className="font-mono text-[9px] uppercase tracking-wider text-accent/70">
                      {t.analysis.fitScoreLabel}
                    </p>
                  </div>
                </div>

                {topCompetencies.length > 0 && (
                  <div className="mt-3 rounded-lg border border-panel-border bg-ink p-4">
                    <p className="font-mono text-[10px] uppercase tracking-wider text-accent">
                      {t.auth.topSkillsLabel}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {topCompetencies.map((c) => (
                        <span
                          key={c.competency}
                          className="rounded-full border border-panel-border px-2.5 py-1 text-xs text-paper"
                        >
                          {c.competency}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {selected.tailor_sections && (
              <div className="mt-3 space-y-3">
                <DetailSection label={t.tailor.summaryLabel} content={selected.tailor_sections.professional_summary} />
                <DetailSection label={t.tailor.skillsSectionLabel} content={selected.tailor_sections.skills} />
                <DetailSection
                  label={
                    selected.tailor_sections.achievements_label === 'projects'
                      ? t.tailor.achievementsProjects
                      : t.tailor.achievementsKeyAchievements
                  }
                  content={selected.tailor_sections.achievements}
                />
                <DetailSection
                  label={t.tailor.experienceLabel}
                  content={selected.tailor_sections.professional_experience}
                />
              </div>
            )}

            <button
              onClick={() => onPrepareInterview(selected.jd_text, selected.cv_text_used)}
              className="mt-4 w-full rounded-md bg-accent px-6 py-3 font-mono text-sm uppercase tracking-wider text-ink transition-opacity hover:opacity-90"
            >
              {t.auth.prepareInterviewForThis}
            </button>
          </div>
        ) : isLoading ? (
          <p className="mt-6 text-sm text-muted">{t.upload.submitLoading}</p>
        ) : applications.length === 0 ? (
          <p className="mt-6 text-sm text-muted">{t.auth.noApplicationsYet}</p>
        ) : (
          <div className="mt-4 space-y-2">
            {applications.map((a) => (
              <button
                key={a.id}
                onClick={() => openDetail(a.id)}
                className="block w-full rounded-md border border-panel-border bg-ink px-4 py-3 text-left transition-colors hover:border-accent"
              >
                <p className="text-sm text-paper">{a.title}</p>
                <p className="mt-0.5 font-mono text-[10px] text-muted">
                  {new Date(a.created_at).toLocaleDateString()}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

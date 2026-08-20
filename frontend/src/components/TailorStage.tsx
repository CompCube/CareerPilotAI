import { useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import type { TailorResponse } from '../api'

export type TailorTurn = { agentMessage: string; userReply: string | null }

type Props = {
  history: TailorTurn[]
  tailorState: TailorResponse
  onAnswer: (message: string) => void
  onComplete: () => void
  isLoading: boolean
}

function CopyableCard({ label, content }: { label: string; content: string }) {
  const { t } = useLanguage()
  const [copied, setCopied] = useState(false)

  if (!content) return null

  async function handleCopy() {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="rounded-lg border border-panel-border bg-panel p-4">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-wider text-accent">{label}</p>
        <button
          onClick={handleCopy}
          className="rounded-full border border-accent/50 bg-accent/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-accent transition-colors hover:border-accent hover:bg-accent/20"
        >
          {copied ? t.tailor.copied : t.tailor.copy}
        </button>
      </div>
      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-paper">{content}</p>
    </div>
  )
}

export function TailorStage({ history, tailorState, onAnswer, onComplete, isLoading }: Props) {
  const { t } = useLanguage()
  const [reply, setReply] = useState('')

  const { sections } = tailorState
  const achievementsLabel =
    sections.achievements_label === 'projects'
      ? t.tailor.achievementsProjects
      : t.tailor.achievementsKeyAchievements

  const canReply = !tailorState.done && !isLoading

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-display text-4xl font-semibold text-paper">{t.tailor.heading}</h1>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {/* --- Esquerra: xat --- */}
        <div>
          <div className="space-y-4">
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

          {canReply && (
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
          )}

          {tailorState.done && (
            <button
              onClick={onComplete}
              className="mt-4 rounded-md bg-accent px-6 py-3 font-mono text-sm uppercase tracking-wider text-ink transition-opacity hover:opacity-90"
            >
              {t.tailor.finish}
            </button>
          )}
        </div>

        {/* --- Dreta: panells que es van omplint --- */}
        <div className="space-y-3">
          {tailorState.top_keywords.length > 0 && (
            <div className="rounded-lg border border-panel-border bg-panel p-4">
              <p className="font-mono text-[10px] uppercase tracking-wider text-accent">
                {t.tailor.keywordsLabel}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {tailorState.top_keywords.map((kw) => (
                  <span
                    key={kw}
                    className="rounded-full border border-panel-border px-2.5 py-1 text-xs text-paper"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {tailorState.key_skills.length > 0 && (
            <div className="rounded-lg border border-panel-border bg-panel p-4">
              <p className="font-mono text-[10px] uppercase tracking-wider text-accent">
                {t.tailor.keySkillsLabel}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {tailorState.key_skills.map((sk) => (
                  <span
                    key={sk}
                    className="rounded-full border border-match/40 bg-match/10 px-2.5 py-1 text-xs text-match"
                  >
                    {sk}
                  </span>
                ))}
              </div>
            </div>
          )}

          {tailorState.ats_score !== null && (
            <div className="rounded-lg border border-panel-border bg-panel p-4">
              <div className="flex items-center justify-between">
                <p className="font-mono text-[10px] uppercase tracking-wider text-accent">
                  {t.tailor.atsScoreLabel}
                </p>
                <span className="font-display text-lg font-semibold text-paper">
                  {tailorState.ats_score}
                </span>
              </div>
              {tailorState.ats_issues.length > 0 && (
                <ul className="mt-2 space-y-1.5">
                  {tailorState.ats_issues.map((issue, i) => (
                    <li key={i} className="text-xs text-muted">
                      <span className="text-gap">{issue.issue}</span> — {issue.fix}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {tailorState.positioning_reframe && (
            <div className="rounded-lg border border-accent/40 bg-accent/10 p-4">
              <p className="font-mono text-[10px] uppercase tracking-wider text-accent">
                {t.tailor.positioningLabel}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-paper">
                {tailorState.positioning_reframe}
              </p>
            </div>
          )}

          <CopyableCard label={t.tailor.titleLabel} content={sections.title} />
          <CopyableCard label={t.tailor.subtitleLabel} content={sections.subtitle} />
          <CopyableCard label={t.tailor.summaryLabel} content={sections.professional_summary} />
          <CopyableCard label={t.tailor.skillsSectionLabel} content={sections.skills} />
          <CopyableCard label={achievementsLabel} content={sections.achievements} />
          <CopyableCard label={t.tailor.experienceLabel} content={sections.professional_experience} />
        </div>
      </div>
    </div>
  )
}

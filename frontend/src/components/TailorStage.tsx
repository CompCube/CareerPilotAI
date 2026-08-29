import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import type { TailorResponse } from '../api'
import { FormattedBullets, stripBoldMarkers } from '../utils/formatBullets'

export type TailorTurn = { agentMessage: string; userReply: string | null }

type Props = {
  history: TailorTurn[]
  tailorState: TailorResponse
  onAnswer: (message: string) => void
  onSkipRemaining: () => void
  onComplete: () => void
  isLoading: boolean
}

function CopyableCard({
  label,
  content,
  asBullets = false,
}: {
  label: string
  content: string
  asBullets?: boolean
}) {
  const { t } = useLanguage()
  const [copied, setCopied] = useState(false)

  if (!content) return null

  async function handleCopy() {
    await navigator.clipboard.writeText(asBullets ? stripBoldMarkers(content) : content)
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
      {asBullets ? (
        <div className="mt-2">
          <FormattedBullets content={content} />
        </div>
      ) : (
        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-paper">{content}</p>
      )}
    </div>
  )
}

export function TailorStage({ history, tailorState, onAnswer, onSkipRemaining, onComplete, isLoading }: Props) {
  const { t } = useLanguage()
  const [reply, setReply] = useState('')
  const chatScrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatScrollRef.current?.scrollTo({ top: chatScrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [history, isLoading])

  const { sections } = tailorState
  const achievementsLabel =
    sections.achievements_label === 'projects'
      ? t.tailor.achievementsProjects
      : t.tailor.achievementsKeyAchievements

  const canReply = !tailorState.done && !isLoading

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="font-display text-4xl font-semibold text-paper">{t.tailor.heading}</h1>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {/* --- Esquerra: xat, incrustat amb el seu propi scroll, ancorat
            a la vista mentre la pagina fa scroll (sticky) --- */}
        <div className="sticky top-6 flex max-h-[calc(100vh-3rem)] flex-col">
          <div
            ref={chatScrollRef}
            className="min-h-0 flex-1 space-y-4 overflow-y-auto rounded-lg border border-panel-border bg-ink/40 p-3"
          >
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
            {isLoading && (
              <div className="rounded-lg border border-panel-border bg-panel px-4 py-3.5">
                <p className="font-mono text-[10px] uppercase tracking-wider text-accent">
                  {t.tailor.thinking}
                </p>
                <div className="mt-2.5 flex gap-1.5">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-accent [animation-delay:-0.3s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-accent [animation-delay:-0.15s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-accent" />
                </div>
              </div>
            )}
          </div>

          {canReply && (
            <div className="mt-4 flex shrink-0 gap-2">
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

          {canReply && (tailorState.phase === 'interrogate' || tailorState.phase === 'deepen') && (
            <button
              onClick={onSkipRemaining}
              disabled={isLoading}
              className="mt-2 self-start font-mono text-[10px] uppercase tracking-wider text-muted transition-colors hover:text-accent disabled:opacity-40"
            >
              {t.tailor.skipRemaining}
            </button>
          )}

          {tailorState.done && (
            <button
              onClick={onComplete}
              className="mt-4 shrink-0 rounded-md bg-accent px-6 py-3 font-mono text-sm uppercase tracking-wider text-ink transition-opacity hover:opacity-90"
            >
              {t.tailor.finish}
            </button>
          )}
        </div>

        {/* --- Dreta: panells fixes, flueixen amb la pagina normal (sense
            scroll intern) --- */}
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
              {/* Nota: partial (ambre), NO gap (vermell) -- son consells
                  estructurals constructius, no errors trencats de l'app. */}
              {tailorState.ats_issues.length > 0 && (
                <ul className="mt-2 space-y-1.5">
                  {tailorState.ats_issues.map((issue, i) => (
                    <li key={i} className="text-xs text-muted">
                      <span className="font-medium text-partial">{issue.issue}</span> — {issue.fix}
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
          <CopyableCard label={achievementsLabel} content={sections.achievements} asBullets />
          <CopyableCard
            label={t.tailor.experienceLabel}
            content={sections.professional_experience}
            asBullets
          />
        </div>
      </div>
    </div>
  )
}

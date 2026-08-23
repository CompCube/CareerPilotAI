import { useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import type { TailorSections } from '../api'
import { FormattedBullets, stripBoldMarkers } from '../utils/formatBullets'

function buildFullResumeText(sections: TailorSections, achievementsLabel: string): string {
  const parts = [
    sections.title,
    sections.subtitle,
    '',
    sections.professional_summary,
    '',
    'SKILLS',
    sections.skills,
    '',
    achievementsLabel.toUpperCase(),
    stripBoldMarkers(sections.achievements),
    '',
    'PROFESSIONAL EXPERIENCE',
    stripBoldMarkers(sections.professional_experience),
  ]
  return parts.filter((p) => p !== undefined).join('\n')
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

export function DoneStage({
  sections,
  onPracticeInterview,
}: {
  sections: TailorSections
  onPracticeInterview: () => void
}) {
  const { t } = useLanguage()
  const [copiedAll, setCopiedAll] = useState(false)

  const achievementsLabel =
    sections.achievements_label === 'projects'
      ? t.tailor.achievementsProjects
      : t.tailor.achievementsKeyAchievements

  async function handleCopyAll() {
    await navigator.clipboard.writeText(buildFullResumeText(sections, achievementsLabel))
    setCopiedAll(true)
    setTimeout(() => setCopiedAll(false), 1500)
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="inline-block rounded-full border border-match/40 bg-match/10 px-4 py-1 font-mono text-[10px] uppercase tracking-wider text-match">
        {t.done.badge}
      </div>
      <h1 className="mt-4 font-display text-4xl font-semibold text-paper">{t.done.heading}</h1>
      <p className="mt-3 text-muted">{t.done.subheading}</p>

      <div className="mt-6">
        <button
          onClick={handleCopyAll}
          className="rounded-md border border-accent px-5 py-2.5 font-mono text-xs uppercase tracking-wider text-accent transition-colors hover:bg-accent/10"
        >
          {copiedAll ? t.done.copied : t.done.copyAll}
        </button>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
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

      <div className="mt-6 rounded-lg border border-panel-border bg-panel p-6">
        <p className="text-sm text-paper">{t.done.note}</p>
        <button
          onClick={onPracticeInterview}
          className="mt-4 rounded-md border border-accent px-5 py-2.5 font-mono text-xs uppercase tracking-wider text-accent transition-colors hover:bg-accent/10"
        >
          {t.done.cta}
        </button>
      </div>
    </div>
  )
}

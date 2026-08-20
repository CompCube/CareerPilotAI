import { useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import type { TailoredBullet } from '../api'

/**
 * Splices each rewritten bullet into the original resume text, replacing
 * the matching original line. Pure text operation, no LLM call needed --
 * we already have everything from the Tailor conversation.
 */
function buildTailoredResume(originalCv: string, bullets: TailoredBullet[]): string {
  let result = originalCv
  for (const b of bullets) {
    if (b.original && result.includes(b.original)) {
      result = result.replace(b.original, b.rewritten)
    }
  }
  return result
}

export function DoneStage({
  cvText,
  tailoredBullets,
  onPracticeInterview,
}: {
  cvText: string
  tailoredBullets: TailoredBullet[]
  onPracticeInterview: () => void
}) {
  const { t } = useLanguage()
  const [resumeText, setResumeText] = useState(() => buildTailoredResume(cvText, tailoredBullets))
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(resumeText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="inline-block rounded-full border border-match/40 bg-match/10 px-4 py-1 font-mono text-[10px] uppercase tracking-wider text-match">
        {t.done.badge}
      </div>
      <h1 className="mt-4 font-display text-4xl font-semibold text-paper">{t.done.heading}</h1>
      <p className="mt-3 text-muted">{t.done.subheading}</p>

      <div className="mt-8">
        <div className="flex items-center justify-between">
          <label className="font-mono text-xs uppercase tracking-wider text-muted">
            {t.done.resumeLabel}
          </label>
          <button
            onClick={handleCopy}
            className="rounded-full border border-accent/50 bg-accent/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-accent transition-colors hover:border-accent hover:bg-accent/20"
          >
            {copied ? t.done.copied : t.done.copy}
          </button>
        </div>
        <p className="mt-1 text-xs text-muted">{t.done.resumeEditableHint}</p>
        <textarea
          value={resumeText}
          onChange={(e) => setResumeText(e.target.value)}
          rows={18}
          className="mt-2 w-full resize-none rounded-md border border-panel-border bg-panel p-4 text-sm leading-relaxed text-paper focus:border-accent focus:outline-none"
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

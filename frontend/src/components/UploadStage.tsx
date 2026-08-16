import { useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext'

type Props = {
  onSubmit: (cvText: string, jdText: string) => void
  isLoading: boolean
  error: string | null
  submitLabel?: string
}

export function UploadStage({ onSubmit, isLoading, error, submitLabel }: Props) {
  const { t } = useLanguage()
  const [cvText, setCvText] = useState('')
  const [jdText, setJdText] = useState('')

  const canSubmit = cvText.trim().length > 20 && jdText.trim().length > 20 && !isLoading

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-4xl font-semibold text-paper">{t.upload.heading}</h1>
      <p className="mt-2 text-muted">{t.upload.subheading}</p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <div>
          <label className="font-mono text-xs uppercase tracking-wider text-muted">
            {t.upload.cvLabel}
          </label>
          <textarea
            value={cvText}
            onChange={(e) => setCvText(e.target.value)}
            placeholder={t.upload.cvPlaceholder}
            rows={14}
            className="mt-2 w-full resize-none rounded-md border border-panel-border bg-panel p-4 text-sm text-paper placeholder:text-muted/60 focus:border-accent focus:outline-none"
          />
        </div>
        <div>
          <label className="font-mono text-xs uppercase tracking-wider text-muted">
            {t.upload.jdLabel}
          </label>
          <textarea
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
            placeholder={t.upload.jdPlaceholder}
            rows={14}
            className="mt-2 w-full resize-none rounded-md border border-panel-border bg-panel p-4 text-sm text-paper placeholder:text-muted/60 focus:border-accent focus:outline-none"
          />
        </div>
      </div>

      {error && (
        <p className="mt-4 rounded-md border border-gap/40 bg-gap/10 px-4 py-3 text-sm text-gap">
          {error}
        </p>
      )}

      <button
        onClick={() => onSubmit(cvText, jdText)}
        disabled={!canSubmit}
        className="mt-6 rounded-md bg-accent px-6 py-3 font-mono text-sm uppercase tracking-wider text-ink transition-opacity disabled:cursor-not-allowed disabled:opacity-30 enabled:hover:opacity-90"
      >
        {isLoading ? t.upload.submitLoading : submitLabel || t.upload.submitIdle}
      </button>
    </div>
  )
}

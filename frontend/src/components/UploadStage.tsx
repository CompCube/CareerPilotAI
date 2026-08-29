import { useRef, useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import { extractPdfText, ApiError } from '../api'

type Props = {
  onSubmit: (cvText: string, jdText: string) => void
  onQuickTailor?: (cvText: string, jdText: string) => void
  isLoading: boolean
  error: string | null
  submitLabel?: string
  baseCvText?: string | null
}

function PdfUploadButton({
  onExtracted,
  onError,
}: {
  onExtracted: (text: string) => void
  onError: (message: string) => void
}) {
  const { t } = useLanguage()
  const inputRef = useRef<HTMLInputElement>(null)
  const [isExtracting, setIsExtracting] = useState(false)

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setIsExtracting(true)
    try {
      const text = await extractPdfText(file)
      onExtracted(text)
    } catch (err) {
      onError(err instanceof ApiError ? err.message : t.errors.generic)
    } finally {
      setIsExtracting(false)
      e.target.value = '' // permet re-pujar el mateix fitxer si cal
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        onChange={handleFileSelect}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isExtracting}
        className="flex items-center gap-1.5 rounded-full border border-accent/50 bg-accent/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-accent transition-colors hover:border-accent hover:bg-accent/20 disabled:opacity-50"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        {isExtracting ? t.upload.extracting : t.upload.orUploadPdf}
      </button>
    </>
  )
}

export function UploadStage({ onSubmit, onQuickTailor, isLoading, error, submitLabel, baseCvText }: Props) {
  const { t } = useLanguage()
  const [cvText, setCvText] = useState('')
  const [jdText, setJdText] = useState('')
  const [pdfError, setPdfError] = useState<string | null>(null)
  const [useBaseCv, setUseBaseCv] = useState(false)

  const canSubmit = cvText.trim().length > 20 && jdText.trim().length > 20 && !isLoading

  function handleToggleBaseCv(checked: boolean) {
    setUseBaseCv(checked)
    if (checked && baseCvText) setCvText(baseCvText)
  }

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="font-display text-4xl font-semibold text-paper">{t.upload.heading}</h1>
      <p className="mt-2 text-muted">{t.upload.subheading}</p>

      {baseCvText && (
        <label className="mt-4 flex w-fit items-center gap-2 text-sm text-paper">
          <input
            type="checkbox"
            checked={useBaseCv}
            onChange={(e) => handleToggleBaseCv(e.target.checked)}
            className="h-4 w-4 accent-accent"
          />
          {t.auth.useBaseCv}
        </label>
      )}

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <div>
          <div className="flex items-center justify-between">
            <label className="font-mono text-xs uppercase tracking-wider text-muted">
              {t.upload.cvLabel}
            </label>
            <PdfUploadButton onExtracted={setCvText} onError={setPdfError} />
          </div>
          <textarea
            value={cvText}
            onChange={(e) => setCvText(e.target.value)}
            placeholder={t.upload.cvPlaceholder}
            rows={14}
            className="mt-2 w-full resize-none rounded-md border border-panel-border bg-panel p-4 text-sm text-paper placeholder:text-muted/60 focus:border-accent focus:outline-none"
          />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label className="font-mono text-xs uppercase tracking-wider text-muted">
              {t.upload.jdLabel}
            </label>
            <PdfUploadButton onExtracted={setJdText} onError={setPdfError} />
          </div>
          <textarea
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
            placeholder={t.upload.jdPlaceholder}
            rows={14}
            className="mt-2 w-full resize-none rounded-md border border-panel-border bg-panel p-4 text-sm text-paper placeholder:text-muted/60 focus:border-accent focus:outline-none"
          />
        </div>
      </div>

      {(error || pdfError) && (
        <p className="mt-4 rounded-md border border-gap/40 bg-gap/10 px-4 py-3 text-sm text-gap">
          {error || pdfError}
        </p>
      )}

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          onClick={() => onSubmit(cvText, jdText)}
          disabled={!canSubmit}
          className="rounded-md bg-accent px-6 py-3 font-mono text-sm uppercase tracking-wider text-ink transition-opacity disabled:cursor-not-allowed disabled:opacity-30 enabled:hover:opacity-90"
        >
          {isLoading ? t.upload.submitLoading : submitLabel || t.upload.submitIdle}
        </button>
        {onQuickTailor && (
          <button
            onClick={() => onQuickTailor(cvText, jdText)}
            disabled={!canSubmit}
            className="rounded-md border border-accent px-6 py-3 font-mono text-sm uppercase tracking-wider text-accent transition-colors disabled:cursor-not-allowed disabled:opacity-30 enabled:hover:bg-accent/10"
          >
            {t.upload.quickTailor}
          </button>
        )}
      </div>
    </div>
  )
}

import { useRef, useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import { extractPdfText, ApiError } from '../api'

type Props = {
  onSubmit: (cvText: string, jdText: string) => void
  isLoading: boolean
  error: string | null
  submitLabel?: string
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
        className="font-mono text-[10px] uppercase tracking-wider text-accent underline decoration-dotted underline-offset-2 hover:text-paper disabled:opacity-50"
      >
        {isExtracting ? t.upload.extracting : t.upload.orUploadPdf}
      </button>
    </>
  )
}

export function UploadStage({ onSubmit, isLoading, error, submitLabel }: Props) {
  const { t } = useLanguage()
  const [cvText, setCvText] = useState('')
  const [jdText, setJdText] = useState('')
  const [pdfError, setPdfError] = useState<string | null>(null)

  const canSubmit = cvText.trim().length > 20 && jdText.trim().length > 20 && !isLoading

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-4xl font-semibold text-paper">{t.upload.heading}</h1>
      <p className="mt-2 text-muted">{t.upload.subheading}</p>

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

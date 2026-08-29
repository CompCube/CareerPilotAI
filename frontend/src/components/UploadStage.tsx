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
  lastApplication?: { cvText: string; jdText: string } | null
}

function UploadIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

function TogglePill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-wider transition-colors ${
        active ? 'border-accent bg-accent/10 text-accent' : 'border-panel-border text-muted hover:border-muted'
      }`}
    >
      <span className={`flex h-3 w-3 items-center justify-center rounded-full border ${active ? 'border-accent bg-accent' : 'border-panel-border'}`}>
        {active && (
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="var(--color-ink)" strokeWidth="4">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        )}
      </span>
      {children}
    </button>
  )
}

/**
 * Camp de text amb dos modes: escriure/enganxar text pla, o pujar un PDF.
 * Quan es puja un PDF, NO es bolca tot el text transcrit a la vista --
 * nomes es mostra el nom del fitxer com a confirmacio (el text s'usa
 * igualment per sota, nomes no s'ensenya en cru).
 */
function ResumeField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  const { t } = useLanguage()
  const inputRef = useRef<HTMLInputElement>(null)
  const [isExtracting, setIsExtracting] = useState(false)
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null)
  const [pdfError, setPdfError] = useState<string | null>(null)

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setIsExtracting(true)
    setPdfError(null)
    try {
      const text = await extractPdfText(file)
      onChange(text)
      setUploadedFileName(file.name)
    } catch (err) {
      setPdfError(err instanceof ApiError ? err.message : t.errors.generic)
    } finally {
      setIsExtracting(false)
      e.target.value = ''
    }
  }

  function clearUpload() {
    setUploadedFileName(null)
    onChange('')
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="font-mono text-xs uppercase tracking-wider text-muted">{label}</label>
        <input ref={inputRef} type="file" accept="application/pdf" onChange={handleFileSelect} className="hidden" />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isExtracting}
          className="flex items-center gap-1.5 rounded-full border border-accent/50 bg-accent/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-accent transition-colors hover:border-accent hover:bg-accent/20 disabled:opacity-50"
        >
          <UploadIcon />
          {isExtracting ? t.upload.extracting : t.upload.orUploadPdf}
        </button>
      </div>

      {uploadedFileName ? (
        <div className="mt-2 flex items-center justify-between rounded-md border border-match/40 bg-match/10 px-4 py-3">
          <span className="flex items-center gap-2 text-sm text-match">
            <CheckIcon />
            {uploadedFileName}
          </span>
          <button onClick={clearUpload} className="font-mono text-[10px] uppercase tracking-wider text-muted transition-colors hover:text-accent">
            {t.upload.removeFile}
          </button>
        </div>
      ) : (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={14}
          className="mt-2 w-full resize-none rounded-md border border-panel-border bg-panel p-4 text-sm text-paper placeholder:text-muted/60 focus:border-accent focus:outline-none"
        />
      )}
      {pdfError && <p className="mt-1 text-xs text-gap">{pdfError}</p>}
    </div>
  )
}

export function UploadStage({
  onSubmit,
  onQuickTailor,
  isLoading,
  error,
  submitLabel,
  baseCvText,
  lastApplication,
}: Props) {
  const { t } = useLanguage()
  const [cvText, setCvText] = useState('')
  const [jdText, setJdText] = useState('')
  const [useBaseCv, setUseBaseCv] = useState(false)
  const [useLastApplication, setUseLastApplication] = useState(false)

  const canSubmit = cvText.trim().length > 20 && jdText.trim().length > 20 && !isLoading

  function handleToggleBaseCv() {
    const next = !useBaseCv
    setUseBaseCv(next)
    setUseLastApplication(false)
    setCvText(next && baseCvText ? baseCvText : '')
  }

  function handleToggleLastApplication() {
    const next = !useLastApplication
    setUseLastApplication(next)
    setUseBaseCv(false)
    if (next && lastApplication) {
      setCvText(lastApplication.cvText)
      setJdText(lastApplication.jdText)
    } else if (!next) {
      setCvText('')
      setJdText('')
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="font-display text-4xl font-semibold text-paper">{t.upload.heading}</h1>
      <p className="mt-2 text-muted">{t.upload.subheading}</p>

      {(baseCvText || lastApplication) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {baseCvText && (
            <TogglePill active={useBaseCv} onClick={handleToggleBaseCv}>
              {t.auth.useBaseCv}
            </TogglePill>
          )}
          {lastApplication && (
            <TogglePill active={useLastApplication} onClick={handleToggleLastApplication}>
              {t.auth.useLastApplication}
            </TogglePill>
          )}
        </div>
      )}

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <ResumeField label={t.upload.cvLabel} value={cvText} onChange={setCvText} placeholder={t.upload.cvPlaceholder} />
        <ResumeField label={t.upload.jdLabel} value={jdText} onChange={setJdText} placeholder={t.upload.jdPlaceholder} />
      </div>

      {error && (
        <p className="mt-4 rounded-md border border-gap/40 bg-gap/10 px-4 py-3 text-sm text-gap">{error}</p>
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

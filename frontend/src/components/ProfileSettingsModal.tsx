import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import { getProfile, updateProfile, extractPdfText, ApiError } from '../api'

function UploadIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  )
}

export function ProfileSettingsModal({
  token,
  email,
  name,
  onClose,
  onSaved,
}: {
  token: string
  email: string
  name: string | null
  onClose: () => void
  onSaved: (cvText: string) => void
}) {
  const { t } = useLanguage()
  const [cvText, setCvText] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isExtracting, setIsExtracting] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getProfile(token)
      .then((p) => setCvText(p.base_cv_text || ''))
      .catch((err) => setError(err instanceof ApiError ? err.message : t.errors.generic))
      .finally(() => setIsLoading(false))
  }, [token, t.errors.generic])

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setIsExtracting(true)
    setError(null)
    try {
      const text = await extractPdfText(file)
      setCvText(text)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t.errors.generic)
    } finally {
      setIsExtracting(false)
      e.target.value = ''
    }
  }

  async function handleSave() {
    setIsSaving(true)
    setError(null)
    try {
      await updateProfile(token, cvText)
      onSaved(cvText)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t.errors.generic)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-6" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-panel-border bg-panel p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-paper">{t.auth.profileSettings}</h2>
          <button onClick={onClose} className="text-muted transition-colors hover:text-accent" aria-label="Close">
            ✕
          </button>
        </div>

        <div className="mt-4 space-y-1 font-mono text-xs text-muted">
          <p>{name || t.auth.noName}</p>
          <p>{email}</p>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between">
            <label className="font-mono text-xs uppercase tracking-wider text-accent">{t.auth.baseCvLabel}</label>
            <input ref={fileInputRef} type="file" accept="application/pdf" onChange={handleFileSelect} className="hidden" />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isExtracting}
              className="flex items-center gap-1.5 rounded-full border border-accent/50 bg-accent/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-accent transition-colors hover:border-accent hover:bg-accent/20 disabled:opacity-50"
            >
              <UploadIcon />
              {isExtracting ? t.upload.extracting : t.upload.orUploadPdf}
            </button>
          </div>
          <p className="mt-1 text-xs text-muted">{t.auth.baseCvHint}</p>
          {isLoading ? (
            <p className="mt-3 text-sm text-muted">{t.upload.submitLoading}</p>
          ) : (
            <textarea
              value={cvText}
              onChange={(e) => setCvText(e.target.value)}
              placeholder={t.upload.cvPlaceholder}
              rows={12}
              className="mt-2 w-full resize-none rounded-md border border-panel-border bg-ink p-4 text-sm text-paper placeholder:text-muted/60 focus:border-accent focus:outline-none"
            />
          )}
        </div>

        {error && (
          <p className="mt-3 rounded-md border border-gap/40 bg-gap/10 px-4 py-2 text-sm text-gap">{error}</p>
        )}

        <button
          onClick={handleSave}
          disabled={isSaving || isLoading}
          className="mt-4 rounded-md bg-accent px-6 py-2.5 font-mono text-sm uppercase tracking-wider text-ink transition-opacity disabled:opacity-40 enabled:hover:opacity-90"
        >
          {saved ? t.auth.saved : isSaving ? t.auth.saving : t.auth.saveCv}
        </button>
      </div>
    </div>
  )
}

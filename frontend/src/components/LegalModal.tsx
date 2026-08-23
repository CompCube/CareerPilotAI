import { useLanguage } from '../i18n/LanguageContext'

type LegalModalProps = {
  kind: 'privacy' | 'terms'
  onClose: () => void
}

export function LegalModal({ kind, onClose }: LegalModalProps) {
  const { t } = useLanguage()
  const content = kind === 'privacy' ? t.legal.privacy : t.legal.terms

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-6"
      onClick={onClose}
    >
      <div
        className="max-h-[80vh] w-full max-w-xl overflow-y-auto rounded-lg border border-panel-border bg-panel p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-paper">{content.title}</h2>
          <button
            onClick={onClose}
            className="text-muted transition-colors hover:text-accent"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="mt-4 space-y-3 text-sm leading-relaxed text-paper">
          {content.paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </div>
    </div>
  )
}

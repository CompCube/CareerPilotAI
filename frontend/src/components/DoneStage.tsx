import { useLanguage } from '../i18n/LanguageContext'

export function DoneStage({ onPracticeInterview }: { onPracticeInterview: () => void }) {
  const { t } = useLanguage()

  return (
    <div className="mx-auto max-w-2xl">
      <div className="inline-block rounded-full border border-match/40 bg-match/10 px-4 py-1 font-mono text-[10px] uppercase tracking-wider text-match">
        {t.done.badge}
      </div>
      <h1 className="mt-4 font-display text-4xl font-semibold text-paper">{t.done.heading}</h1>
      <p className="mt-3 text-muted">{t.done.subheading}</p>

      <div className="mt-10 rounded-lg border border-panel-border bg-panel p-6">
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

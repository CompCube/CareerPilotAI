import { useLanguage } from '../i18n/LanguageContext'

export type AppMode = 'apply' | 'interview_practice'

export function ModeSelect({ onSelect }: { onSelect: (mode: AppMode) => void }) {
  const { t } = useLanguage()

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-display text-4xl font-semibold text-paper">{t.appName}</h1>
      <p className="mt-2 text-muted">{t.mode.subheading}</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <button
          onClick={() => onSelect('apply')}
          className="group rounded-lg border border-panel-border bg-panel p-6 text-left transition-colors hover:border-accent"
        >
          <p className="font-mono text-[10px] uppercase tracking-wider text-accent">
            {t.mode.applyEyebrow}
          </p>
          <p className="mt-2 font-display text-xl font-semibold text-paper">
            {t.mode.applyTitle}
          </p>
          <p className="mt-2 text-sm text-muted">{t.mode.applyDesc}</p>
        </button>

        <button
          onClick={() => onSelect('interview_practice')}
          className="group rounded-lg border border-panel-border bg-panel p-6 text-left transition-colors hover:border-accent"
        >
          <p className="font-mono text-[10px] uppercase tracking-wider text-accent">
            {t.mode.interviewEyebrow}
          </p>
          <p className="mt-2 font-display text-xl font-semibold text-paper">
            {t.mode.interviewTitle}
          </p>
          <p className="mt-2 text-sm text-muted">{t.mode.interviewDesc}</p>
        </button>
      </div>
    </div>
  )
}

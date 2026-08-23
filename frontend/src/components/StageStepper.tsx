import { useLanguage } from '../i18n/LanguageContext'

export type Stage = 'mode' | 'upload' | 'analysis' | 'tailor' | 'done' | 'interview'

const APPLY_KEYS: Stage[] = ['upload', 'analysis', 'tailor', 'done']
const INTERVIEW_KEYS: Stage[] = ['upload', 'interview']

const STAGE_LABEL_KEY: Record<Stage, string> = {
  mode: '',
  upload: 'Case file',
  analysis: 'Analysis',
  tailor: 'Tailor',
  done: 'Ready',
  interview: 'Interview',
}

// Etiquetes curtes -- no calen totes al diccionari complet de traduccions,
// nomes es fan servir aqui i son prou petites per mantenir-les simples.
const LABELS: Record<'en' | 'es', Record<Stage, string>> = {
  en: STAGE_LABEL_KEY,
  es: {
    mode: '',
    upload: 'Expediente',
    analysis: 'Análisis',
    tailor: 'Retoque',
    done: 'Listo',
    interview: 'Entrevista',
  },
}

export function StageStepper({
  current,
  mode,
  reachable,
  onNavigate,
}: {
  current: Stage
  mode: 'apply' | 'interview_practice' | null
  reachable: Stage[]
  onNavigate: (stage: Stage) => void
}) {
  const { lang } = useLanguage()
  if (!mode) return null

  const keys = mode === 'apply' ? APPLY_KEYS : INTERVIEW_KEYS
  const labels = LABELS[lang]
  const currentIndex = keys.findIndex((k) => k === current)

  return (
    <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-wider">
      {keys.map((key, index) => {
        const isDone = index < currentIndex
        const isCurrent = index === currentIndex
        const isReachable = reachable.includes(key) && !isCurrent
        return (
          <div key={key} className="flex items-center gap-2">
            {isReachable ? (
              <button
                onClick={() => onNavigate(key)}
                className={`transition-colors hover:text-accent ${isDone ? 'text-muted' : 'text-panel-border'}`}
              >
                {String(index + 1).padStart(2, '0')} {labels[key]}
              </button>
            ) : (
              <span
                className={
                  isCurrent ? 'text-accent' : isDone ? 'text-muted' : 'text-panel-border'
                }
              >
                {String(index + 1).padStart(2, '0')} {labels[key]}
              </span>
            )}
            {index < keys.length - 1 && <span className="text-panel-border">/</span>}
          </div>
        )
      })}
    </div>
  )
}

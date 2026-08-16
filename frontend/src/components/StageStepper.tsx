type Stage = 'upload' | 'analysis' | 'tailor' | 'interview'

const STAGES: { key: Stage; label: string }[] = [
  { key: 'upload', label: 'Expedient' },
  { key: 'analysis', label: 'Anàlisi' },
  { key: 'tailor', label: 'Retoc' },
  { key: 'interview', label: 'Entrevista' },
]

export function StageStepper({ current }: { current: Stage }) {
  const currentIndex = STAGES.findIndex((s) => s.key === current)

  return (
    <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider">
      {STAGES.map((stage, index) => {
        const isDone = index < currentIndex
        const isCurrent = index === currentIndex
        return (
          <div key={stage.key} className="flex items-center gap-2">
            <span
              className={
                isCurrent
                  ? 'text-accent'
                  : isDone
                    ? 'text-muted'
                    : 'text-panel-border'
              }
            >
              {String(index + 1).padStart(2, '0')} {stage.label}
            </span>
            {index < STAGES.length - 1 && <span className="text-panel-border">/</span>}
          </div>
        )
      })}
    </div>
  )
}

export type { Stage }

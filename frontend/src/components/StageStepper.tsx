export type Stage = 'mode' | 'upload' | 'analysis' | 'tailor' | 'done' | 'interview'

const APPLY_STAGES: { key: Stage; label: string }[] = [
  { key: 'upload', label: 'Expedient' },
  { key: 'analysis', label: 'Anàlisi' },
  { key: 'tailor', label: 'Retoc' },
  { key: 'done', label: 'Llest' },
]

const INTERVIEW_STAGES: { key: Stage; label: string }[] = [
  { key: 'upload', label: 'Expedient' },
  { key: 'interview', label: 'Entrevista' },
]

export function StageStepper({
  current,
  mode,
}: {
  current: Stage
  mode: 'apply' | 'interview_practice' | null
}) {
  if (!mode) return null

  const stages = mode === 'apply' ? APPLY_STAGES : INTERVIEW_STAGES
  const currentIndex = stages.findIndex((s) => s.key === current)

  return (
    <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider">
      {stages.map((stage, index) => {
        const isDone = index < currentIndex
        const isCurrent = index === currentIndex
        return (
          <div key={stage.key} className="flex items-center gap-2">
            <span
              className={
                isCurrent ? 'text-accent' : isDone ? 'text-muted' : 'text-panel-border'
              }
            >
              {String(index + 1).padStart(2, '0')} {stage.label}
            </span>
            {index < stages.length - 1 && <span className="text-panel-border">/</span>}
          </div>
        )
      })}
    </div>
  )
}

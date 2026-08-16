export type AppMode = 'apply' | 'interview_practice'

export function ModeSelect({ onSelect }: { onSelect: (mode: AppMode) => void }) {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-4xl font-semibold text-paper">CareerPilot AI</h1>
      <p className="mt-2 text-muted">Què necessites avui?</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <button
          onClick={() => onSelect('apply')}
          className="group rounded-lg border border-panel-border bg-panel p-6 text-left transition-colors hover:border-accent"
        >
          <p className="font-mono text-[10px] uppercase tracking-wider text-accent">
            Abans de postular
          </p>
          <p className="mt-2 font-display text-xl font-semibold text-paper">
            Prepara la candidatura
          </p>
          <p className="mt-2 text-sm text-muted">
            Analitza el fit amb l'oferta i retoca el CV amb les paraules clau correctes.
          </p>
        </button>

        <button
          onClick={() => onSelect('interview_practice')}
          className="group rounded-lg border border-panel-border bg-panel p-6 text-left transition-colors hover:border-accent"
        >
          <p className="font-mono text-[10px] uppercase tracking-wider text-accent">
            Ja tens l'entrevista concertada
          </p>
          <p className="mt-2 font-display text-xl font-semibold text-paper">
            Practica l'entrevista
          </p>
          <p className="mt-2 text-sm text-muted">
            Simula l'entrevista amb preguntes reals basades en la teva oferta i el teu CV.
          </p>
        </button>
      </div>
    </div>
  )
}

export function DoneStage({ onPracticeInterview }: { onPracticeInterview: () => void }) {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-full border border-match/40 bg-match/10 px-4 py-1 font-mono text-[10px] uppercase tracking-wider text-match inline-block">
        Candidatura llesta
      </div>
      <h1 className="mt-4 font-display text-4xl font-semibold text-paper">
        Ja pots postular
      </h1>
      <p className="mt-3 text-muted">
        Tens l'anàlisi de fit i el CV retocat. No cal fer res més ara.
      </p>

      <div className="mt-10 rounded-lg border border-panel-border bg-panel p-6">
        <p className="text-sm text-paper">
          Si més endavant t'acaben trucant per a una entrevista, torna aquí i activa la
          pràctica — no cal fer-ho ara.
        </p>
        <button
          onClick={onPracticeInterview}
          className="mt-4 rounded-md border border-accent px-5 py-2.5 font-mono text-xs uppercase tracking-wider text-accent transition-colors hover:bg-accent/10"
        >
          M'han trucat per l'entrevista → Practica ara
        </button>
      </div>
    </div>
  )
}

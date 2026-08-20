import { useEffect, useState } from 'react'
import {
  analyze,
  continueInterview,
  continueTailor,
  startInterview,
  startTailor,
  ApiError,
  type AnalyzeResponse,
  type InterviewMode,
  type InterviewResponse,
  type TailorResponse,
} from './api'
import { StageStepper, type Stage } from './components/StageStepper'
import { ModeSelect, type AppMode } from './components/ModeSelect'
import { UploadStage } from './components/UploadStage'
import { AnalysisStage } from './components/AnalysisStage'
import { TailorStage, type TailorTurn } from './components/TailorStage'
import { DoneStage } from './components/DoneStage'
import { InterviewStage } from './components/InterviewStage'
import { useLanguage } from './i18n/LanguageContext'
import type { Language } from './i18n/translations'

type InterviewTurn = { question: string; answer: string | null }

function App() {
  const { t, lang, setLang } = useLanguage()

  const [mode, setMode] = useState<AppMode | null>(null)
  const [stage, setStage] = useState<Stage>('mode')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [cvText, setCvText] = useState('')
  const [jdText, setJdText] = useState('')
  const [analysis, setAnalysis] = useState<AnalyzeResponse | null>(null)
  const [tailorState, setTailorState] = useState<TailorResponse | null>(null)
  const [tailorHistory, setTailorHistory] = useState<TailorTurn[]>([])
  const [interviewMode, setInterviewMode] = useState<InterviewMode>('mixed')
  const [interviewState, setInterviewState] = useState<InterviewResponse | null>(null)
  const [interviewHistory, setInterviewHistory] = useState<InterviewTurn[]>([])

  function resetToMenu() {
    // Reset complet -- sense memoria entre sessions per disseny (v0.1),
    // aixi que tornar al menu vol dir començar de zero conscientment.
    setMode(null)
    setStage('mode')
    setCvText('')
    setJdText('')
    setAnalysis(null)
    setTailorState(null)
    setTailorHistory([])
    setInterviewState(null)
    setInterviewHistory([])
    setError(null)
  }

  // El boto "enrere" del navegador fa el mateix que el logo: torna sempre
  // al menu principal (no pas-a-pas per etapa). Nomes cal UN pushState en
  // sortir del menu -- mentre es navega dins de l'app no n'afegim mes,
  // aixi que "enrere" sempre aterra en aquest unic punt marcat.
  useEffect(() => {
    function handlePopState() {
      resetToMenu()
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  function handleModeSelect(selected: AppMode) {
    window.history.pushState({ inApp: true }, '')
    setMode(selected)
    setStage('upload')
  }

  async function handleAnalyze(cv: string, jd: string) {
    setIsLoading(true)
    setError(null)
    try {
      setCvText(cv)
      setJdText(jd)
      const result = await analyze(cv, jd)
      setAnalysis(result)
      setStage('analysis')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t.errors.generic)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleStartTailor() {
    if (!analysis) return
    setIsLoading(true)
    setError(null)
    try {
      const result = await startTailor(cvText, jdText, analysis)
      setTailorState(result)
      setTailorHistory([{ agentMessage: result.agent_message, userReply: null }])
      setStage('tailor')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t.errors.generic)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleTailorAnswer(message: string) {
    if (!tailorState) return
    setIsLoading(true)
    setError(null)
    setTailorHistory((prev) =>
      prev.map((turn, i) => (i === prev.length - 1 ? { ...turn, userReply: message } : turn)),
    )
    try {
      const result = await continueTailor(tailorState.session_id, message)
      setTailorState(result)
      setTailorHistory((prev) => [...prev, { agentMessage: result.agent_message, userReply: null }])
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t.errors.generic)
    } finally {
      setIsLoading(false)
    }
  }

  function goToInterview() {
    setStage('interview')
  }

  async function handleStartInterview() {
    setIsLoading(true)
    setError(null)
    try {
      const result = await startInterview(cvText, jdText, interviewMode)
      setInterviewState(result)
      setInterviewHistory([{ question: result.question, answer: null }])
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t.errors.generic)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleInterviewAnswer(userAnswer: string) {
    if (!interviewState) return
    setIsLoading(true)
    setError(null)
    setInterviewHistory((prev) =>
      prev.map((turn, i) => (i === prev.length - 1 ? { ...turn, answer: userAnswer } : turn)),
    )
    try {
      const result = await continueInterview(interviewState.session_id, userAnswer)
      setInterviewState(result)
      if (!result.done) {
        setInterviewHistory((prev) => [...prev, { question: result.question, answer: null }])
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t.errors.generic)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-ink px-6 py-10">
      <div className="mx-auto mb-4 flex max-w-5xl items-center justify-between">
        <button
          onClick={resetToMenu}
          className="font-display text-lg font-semibold text-paper transition-opacity hover:opacity-80"
        >
          {t.appName}
        </button>
        <div className="flex items-center gap-4">
          <StageStepper current={stage} mode={mode} />
          <div className="flex overflow-hidden rounded-full border border-panel-border font-mono text-[10px] uppercase tracking-wider">
            {(['en', 'es'] as Language[]).map((code) => (
              <button
                key={code}
                onClick={() => setLang(code)}
                className={`px-2.5 py-1 transition-colors ${
                  lang === code ? 'bg-accent text-ink' : 'text-muted hover:text-paper'
                }`}
              >
                {code.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {stage !== 'mode' && (
        <div className="mx-auto mb-6 max-w-5xl">
          <button
            onClick={resetToMenu}
            className="font-mono text-xs uppercase tracking-wider text-muted transition-colors hover:text-accent"
          >
            {t.backToMenu}
          </button>
        </div>
      )}

      {stage === 'mode' && <ModeSelect onSelect={handleModeSelect} />}

      {stage === 'upload' && mode === 'apply' && (
        <UploadStage onSubmit={handleAnalyze} isLoading={isLoading} error={error} />
      )}

      {stage === 'upload' && mode === 'interview_practice' && (
        <UploadStage
          onSubmit={(cv, jd) => {
            setCvText(cv)
            setJdText(jd)
            setStage('interview')
          }}
          isLoading={false}
          error={error}
          submitLabel={t.upload.submitInterview}
        />
      )}

      {stage === 'analysis' && analysis && (
        <AnalysisStage analysis={analysis} onContinue={handleStartTailor} />
      )}

      {stage === 'tailor' && tailorState && (
        <TailorStage
          history={tailorHistory}
          tailorState={tailorState}
          onAnswer={handleTailorAnswer}
          onComplete={() => setStage('done')}
          isLoading={isLoading}
        />
      )}

      {stage === 'done' && tailorState && (
        <DoneStage sections={tailorState.sections} onPracticeInterview={goToInterview} />
      )}

      {stage === 'interview' && (
        <InterviewStage
          mode={interviewMode}
          onModeChange={setInterviewMode}
          onStart={handleStartInterview}
          interviewState={interviewState}
          history={interviewHistory}
          onAnswer={handleInterviewAnswer}
          isLoading={isLoading}
        />
      )}
    </div>
  )
}

export default App

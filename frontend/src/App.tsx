import { useState } from 'react'
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
import { TailorStage } from './components/TailorStage'
import { DoneStage } from './components/DoneStage'
import { InterviewStage } from './components/InterviewStage'

type InterviewTurn = { question: string; answer: string | null }

function App() {
  const [mode, setMode] = useState<AppMode | null>(null)
  const [stage, setStage] = useState<Stage>('mode')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [cvText, setCvText] = useState('')
  const [jdText, setJdText] = useState('')
  const [analysis, setAnalysis] = useState<AnalyzeResponse | null>(null)
  const [tailorState, setTailorState] = useState<TailorResponse | null>(null)
  const [interviewMode, setInterviewMode] = useState<InterviewMode>('mixed')
  const [interviewState, setInterviewState] = useState<InterviewResponse | null>(null)
  const [interviewHistory, setInterviewHistory] = useState<InterviewTurn[]>([])

  function handleModeSelect(selected: AppMode) {
    setMode(selected)
    setStage('upload')
  }

  // Camí "apply": Upload -> Analysis -> Tailor -> Done
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
      setError(err instanceof ApiError ? err.message : "No s'ha pogut connectar amb el servidor.")
    } finally {
      setIsLoading(false)
    }
  }

  async function handleStartTailor() {
    setIsLoading(true)
    setError(null)
    try {
      const result = await startTailor(cvText, analysis)
      setTailorState(result)
      setStage('tailor')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No s'ha pogut connectar amb el servidor.")
    } finally {
      setIsLoading(false)
    }
  }

  async function handleTailorAnswer(message: string) {
    if (!tailorState) return
    setIsLoading(true)
    setError(null)
    try {
      const result = await continueTailor(tailorState.session_id, message)
      setTailorState(result)
      if (result.status === 'complete') setStage('done')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No s'ha pogut connectar amb el servidor.")
    } finally {
      setIsLoading(false)
    }
  }

  // Camí "interview_practice": Upload -> Interview directament
  // (i tambe accessible des de DoneStage, per si l'usuari fa el camí "apply"
  // primer i decideix mes endavant que li han trucat per l'entrevista)
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
      setError(err instanceof ApiError ? err.message : "No s'ha pogut connectar amb el servidor.")
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
      setError(err instanceof ApiError ? err.message : "No s'ha pogut connectar amb el servidor.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-ink px-6 py-10">
      <div className="mx-auto mb-10 flex max-w-3xl items-center justify-between">
        <span className="font-display text-lg font-semibold text-paper">CareerPilot AI</span>
        <StageStepper current={stage} mode={mode} />
      </div>

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
        />
      )}

      {stage === 'analysis' && analysis && (
        <AnalysisStage analysis={analysis} onContinue={handleStartTailor} />
      )}

      {stage === 'tailor' && tailorState && (
        <TailorStage
          tailorState={tailorState}
          onAnswer={handleTailorAnswer}
          onComplete={() => setStage('done')}
          isLoading={isLoading}
        />
      )}

      {stage === 'done' && <DoneStage onPracticeInterview={goToInterview} />}

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

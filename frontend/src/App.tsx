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
import { UploadStage } from './components/UploadStage'
import { AnalysisStage } from './components/AnalysisStage'
import { TailorStage } from './components/TailorStage'
import { InterviewStage } from './components/InterviewStage'

type InterviewTurn = { question: string; answer: string | null }

function App() {
  const [stage, setStage] = useState<Stage>('upload')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Dades compartides entre etapes -- el "context" que cada pas necessita
  const [cvText, setCvText] = useState('')
  const [jdText, setJdText] = useState('')
  const [analysis, setAnalysis] = useState<AnalyzeResponse | null>(null)
  const [tailorState, setTailorState] = useState<TailorResponse | null>(null)
  const [interviewMode, setInterviewMode] = useState<InterviewMode>('mixed')
  const [interviewState, setInterviewState] = useState<InterviewResponse | null>(null)
  const [interviewHistory, setInterviewHistory] = useState<InterviewTurn[]>([])

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
      setError(err instanceof ApiError ? err.message : 'No s\'ha pogut connectar amb el servidor.')
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
      setError(err instanceof ApiError ? err.message : 'No s\'ha pogut connectar amb el servidor.')
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
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No s\'ha pogut connectar amb el servidor.')
    } finally {
      setIsLoading(false)
    }
  }

  function handleGoToInterview() {
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
      setError(err instanceof ApiError ? err.message : 'No s\'ha pogut connectar amb el servidor.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleInterviewAnswer(userAnswer: string) {
    if (!interviewState) return
    setIsLoading(true)
    setError(null)
    // Registrem la resposta a la pregunta actual abans de demanar la seguent
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
      setError(err instanceof ApiError ? err.message : 'No s\'ha pogut connectar amb el servidor.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-ink px-6 py-10">
      <div className="mx-auto mb-10 flex max-w-3xl items-center justify-between">
        <span className="font-display text-lg font-semibold text-paper">CareerPilot AI</span>
        <StageStepper current={stage} />
      </div>

      {stage === 'upload' && (
        <UploadStage onSubmit={handleAnalyze} isLoading={isLoading} error={error} />
      )}

      {stage === 'analysis' && analysis && (
        <AnalysisStage analysis={analysis} onContinue={handleStartTailor} />
      )}

      {stage === 'tailor' && tailorState && (
        <TailorStage
          tailorState={tailorState}
          onAnswer={handleTailorAnswer}
          onContinueToInterview={handleGoToInterview}
          isLoading={isLoading}
        />
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

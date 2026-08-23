// Unica capa que parla amb el backend. Cap component en sap res mes
// enlla d'importar aquestes funcions -- mateix principi que
// backend/app/services/llm_service.py.

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const detail = await response.json().catch(() => ({ detail: 'Error desconegut' }))
    throw new ApiError(detail.detail || `Error ${response.status}`, response.status)
  }

  return response.json()
}

// --- Tipus (han d'encaixar amb els schemas Pydantic del backend) ---

export type CompetencyMatch = {
  competency: string
  priority: number
  type: 'screening' | 'differentiating'
  match_status: 'match' | 'partial' | 'gap'
  evidence: string
}

export type AnalyzeResponse = {
  role_summary: string
  ideal_candidate_profile: string
  company_profile: string
  competencies: CompetencyMatch[]
  fit_score: number
}

export type ATSIssue = { issue: string; why_it_matters: string; fix: string }

export type TailorPhase = 'extract' | 'interrogate' | 'deepen' | 'assemble' | 'complete'

export type TailorSections = {
  title: string
  subtitle: string
  professional_summary: string
  skills: string
  achievements_label: 'key_achievements' | 'projects' | null
  achievements: string
  professional_experience: string
}

export type TailorResponse = {
  session_id: string
  phase: TailorPhase
  agent_message: string
  top_keywords: string[]
  key_skills: string[]
  ats_score: number | null
  ats_issues: ATSIssue[]
  positioning_reframe: string | null
  section_strategy_note: string | null
  sections: TailorSections
  done: boolean
}

export type InterviewMode = 'recruiter' | 'technical' | 'behavioural' | 'mixed'

export type InterviewResponse = {
  session_id: string
  question: string
  turn_number: number
  done: boolean
}

// --- Crides ---

export async function extractPdfText(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${API_BASE_URL}/extract-pdf`, {
    method: 'POST',
    body: formData, // NO Content-Type manual -- el navegador el posa amb el boundary correcte
  })

  if (!response.ok) {
    const detail = await response.json().catch(() => ({ detail: 'Unknown error' }))
    throw new ApiError(detail.detail || `Error ${response.status}`, response.status)
  }

  const data: { text: string } = await response.json()
  return data.text
}

export function analyze(cvText: string, jdText: string, lang: string): Promise<AnalyzeResponse> {
  return post('/analyze', { cv_text: cvText, jd_text: jdText, language: lang })
}

export function startTailor(
  cvText: string,
  jdText: string,
  analysis: AnalyzeResponse | null,
  lang: string,
  fast: boolean = false,
): Promise<TailorResponse> {
  return post('/tailor', { cv_text: cvText, jd_text: jdText, analysis, language: lang, fast })
}

export function continueTailor(sessionId: string, userMessage: string): Promise<TailorResponse> {
  return post('/tailor', { session_id: sessionId, user_message: userMessage })
}

export function startInterview(
  cvText: string,
  jdText: string,
  mode: InterviewMode,
  lang: string,
): Promise<InterviewResponse> {
  return post('/interview', { cv_text: cvText, jd_text: jdText, mode, language: lang })
}

export function continueInterview(
  sessionId: string,
  userAnswer: string,
): Promise<InterviewResponse> {
  return post('/interview', { session_id: sessionId, user_answer: userAnswer })
}

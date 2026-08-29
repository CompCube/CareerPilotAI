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

export function continueTailor(
  sessionId: string,
  userMessage?: string,
  skipRemaining: boolean = false,
): Promise<TailorResponse> {
  return post('/tailor', { session_id: sessionId, user_message: userMessage, skip_remaining: skipRemaining })
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

// --- Auth ---

export type UserOut = { id: number; email: string; name: string | null }
export type LoginResponse = { access_token: string; user: UserOut }

export function loginWithGoogle(googleIdToken: string): Promise<LoginResponse> {
  return post('/auth/google', { google_id_token: googleIdToken })
}

export async function getMe(token: string): Promise<UserOut> {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) throw new ApiError('Session expired', response.status)
  return response.json()
}

// --- Profile (CV base) i historial de candidatures ---

async function authedFetch(path: string, token: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...options.headers },
  })
  if (!response.ok) {
    const detail = await response.json().catch(() => ({ detail: 'Unknown error' }))
    throw new ApiError(detail.detail || `Error ${response.status}`, response.status)
  }
  return response.json()
}

export type ProfileOut = { base_cv_text: string | null }
export type ApplicationSummary = { id: number; title: string; applied: boolean; created_at: string }
export type ApplicationDetail = ApplicationSummary & {
  jd_text: string
  cv_text_used: string
  analysis: AnalyzeResponse | null
  tailor_sections: TailorSections | null
}

export function getProfile(token: string): Promise<ProfileOut> {
  return authedFetch('/profile', token)
}

export function updateProfile(token: string, baseCvText: string): Promise<ProfileOut> {
  return authedFetch('/profile', token, { method: 'PUT', body: JSON.stringify({ base_cv_text: baseCvText }) })
}

export function createApplication(
  token: string,
  data: {
    title: string
    jd_text: string
    cv_text_used: string
    analysis: AnalyzeResponse | null
    tailor_sections: TailorSections | null
  },
): Promise<ApplicationSummary> {
  return authedFetch('/applications', token, { method: 'POST', body: JSON.stringify(data) })
}

export function listApplications(token: string): Promise<ApplicationSummary[]> {
  return authedFetch('/applications', token)
}

export function getApplication(token: string, id: number): Promise<ApplicationDetail> {
  return authedFetch(`/applications/${id}`, token)
}

export function deleteApplication(token: string, id: number): Promise<{ deleted: boolean }> {
  return authedFetch(`/applications/${id}`, token, { method: 'DELETE' })
}

export function toggleApplied(token: string, id: number): Promise<ApplicationSummary> {
  return authedFetch(`/applications/${id}`, token, { method: 'PATCH' })
}

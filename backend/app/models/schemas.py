"""
Formes de dades: tant les de l'API (request/response HTTP) com les
que esperem que retorni l'LLM (que despres validem amb aquests mateixos
schemas -- vegeu services/structured_output.py).
"""

from typing import Literal

from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# PDF extraction
# ---------------------------------------------------------------------------


class PDFExtractResponse(BaseModel):
    text: str


# ---------------------------------------------------------------------------
# Analyzer
# ---------------------------------------------------------------------------


class AnalyzeRequest(BaseModel):
    cv_text: str = Field(..., min_length=20, description="Text pla del CV")
    jd_text: str = Field(..., min_length=20, description="Text pla de la JD")
    language: Literal["en", "es"] = "en"


class CompetencyMatch(BaseModel):
    competency: str
    priority: int = Field(..., ge=0, description="1 = mes important (0 tambe acceptat per tolerancia)")
    type: Literal["screening", "differentiating"]
    match_status: Literal["match", "partial", "gap"]
    evidence: str = Field(
        ..., description="Evidencia concreta del CV, o 'cap evidencia trobada'"
    )


class AnalyzeResponse(BaseModel):
    role_summary: str = Field(
        ..., description="What this offer is really about, 2-4 sentences"
    )
    ideal_candidate_profile: str = Field(
        ..., description="Who they're really hiring, 3-5 sentences"
    )
    company_profile: str = Field(..., description="Que busca l'empresa, en 2-3 frases")
    competencies: list[CompetencyMatch] = Field(
        ..., min_length=1, description="Mai buit -- una JD real sempre te alguna competencia"
    )
    fit_score: float = Field(..., ge=0, le=100)


# ---------------------------------------------------------------------------
# Resume Tailor (conversacional)
# ---------------------------------------------------------------------------


# ---------------------------------------------------------------------------
# Resume Tailor v2 (conversacional, 4 fases: extract -> interrogate -> deepen -> assemble)
#
# Principi (mateix que l'Interview agent): EL CODI decideix el flux de fases
# (quin requirement toca, quantes preguntes de deepen, quina seccio ve ara),
# el MODEL nomes decideix el contingut de cada resposta. Aixo fa el sistema
# molt mes fiable que deixar que l'LLM s'autogestioni quan "ja n'hi ha prou".
# ---------------------------------------------------------------------------

TailorPhase = Literal["extract", "interrogate", "deepen", "assemble", "complete"]
SectionStrategy = Literal["key_achievements", "projects"]


class TailorRequest(BaseModel):
    session_id: str | None = Field(None, description="Omet per iniciar una sessio nova")
    cv_text: str | None = Field(None, description="Obligatori nomes al primer missatge")
    jd_text: str | None = Field(None, description="Obligatori nomes al primer missatge")
    analysis: AnalyzeResponse | None = Field(
        None, description="Output de l'Analyzer -- dona les competencies a recorrer"
    )
    user_message: str | None = Field(
        None, description="Resposta de l'usuari a una pregunta de l'agent"
    )
    skip_remaining: bool = Field(
        False,
        description="Salta directament a Assemble amb el que ja s'ha contestat fins ara",
    )
    language: Literal["en", "es"] = "en"
    fast: bool = Field(
        False,
        description="Salta Interrogate i Deepen, va directe d'Extract a Assemble",
    )


class ATSIssue(BaseModel):
    issue: str
    why_it_matters: str
    fix: str


class TailorExtractOutput(BaseModel):
    """Sortida esperada de l'LLM a la fase Extract (un sol torn, no conversacional)."""

    top_keywords: list[str] = Field(..., min_length=1, max_length=15)
    key_skills: list[str] = Field(..., min_length=1, max_length=5)
    ats_score: int = Field(..., ge=0, le=100)
    ats_issues: list[ATSIssue] = Field(default_factory=list)


class TailorQuestionOutput(BaseModel):
    """Sortida esperada de l'LLM a les fases Interrogate/Deepen."""

    has_question: bool = Field(
        default=True,
        description="Nomes rellevant a Deepen: false si no cal cap pregunta mes",
    )
    is_clarification: bool = Field(
        default=False,
        description="True si el darrer missatge de l'usuari era un dubte/pregunta, no una resposta real",
    )
    already_covered_by_memory: bool = Field(
        default=False,
        description="True si la memoria del perfil ja dona prou evidencia d'aquesta competencia -- salta-la sense preguntar",
    )
    agent_message: str = Field(default="")


class TailorAssembleStartOutput(BaseModel):
    """Sortida esperada del primer torn de la fase Assemble."""

    positioning_reframe: str
    section_strategy: SectionStrategy
    section_strategy_note: str


class TailorSectionOutput(BaseModel):
    """Sortida esperada de l'LLM per CADA seccio individual dins d'Assemble."""

    status: Literal["section_complete", "needs_info"]
    section_content: str = Field(default="")
    agent_message: str = Field(default="")


class TailorSections(BaseModel):
    """El CV final, organitzat per seccions per fer copy-paste."""

    title: str = ""
    subtitle: str = ""
    professional_summary: str = ""
    skills: str = ""
    achievements_label: SectionStrategy | None = None
    achievements: str = ""
    professional_experience: str = ""


class TailorResponse(BaseModel):
    """Estat acumulat que es retorna a cada torn -- el frontend en fa servir
    tots els camps disponibles per pintar els panells de la dreta, no nomes
    el missatge de xat actual."""

    session_id: str
    phase: TailorPhase
    agent_message: str
    top_keywords: list[str] = Field(default_factory=list)
    key_skills: list[str] = Field(default_factory=list)
    ats_score: int | None = None
    ats_issues: list[ATSIssue] = Field(default_factory=list)
    positioning_reframe: str | None = None
    section_strategy_note: str | None = None
    sections: TailorSections = Field(default_factory=TailorSections)
    done: bool = False


# ---------------------------------------------------------------------------
# Interview (conversacional)
# ---------------------------------------------------------------------------

InterviewMode = Literal["recruiter", "technical", "behavioural", "mixed"]


class InterviewRequest(BaseModel):
    session_id: str | None = Field(None, description="Omet per iniciar entrevista nova")
    cv_text: str | None = Field(None, description="Obligatori en el primer missatge")
    jd_text: str | None = Field(None, description="Obligatori en el primer missatge")
    mode: InterviewMode = "mixed"
    user_answer: str | None = Field(
        None, description="Resposta de l'usuari a la pregunta anterior"
    )
    language: Literal["en", "es"] = "en"


class InterviewQuestion(BaseModel):
    """El que esperem que retorni l'LLM a cada torn -- nomes el contingut
    de la pregunta. El comptador de torns el porta el codi, no el model."""

    question: str


class InterviewResponse(BaseModel):
    session_id: str
    question: str
    turn_number: int
    done: bool = False


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------


class GoogleLoginRequest(BaseModel):
    google_id_token: str = Field(..., description="ID token que retorna Google Identity Services")


class UserOut(BaseModel):
    id: int
    email: str
    name: str | None = None


class LoginResponse(BaseModel):
    access_token: str
    user: UserOut


# ---------------------------------------------------------------------------
# Profile (CV base) i Applications (historial) -- Capa 1
# ---------------------------------------------------------------------------


class ProfileOut(BaseModel):
    base_cv_text: str | None = None
    memory_text: str | None = None


class ProfileUpdateRequest(BaseModel):
    base_cv_text: str


class ApplicationCreateRequest(BaseModel):
    title: str
    jd_text: str
    cv_text_used: str
    analysis: AnalyzeResponse | None = None
    tailor_sections: TailorSections | None = None


class ApplicationSummary(BaseModel):
    id: int
    title: str
    applied: bool
    created_at: str


class ApplicationDetail(BaseModel):
    id: int
    title: str
    jd_text: str
    cv_text_used: str
    analysis: AnalyzeResponse | None = None
    tailor_sections: TailorSections | None = None
    applied: bool
    created_at: str

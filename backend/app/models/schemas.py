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


class CompetencyMatch(BaseModel):
    competency: str
    priority: int = Field(..., ge=1, description="1 = mes important")
    type: Literal["screening", "differentiating"]
    match_status: Literal["match", "partial", "gap"]
    evidence: str = Field(
        ..., description="Evidencia concreta del CV, o 'cap evidencia trobada'"
    )


class AnalyzeResponse(BaseModel):
    company_profile: str = Field(..., description="Que busca l'empresa, en 2-3 frases")
    competencies: list[CompetencyMatch]
    fit_score: float = Field(..., ge=0, le=100)


# ---------------------------------------------------------------------------
# Resume Tailor (conversacional)
# ---------------------------------------------------------------------------


class TailorRequest(BaseModel):
    session_id: str | None = Field(
        None, description="Omet per iniciar una sessio nova"
    )
    cv_text: str | None = Field(
        None, description="Obligatori nomes en el primer missatge de la sessio"
    )
    analysis: AnalyzeResponse | None = Field(
        None, description="Output de l'Analyzer, opcional, dona context de prioritats"
    )
    user_message: str | None = Field(
        None, description="Resposta de l'usuari a una pregunta de l'agent"
    )


class TailoredBullet(BaseModel):
    original: str
    rewritten: str


class ResumeSections(BaseModel):
    """Full tailored resume, organized into copy-pasteable sections.
    Only present when status='complete' -- built from what's actually in
    the original resume, never fabricated content."""

    professional_summary: str = Field(
        default="", description="Rewritten summary/profile, or '' if the resume had none"
    )
    skills: str = Field(default="", description="Skills section, plain text, one per line or comma-separated")
    key_achievements: str = Field(
        default="", description="Key achievements/projects section, or '' if not applicable"
    )
    professional_experience: str = Field(
        default="", description="Full experience section with tailored bullets integrated"
    )


class TailorTurn(BaseModel):
    """El que esperem que retorni l'LLM a CADA torn de la conversa del Tailor."""

    status: Literal["needs_info", "complete"]
    agent_message: str = Field(
        ..., description="Pregunta a l'usuari, o resum final si status=complete"
    )
    tailored_bullets: list[TailoredBullet] = Field(default_factory=list)
    final_resume_sections: ResumeSections | None = Field(
        default=None, description="Nomes present quan status='complete'"
    )


class TailorResponse(TailorTurn):
    """El mateix que TailorTurn, mes el session_id que afegim nosaltres
    (l'LLM no en sap res, el gestiona el backend)."""

    session_id: str


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


class InterviewQuestion(BaseModel):
    """El que esperem que retorni l'LLM a cada torn -- nomes el contingut
    de la pregunta. El comptador de torns el porta el codi, no el model."""

    question: str


class InterviewResponse(BaseModel):
    session_id: str
    question: str
    turn_number: int
    done: bool = False

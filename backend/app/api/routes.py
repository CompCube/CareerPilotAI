"""
Rutes de l'API.

Regla: aquest fitxer NOMES orquestra (rep la peticio, crida l'agent
corresponent, retorna la resposta). Cap logica de negoci aqui --
aixo viu a app/agents/.
"""

from fastapi import APIRouter, HTTPException, Request

from app.agents.analyzer_agent import run_analyzer
from app.agents.interview_agent import InterviewFinishedError, continue_interview, start_interview
from app.agents.tailor_agent import continue_tailor_session, start_tailor_session
from app.core.config import get_settings
from app.core.limiter import limiter
from app.models.schemas import (
    AnalyzeRequest,
    AnalyzeResponse,
    InterviewRequest,
    InterviewResponse,
    TailorRequest,
    TailorResponse,
)
from app.services.llm_service import LLMServiceError
from app.services.structured_output import StructuredOutputError

router = APIRouter()
settings = get_settings()


@router.get("/health")
def health_check() -> dict:
    """Ens permet comprovar que el backend esta despert (Railway/Render el
    fan servir per saber si el servei esta viu). Sense rate limit -- els
    healthchecks del hosting el criden sovint."""
    return {"status": "ok", "service": "careerpilot-ai-backend"}


@router.post("/analyze", response_model=AnalyzeResponse)
@limiter.limit(f"{settings.rate_limit_per_minute}/minute")
async def analyze(request: Request, payload: AnalyzeRequest) -> AnalyzeResponse:
    """Compara CV amb JD: perfil de l'empresa, competencies, fit score."""
    try:
        return run_analyzer(cv_text=payload.cv_text, jd_text=payload.jd_text)
    except (LLMServiceError, StructuredOutputError) as exc:
        raise HTTPException(
            status_code=502, detail="No s'ha pogut completar l'analisi. Torna-ho a provar."
        ) from exc


@router.post("/tailor", response_model=TailorResponse)
@limiter.limit(f"{settings.rate_limit_per_minute}/minute")
async def tailor(request: Request, payload: TailorRequest) -> TailorResponse:
    """
    Conversacional: omet session_id per iniciar, inclou-lo + user_message
    per continuar una sessió existent (p.ex. per respondre una pregunta
    de l'agent).
    """
    try:
        if payload.session_id is None:
            if not payload.cv_text:
                raise HTTPException(
                    status_code=400,
                    detail="cv_text es obligatori per iniciar una sessio nova.",
                )
            return start_tailor_session(cv_text=payload.cv_text, analysis=payload.analysis)

        if not payload.user_message:
            raise HTTPException(
                status_code=400,
                detail="user_message es obligatori per continuar una sessio existent.",
            )
        try:
            return continue_tailor_session(
                session_id=payload.session_id, user_message=payload.user_message
            )
        except KeyError:
            raise HTTPException(
                status_code=404,
                detail="Sessio no trobada (potser el servidor s'ha reiniciat). Inicia'n una de nova.",
            )
    except (LLMServiceError, StructuredOutputError) as exc:
        raise HTTPException(
            status_code=502, detail="No s'ha pogut processar la sol·licitud. Torna-ho a provar."
        ) from exc


@router.post("/interview", response_model=InterviewResponse)
@limiter.limit(f"{settings.rate_limit_per_minute}/minute")
async def interview(request: Request, payload: InterviewRequest) -> InterviewResponse:
    """
    Conversacional: omet session_id per iniciar (cv_text + jd_text obligatoris),
    inclou-lo + user_answer per rebre la seguent pregunta.
    """
    try:
        if payload.session_id is None:
            if not payload.cv_text or not payload.jd_text:
                raise HTTPException(
                    status_code=400,
                    detail="cv_text i jd_text son obligatoris per iniciar una entrevista nova.",
                )
            return start_interview(
                cv_text=payload.cv_text, jd_text=payload.jd_text, mode=payload.mode
            )

        if not payload.user_answer:
            raise HTTPException(
                status_code=400,
                detail="user_answer es obligatori per continuar l'entrevista.",
            )
        try:
            return continue_interview(
                session_id=payload.session_id, user_answer=payload.user_answer
            )
        except KeyError:
            raise HTTPException(
                status_code=404,
                detail="Sessio no trobada (potser el servidor s'ha reiniciat). Inicia'n una de nova.",
            )
        except InterviewFinishedError as exc:
            raise HTTPException(status_code=400, detail=str(exc))
    except (LLMServiceError, StructuredOutputError) as exc:
        raise HTTPException(
            status_code=502, detail="No s'ha pogut processar la sol·licitud. Torna-ho a provar."
        ) from exc

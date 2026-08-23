"""
Rutes de l'API.

Regla: aquest fitxer NOMES orquestra (rep la peticio, crida l'agent
corresponent, retorna la resposta). Cap logica de negoci aqui --
aixo viu a app/agents/.
"""

from fastapi import APIRouter, File, HTTPException, Request, UploadFile

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
    PDFExtractResponse,
    TailorRequest,
    TailorResponse,
)
from app.services.llm_service import LLMServiceError
from app.services.structured_output import StructuredOutputError
from app.utils.pdf_extraction import PDFExtractionError, extract_text_from_pdf
from app.utils.validation import FileValidationError, validate_pdf_upload

router = APIRouter()
settings = get_settings()


@router.get("/health")
def health_check() -> dict:
    """Ens permet comprovar que el backend esta despert (Railway/Render el
    fan servir per saber si el servei esta viu). Sense rate limit -- els
    healthchecks del hosting el criden sovint."""
    return {"status": "ok", "service": "careerpilot-ai-backend"}


@router.post("/extract-pdf", response_model=PDFExtractResponse)
@limiter.limit(f"{settings.rate_limit_per_minute}/minute")
async def extract_pdf(request: Request, file: UploadFile = File(...)) -> PDFExtractResponse:
    """
    Rep un PDF, el valida per contingut real (no per extensio), i n'extreu
    el text. No crida cap LLM -- nomes parsing local, per aixo es mes barat
    i rapid que la resta d'endpoints.
    """
    try:
        content = await validate_pdf_upload(file)
    except FileValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    try:
        text = extract_text_from_pdf(content)
    except PDFExtractionError as exc:
        raise HTTPException(status_code=422, detail=str(exc))

    return PDFExtractResponse(text=text)


@router.post("/analyze", response_model=AnalyzeResponse)
@limiter.limit(f"{settings.rate_limit_per_minute}/minute")
async def analyze(request: Request, payload: AnalyzeRequest) -> AnalyzeResponse:
    """Compara CV amb JD: perfil de l'empresa, competencies, fit score."""
    try:
        return run_analyzer(cv_text=payload.cv_text, jd_text=payload.jd_text, language=payload.language)
    except (LLMServiceError, StructuredOutputError) as exc:
        raise HTTPException(
            status_code=502, detail="Could not complete the analysis. Please try again."
        ) from exc


@router.post("/tailor", response_model=TailorResponse)
@limiter.limit(f"{settings.rate_limit_per_minute}/minute")
async def tailor(request: Request, payload: TailorRequest) -> TailorResponse:
    """
    Conversacional, 4 fases (extract -> interrogate -> deepen -> assemble).
    Omet session_id per iniciar (cv_text, jd_text i analysis obligatoris),
    inclou-lo + user_message per continuar.
    """
    try:
        if payload.session_id is None:
            if not payload.cv_text or not payload.jd_text or not payload.analysis:
                raise HTTPException(
                    status_code=400,
                    detail="cv_text, jd_text and analysis are required to start a new Tailor session.",
                )
            return start_tailor_session(
                cv_text=payload.cv_text, jd_text=payload.jd_text, analysis=payload.analysis,
                language=payload.language,
            )

        if not payload.user_message:
            raise HTTPException(
                status_code=400,
                detail="user_message is required to continue an existing session.",
            )
        try:
            return continue_tailor_session(
                session_id=payload.session_id, user_message=payload.user_message
            )
        except KeyError:
            raise HTTPException(
                status_code=404,
                detail="Session not found (the server may have restarted). Please start a new one.",
            )
    except (LLMServiceError, StructuredOutputError) as exc:
        raise HTTPException(
            status_code=502, detail="Could not process the request. Please try again."
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
                    detail="cv_text and jd_text are required to start a new interview.",
                )
            return start_interview(
                cv_text=payload.cv_text, jd_text=payload.jd_text, mode=payload.mode,
                language=payload.language,
            )

        if not payload.user_answer:
            raise HTTPException(
                status_code=400,
                detail="user_answer is required to continue the interview.",
            )
        try:
            return continue_interview(
                session_id=payload.session_id, user_answer=payload.user_answer
            )
        except KeyError:
            raise HTTPException(
                status_code=404,
                detail="Session not found (the server may have restarted). Please start a new one.",
            )
        except InterviewFinishedError as exc:
            raise HTTPException(status_code=400, detail=str(exc))
    except (LLMServiceError, StructuredOutputError) as exc:
        raise HTTPException(
            status_code=502, detail="Could not process the request. Please try again."
        ) from exc

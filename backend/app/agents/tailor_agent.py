"""
Resume Tailor Agent.

A diferencia de l'Analyzer (un sol pas), aquest es CONVERSACIONAL: pot
aturar-se a mig cami i preguntar a l'usuari abans de continuar, en lloc
d'inventar-se una dada que no te. Per aixo necessita historial de sessio
(veure app/services/session_store.py).
"""

from app.models.schemas import AnalyzeResponse, TailorResponse, TailorTurn
from app.prompts.tailor_prompts import TAILOR_SYSTEM_PROMPT, build_tailor_initial_message
from app.services import session_store
from app.services.structured_output import call_llm_structured


def _summarize_analysis(analysis: AnalyzeResponse | None) -> str | None:
    """Reduces the full AnalyzeResponse to a short summary -- no need to send
    the Analyzer's entire JSON, just what helps prioritize the tailoring."""
    if analysis is None:
        return None
    top_gaps = [c.competency for c in analysis.competencies if c.match_status == "gap"]
    top_priorities = [
        c.competency for c in sorted(analysis.competencies, key=lambda c: c.priority)[:5]
    ]
    return (
        f"What the company is looking for: {analysis.company_profile}\n"
        f"Priority competencies: {', '.join(top_priorities)}\n"
        f"Detected gaps (don't force these if there's no real evidence): "
        f"{', '.join(top_gaps) if top_gaps else 'none'}"
    )


def _run_turn(session_id: str) -> TailorResponse:
    turn, raw = call_llm_structured(
        system_prompt=TAILOR_SYSTEM_PROMPT,
        messages=session_store.get_history(session_id),
        response_model=TailorTurn,
        prompt_name="tailor.turn",
        max_tokens=2500,
    )
    session_store.append_message(session_id, "assistant", raw)
    return TailorResponse(session_id=session_id, **turn.model_dump())


def start_tailor_session(cv_text: str, analysis: AnalyzeResponse | None) -> TailorResponse:
    session_id = session_store.create_session()
    initial_message = build_tailor_initial_message(cv_text, _summarize_analysis(analysis))
    session_store.append_message(session_id, "user", initial_message)
    return _run_turn(session_id)


def continue_tailor_session(session_id: str, user_message: str) -> TailorResponse:
    session_store.append_message(session_id, "user", user_message)  # KeyError si no existeix
    return _run_turn(session_id)

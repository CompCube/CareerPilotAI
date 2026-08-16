"""
Interview Agent.

Decisio de disseny important: EL CODI decideix quan acaba l'entrevista
(nombre fix de preguntes), no el model. Deixar que un LLM compti torns
i decideixi "prou preguntes ja" es poc fiable -- es pot allargar o tallar
inconsistentment. El model nomes genera el CONTINGUT de cada pregunta.
"""

from app.models.schemas import InterviewMode, InterviewQuestion, InterviewResponse
from app.prompts.interview_prompts import (
    build_interview_followup_message,
    build_interview_initial_message,
    INTERVIEW_SYSTEM_PROMPT,
)
from app.services import session_store
from app.services.structured_output import call_llm_structured

MAX_TURNS = 5


class InterviewFinishedError(Exception):
    """L'usuari intenta continuar una entrevista que ja ha arribat al maxim
    de preguntes."""


def _count_questions_asked(session_id: str) -> int:
    history = session_store.get_history(session_id)
    return sum(1 for m in history if m["role"] == "assistant")


def _run_turn(session_id: str) -> InterviewResponse:
    turn, raw = call_llm_structured(
        system_prompt=INTERVIEW_SYSTEM_PROMPT,
        messages=session_store.get_history(session_id),
        response_model=InterviewQuestion,
        prompt_name="interview.turn",
        max_tokens=300,
    )
    session_store.append_message(session_id, "assistant", raw)

    turn_number = _count_questions_asked(session_id)
    return InterviewResponse(
        session_id=session_id,
        question=turn.question,
        turn_number=turn_number,
        done=turn_number >= MAX_TURNS,
    )


def start_interview(cv_text: str, jd_text: str, mode: InterviewMode) -> InterviewResponse:
    session_id = session_store.create_session()
    initial_message = build_interview_initial_message(cv_text, jd_text, mode)
    session_store.append_message(session_id, "user", initial_message)
    return _run_turn(session_id)


def continue_interview(session_id: str, user_answer: str) -> InterviewResponse:
    if _count_questions_asked(session_id) >= MAX_TURNS:  # KeyError si no existeix
        raise InterviewFinishedError(
            f"L'entrevista ja ha arribat al maxim de {MAX_TURNS} preguntes."
        )
    session_store.append_message(
        session_id, "user", build_interview_followup_message(user_answer)
    )
    return _run_turn(session_id)

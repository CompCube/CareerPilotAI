"""
Prova manual de l'Interview Agent -- LLM simulat, cap crèdit real gastat.

Comprova:
  1. Inici + continuació normal, turn_number incrementa correctament
  2. done=True nomes quan s'arriba a MAX_TURNS
  3. Intentar continuar despres de MAX_TURNS -> InterviewFinishedError,
     NO una crida extra a l'LLM (control de cost real, no nomes de forma)
"""

import sys
from unittest.mock import patch

sys.path.insert(0, ".")

from app.agents.interview_agent import (  # noqa: E402
    MAX_TURNS,
    InterviewFinishedError,
    continue_interview,
    start_interview,
)

QUESTION_RESPONSE = '{"question": "Explica'"'"'m un projecte on hagis fet servir Python."}'


def test_full_interview_flow_reaches_done():
    with patch("app.services.structured_output.call_llm", return_value=QUESTION_RESPONSE):
        first = start_interview(cv_text="CV" * 10, jd_text="JD" * 10, mode="mixed")
        assert first.turn_number == 1
        assert first.done is False

        session_id = first.session_id
        last = first
        for _ in range(MAX_TURNS - 1):
            last = continue_interview(session_id, user_answer="Resposta de prova")

        assert last.turn_number == MAX_TURNS
        assert last.done is True
    print(f"OK  test_full_interview_flow_reaches_done (MAX_TURNS={MAX_TURNS})")

    return session_id


def test_continuing_after_done_raises_without_calling_llm(session_id: str):
    with patch("app.services.structured_output.call_llm") as mock_call:
        try:
            continue_interview(session_id, user_answer="Vull continuar")
            raise AssertionError("Hauria d'haver llançat InterviewFinishedError")
        except InterviewFinishedError:
            pass
        assert mock_call.call_count == 0, "No s'hauria d'haver cridat l'LLM un cop acabada l'entrevista"
    print("OK  test_continuing_after_done_raises_without_calling_llm (0 crides extra a l'LLM)")


if __name__ == "__main__":
    finished_session_id = test_full_interview_flow_reaches_done()
    test_continuing_after_done_raises_without_calling_llm(finished_session_id)
    print("\nTots els tests de l'Interview Agent han passat.")

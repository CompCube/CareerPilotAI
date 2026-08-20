"""
Prova manual del Tailor Agent -- LLM simulat, cap crèdit real gastat.

Comprova:
  1. Sessió nova que necessita info (status=needs_info) -> l'usuari respon
     -> la sessió continua i acaba complete
  2. L'historial de conversa creix correctament a cada torn (context real)
  3. Continuar amb un session_id inexistent -> KeyError net, no un crash
"""

import sys
from unittest.mock import patch

sys.path.insert(0, ".")

from app.agents.tailor_agent import continue_tailor_session, start_tailor_session  # noqa: E402
from app.services import session_store  # noqa: E402

NEEDS_INFO_RESPONSE = """{
  "status": "needs_info",
  "agent_message": "Quin percentatge de millora en temps de build vas aconseguir amb la migracio de CI?",
  "tailored_bullets": []
}"""

COMPLETE_RESPONSE = """{
  "status": "complete",
  "agent_message": "Bullets actualitzats amb les metriques que has donat.",
  "tailored_bullets": [
    {"original": "Vaig millorar la pipeline de CI", "rewritten": "Vaig reduir el temps de build un 40% migrant la pipeline de CI a paral·lelitzacio"}
  ],
  "final_resume_sections": {
    "professional_summary": "Backend engineer with CI/CD expertise.",
    "skills": "Python, CI/CD, Docker",
    "key_achievements": "",
    "professional_experience": "Vaig reduir el temps de build un 40% migrant la pipeline de CI a paral·lelitzacio"
  }
}"""


def test_multiturn_flow_and_history_growth():
    with patch(
        "app.services.structured_output.call_llm", side_effect=[NEEDS_INFO_RESPONSE, COMPLETE_RESPONSE]
    ):
        first = start_tailor_session(cv_text="Experiencia: vaig millorar la pipeline de CI" * 2, analysis=None)
        assert first.status == "needs_info"
        assert "percentatge" in first.agent_message.lower()

        history_after_first_turn = session_store.get_history(first.session_id)
        assert len(history_after_first_turn) == 2  # user inicial + assistant

        second = continue_tailor_session(first.session_id, user_message="Un 40%")
        assert second.status == "complete"
        assert len(second.tailored_bullets) == 1
        assert "40%" in second.tailored_bullets[0].rewritten
        assert second.final_resume_sections is not None
        assert "CI/CD" in second.final_resume_sections.skills

        history_after_second_turn = session_store.get_history(first.session_id)
        assert len(history_after_second_turn) == 4  # +user resposta +assistant final
    print("OK  test_multiturn_flow_and_history_growth")


def test_unknown_session_raises_keyerror():
    try:
        continue_tailor_session(session_id="sessio-que-no-existeix", user_message="hola")
        raise AssertionError("Hauria d'haver llançat KeyError")
    except KeyError:
        pass
    print("OK  test_unknown_session_raises_keyerror")


if __name__ == "__main__":
    test_multiturn_flow_and_history_growth()
    test_unknown_session_raises_keyerror()
    print("\nTots els tests del Tailor han passat.")

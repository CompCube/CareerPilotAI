"""
Prova manual de l'Analyzer amb l'LLM simulat -- no gasta cap crèdit real.

Comprova:
  1. Cas feliç: JSON valid -> objecte AnalyzeResponse correcte
  2. Cas JSON embolcallat en ```json ... ``` -> l'extractor el troba igualment
  3. Cas JSON invalid dues vegades -> StructuredOutputError, no un crash
"""

import sys
from unittest.mock import patch

sys.path.insert(0, ".")

from app.agents.analyzer_agent import run_analyzer  # noqa: E402
from app.services.structured_output import StructuredOutputError  # noqa: E402

VALID_RESPONSE = """{
  "role_summary": "The company builds internal developer tools and needs someone who can own backend APIs end to end.",
  "ideal_candidate_profile": "A pragmatic backend engineer who has shipped production APIs before, comfortable owning a service with minimal oversight.",
  "company_profile": "Empresa que busca un enginyer backend Python amb experiencia en APIs.",
  "competencies": [
    {"competency": "Python", "priority": 1, "type": "screening", "match_status": "match", "evidence": "5 anys amb Python al CV"},
    {"competency": "FastAPI", "priority": 2, "type": "differentiating", "match_status": "partial", "evidence": "Experiencia amb Flask, no FastAPI explicitament"}
  ],
  "fit_score": 72
}"""

FENCED_RESPONSE = f"Aqui tens l'analisi:\n```json\n{VALID_RESPONSE}\n```\nEspero que ajudi."

INVALID_RESPONSE = "Ho sento, no puc generar JSON ara mateix."


def test_happy_path():
    with patch("app.services.structured_output.call_llm", return_value=VALID_RESPONSE):
        result = run_analyzer(cv_text="CV de prova amb Python" * 3, jd_text="JD de prova" * 3)
        assert result.fit_score == 72
        assert result.competencies[0].competency == "Python"
        assert result.competencies[0].match_status == "match"
    print("OK  test_happy_path")


def test_fenced_json():
    with patch("app.services.structured_output.call_llm", return_value=FENCED_RESPONSE):
        result = run_analyzer(cv_text="CV de prova" * 3, jd_text="JD de prova" * 3)
        assert result.fit_score == 72
    print("OK  test_fenced_json")


def test_invalid_json_raises_clean_error():
    with patch("app.services.structured_output.call_llm", return_value=INVALID_RESPONSE):
        try:
            run_analyzer(cv_text="CV de prova" * 3, jd_text="JD de prova" * 3)
            raise AssertionError("Hauria d'haver llançat StructuredOutputError")
        except StructuredOutputError:
            pass
    print("OK  test_invalid_json_raises_clean_error")


if __name__ == "__main__":
    test_happy_path()
    test_fenced_json()
    test_invalid_json_raises_clean_error()
    print("\nTots els tests de l'Analyzer han passat.")

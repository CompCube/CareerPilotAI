"""
Analyzer Agent.

Rep CV + JD, retorna perfil de l'empresa, competencies prioritzades i
fit score. Es un sol pas (no conversacional) -- a diferencia del Tailor
i l'Interview, aqui no cal demanar mes informacio a l'usuari.
"""

from app.models.schemas import AnalyzeResponse
from app.prompts.analyzer_prompts import ANALYZER_SYSTEM_PROMPT, build_analyzer_user_message
from app.services.structured_output import call_llm_structured


def run_analyzer(cv_text: str, jd_text: str) -> AnalyzeResponse:
    user_message = build_analyzer_user_message(cv_text, jd_text)
    messages = [{"role": "user", "content": user_message}]

    result, _raw = call_llm_structured(
        system_prompt=ANALYZER_SYSTEM_PROMPT,
        messages=messages,
        response_model=AnalyzeResponse,
        prompt_name="analyzer.decode_jd",
        max_tokens=1500,
    )
    return result

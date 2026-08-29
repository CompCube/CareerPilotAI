"""
LLM-as-judge: per a la unica dimensio genuinament subjectiva que les
comprovacions de regles no poden mesurar -- "sona escrit per una persona
o es nota que ho ha fet una IA?". Fem servir una crida separada a l'LLM
com a jutge, amb el seu propi prompt, independent de l'agent avaluat.
"""

from pydantic import BaseModel, Field

from app.services.structured_output import call_llm_structured

JUDGE_SYSTEM_PROMPT = """You are a blunt, experienced hiring manager reviewing
resume bullets. Your only job is to judge whether a bullet sounds like it was
naturally written by the candidate, or like generic AI-generated text.

Score 1-5:
1 = obviously AI-generated, generic, could apply to anyone
3 = readable but slightly generic or templated
5 = sounds specific, natural, like a real person describing real work

Respond ONLY with JSON, no text before or after, no markdown code blocks:
{"score": 1-5, "reason": "one short sentence"}
"""


class JudgeOutput(BaseModel):
    score: int = Field(..., ge=1, le=5)
    reason: str


def judge_naturalness(bullet_text: str) -> JudgeOutput:
    result, _raw = call_llm_structured(
        system_prompt=JUDGE_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": f"Bullet to judge:\n{bullet_text}"}],
        response_model=JudgeOutput,
        prompt_name="eval.judge_naturalness",
        max_tokens=200,
    )
    return result

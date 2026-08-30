"""
Memory Agent.

Es crida un cop, just despres de desar una candidatura a l'historial
(nomes si l'usuari ha iniciat sessio). No es una crida bloquejant per a
l'usuari -- passa en segon pla, en la mateixa peticio de guardar.
"""

from pydantic import BaseModel, Field

from app.prompts.language import language_instruction
from app.prompts.memory_prompts import MEMORY_UPDATE_PROMPT, build_memory_update_message
from app.services.structured_output import call_llm_structured


class MemoryUpdateOutput(BaseModel):
    updated_memory: str = Field(..., max_length=2000)


def update_user_memory(
    existing_memory: str | None, jd_text: str, resume_summary: str, language: str = "en"
) -> str:
    result, _raw = call_llm_structured(
        system_prompt=MEMORY_UPDATE_PROMPT + language_instruction(language),
        messages=[
            {"role": "user", "content": build_memory_update_message(existing_memory, jd_text, resume_summary)}
        ],
        response_model=MemoryUpdateOutput,
        prompt_name="memory.update",
        max_tokens=500,
    )
    return result.updated_memory

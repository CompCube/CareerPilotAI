"""
Crida un LLM i valida que la resposta encaixa amb un schema Pydantic donat.

Aixo es el punt #2 del document de disseny: mai confiar cegament en el
que retorna un LLM. Si el JSON esta mal format o no encaixa amb l'schema,
reintentem UN cop amb un recordatori mes estricte abans de rendir-nos.

Viu a "services/" (no a "utils/") perque orquestra una crida real a
l'LLM -- no es pura funcio auxiliar sense efectes.
"""

import logging
from typing import TypeVar

from pydantic import BaseModel, ValidationError

from app.services.llm_service import LLMServiceError, call_llm
from app.utils.parsing import JSONExtractionError, extract_json

logger = logging.getLogger("careerpilot.structured_output")

T = TypeVar("T", bound=BaseModel)

RETRY_REMINDER = (
    "\n\nIMPORTANT: la teva resposta anterior no tenia un format JSON valid "
    "o no complia l'esquema requerit. Respon NOMES amb un objecte JSON valid, "
    "sense text abans ni despres, sense blocs de codi markdown."
)


class StructuredOutputError(Exception):
    """El model no ha retornat una resposta valida despres de reintentar."""


def call_llm_structured(
    system_prompt: str,
    messages: list[dict],
    response_model: type[T],
    prompt_name: str,
    max_tokens: int | None = None,
) -> tuple[T, str]:
    """
    Crida l'LLM i retorna (instancia validada de `response_model`, text cru).

    Reintenta UN cop (a mes dels reintents per errors de xarxa que ja fa
    llm_service.call_llm) si el JSON no es parsejable o no compleix l'schema.
    En reintentar, l'historial inclou la resposta invalida real del model
    + una correcció -- així el model veu exactament què cal arreglar, en
    lloc d'un recordatori generic desacoblat del seu error.

    El text cru es retorna perquè els agents conversacionals el puguin
    desar a l'historial de sessió tal com el model el va generar.
    """
    last_error: Exception | None = None
    working_messages = list(messages)  # còpia -- no mutem la llista original

    for attempt in range(1, 3):  # intent normal + 1 reintent per format invalid
        raw = call_llm(
            system_prompt=system_prompt,
            messages=working_messages,
            prompt_name=f"{prompt_name}.attempt{attempt}",
            max_tokens=max_tokens,
        )

        try:
            data = extract_json(raw)
            return response_model.model_validate(data), raw
        except (JSONExtractionError, ValidationError) as exc:
            last_error = exc
            logger.warning(
                "structured_output invalid_format prompt=%s attempt=%d error=%s",
                prompt_name,
                attempt,
                str(exc)[:300],
            )
            working_messages = working_messages + [
                {"role": "assistant", "content": raw},
                {"role": "user", "content": RETRY_REMINDER.strip()},
            ]
            continue
        except LLMServiceError:
            raise  # error de xarxa/API -- ja gestionat i logat a llm_service

    raise StructuredOutputError(
        f"El model no ha retornat un format valid despres de 2 intents "
        f"per a '{prompt_name}': {last_error}"
    )

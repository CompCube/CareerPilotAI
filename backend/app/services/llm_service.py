"""
Unica capa que parla amb l'API de Claude.

Cap altre modul del backend (agents, routes) fa una crida directa a
Anthropic. Si demà canviem de proveidor (OpenAI, etc.), nomes cal
tocar aquest fitxer.

Responsabilitats d'aquest fitxer, i nomes aquestes:
  1. Cridar l'API amb el prompt donat
  2. Reintentar en errors TRANSITORIS (rate limit, timeout, sobrecarrega)
  3. Loguejar cada crida (tokens, latencia, quin prompt) per observabilitat de cost
  4. NO sap res sobre entrevistes, CVs ni JDs -- aixo es feina dels agents
"""

import logging
import time

import anthropic

from app.core.config import get_settings

logger = logging.getLogger("careerpilot.llm")
logging.basicConfig(level=logging.INFO)

# Errors que val la pena reintentar: son transitoris, no un problema
# permanent (una clau invalida o un prompt mal format NO es reintenten,
# perque reintentar-los no els arregla).
RETRYABLE_EXCEPTIONS = (
    anthropic.RateLimitError,
    anthropic.APITimeoutError,
    anthropic.InternalServerError,  # inclou el 529 "overloaded"
)

MAX_RETRIES = 3
BASE_BACKOFF_SECONDS = 1.0


class LLMServiceError(Exception):
    """Error final despres d'exhaurir els reintents, o error no recuperable."""


def call_llm(
    system_prompt: str,
    messages: list[dict],
    prompt_name: str,
    max_tokens: int | None = None,
) -> str:
    """
    Crida Claude amb reintents automatics i logging estructurat.

    Args:
        system_prompt: instruccions de comportament per a l'agent
        messages: historial de conversa, format [{"role": "user"|"assistant", "content": str}, ...]
        prompt_name: identificador curt per als logs, p.ex. "analyzer.decode_jd"
        max_tokens: sobreescriu el default si cal

    Returns:
        El text de resposta del model.

    Raises:
        LLMServiceError: si tots els reintents fallen o l'error no es recuperable.
    """
    settings = get_settings()
    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
    tokens_out = max_tokens or settings.max_tokens_default

    last_error: Exception | None = None

    for attempt in range(1, MAX_RETRIES + 1):
        start = time.monotonic()
        try:
            response = client.messages.create(
                model=settings.model_name,
                max_tokens=tokens_out,
                system=system_prompt,
                messages=messages,
            )
            latency_ms = round((time.monotonic() - start) * 1000)

            logger.info(
                "llm_call ok prompt=%s model=%s attempt=%d latency_ms=%d "
                "tokens_in=%d tokens_out=%d",
                prompt_name,
                settings.model_name,
                attempt,
                latency_ms,
                response.usage.input_tokens,
                response.usage.output_tokens,
            )

            return response.content[0].text

        except RETRYABLE_EXCEPTIONS as exc:
            last_error = exc
            latency_ms = round((time.monotonic() - start) * 1000)
            logger.warning(
                "llm_call retryable_error prompt=%s attempt=%d/%d "
                "latency_ms=%d error=%s",
                prompt_name,
                attempt,
                MAX_RETRIES,
                latency_ms,
                type(exc).__name__,
            )
            if attempt < MAX_RETRIES:
                time.sleep(BASE_BACKOFF_SECONDS * (2 ** (attempt - 1)))  # 1s, 2s, 4s
                continue

        except anthropic.APIError as exc:
            # Error NO transitori (auth, validacio...) -- no val la pena reintentar
            logger.error(
                "llm_call fatal_error prompt=%s error=%s", prompt_name, str(exc)
            )
            raise LLMServiceError(f"Error no recuperable de l'API: {exc}") from exc

    logger.error(
        "llm_call exhausted_retries prompt=%s attempts=%d", prompt_name, MAX_RETRIES
    )
    raise LLMServiceError(
        f"L'API no ha respost despres de {MAX_RETRIES} intents: {last_error}"
    )

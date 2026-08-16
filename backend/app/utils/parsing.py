"""
Extreu JSON de la resposta d'un LLM de forma tolerant.

Els models sovint embolcallen el JSON amb ```json ... ``` o hi afegeixen
una frase abans/despres, encara que se'ls digui que no ho facin. Aquesta
funcio ho gestiona en lloc de fer un json.loads() ingenu que petaria.
"""

import json
import re


class JSONExtractionError(Exception):
    """No s'ha pogut trobar/parsejar JSON valid a la resposta del model."""


def extract_json(raw_text: str) -> dict:
    """
    Intenta extreure un objecte JSON del text cru d'una resposta LLM.

    Estrategia (de mes a menys estricta):
      1. Parsejar el text tal qual
      2. Treure blocs ```json ... ``` o ``` ... ``` si n'hi ha
      3. Agafar el primer bloc { ... } equilibrat que trobem
    """
    text = raw_text.strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    fence_match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    if fence_match:
        try:
            return json.loads(fence_match.group(1))
        except json.JSONDecodeError:
            pass

    brace_match = re.search(r"\{.*\}", text, re.DOTALL)
    if brace_match:
        try:
            return json.loads(brace_match.group(0))
        except json.JSONDecodeError:
            pass

    raise JSONExtractionError(
        f"No s'ha pogut extreure JSON valid. Primers 200 caracters: {text[:200]!r}"
    )

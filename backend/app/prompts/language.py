"""
Helper compartit perque tots els agents respectin l'idioma triat a la UI.

Fins ara cap prompt en sabia res -- nomes els textos fixos de la interficie
es traduien (translations.ts), el contingut generat per l'LLM sempre sortia
en angles independentment del toggle EN/ES.
"""

LANGUAGE_NAMES = {"en": "English", "es": "Spanish"}


def language_instruction(language: str) -> str:
    name = LANGUAGE_NAMES.get(language, "English")
    return (
        f"\n\nIMPORTANT: Write all natural-language text content (every string "
        f"value, not the JSON keys) in {name}. This applies to every text "
        f"field in your response, no exceptions."
    )

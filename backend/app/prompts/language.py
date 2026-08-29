"""
Helpers compartits perque tots els agents respectin l'idioma triat a la UI
i evitin sonar com a text generat per IA (em dashes, jargo promocional,
frases fetes de chatbot...).

Fins ara cap prompt en sabia res d'idioma -- nomes els textos fixos de la
interficie es traduien (translations.ts), el contingut generat per l'LLM
sempre sortia en angles independentment del toggle EN/ES.
"""

LANGUAGE_NAMES = {"en": "English", "es": "Spanish"}

ANTI_AI_VOICE_INSTRUCTION = """

WRITING STYLE -- avoid sounding like AI-generated text:
- NEVER use em dashes (—) or double hyphens as a dash substitute. Use a
  period, comma, or parentheses instead.
- Avoid inflated-significance language: "testament to", "pivotal",
  "underscores", "highlights the importance", "plays a vital/crucial
  role", "stands as a", "serves as a".
- Avoid superficial "-ing" tack-on phrases that fake depth:
  "showcasing...", "reflecting...", "fostering...", "ensuring...",
  "highlighting...".
- Avoid promotional/marketing language: "cutting-edge", "seamless",
  "robust", "unlock", "elevate", "empower", "game-changing", "leverage"
  used as a verb.
- Avoid chatbot pleasantries: "Great question!", "I hope this helps!",
  "Let me know if you need anything else!", "Certainly!".
- Avoid signposting what you're about to do: "Let's dive in", "Here's
  what you need to know".
- Vary sentence length and structure naturally -- don't make every
  sentence the same shape.
- Write the way a real person in this role actually talks, not the way
  an AI assistant talks."""


def language_instruction(language: str) -> str:
    name = LANGUAGE_NAMES.get(language, "English")
    return (
        f"\n\n=== OUTPUT LANGUAGE: {name.upper()} ===\n"
        f"Every piece of natural-language text you generate in this response "
        f"(every string value, not the JSON keys) MUST be written in {name}. "
        f"This is non-negotiable and applies no matter what language any "
        f"example, sample bullet, or template text shown earlier in this "
        f"prompt happens to be written in -- those examples only show "
        f"FORMAT and STRUCTURE, never copy their language. If you find "
        f"yourself about to write English while your target language is "
        f"{name}, stop and translate it. Write in {name}, not English, "
        f"unless {name} literally is English."
        + ANTI_AI_VOICE_INSTRUCTION
    )

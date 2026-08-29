"""
Comprovacions basades en regles -- deterministes, sense cap crida extra a
l'LLM. Es fan servir per verificar coses que SI que podem comprovar amb
codi normal (llargada, patrons de text prohibits, si un numero inventat
apareix enlloc del CV original).
"""

import re

# Mateixa llista de patrons que ja prohibim al prompt (language.py) --
# aqui els comprovem de veritat, en lloc de confiar que el model els evita.
BANNED_PHRASES = [
    "testament to",
    "underscores the",
    "plays a vital role",
    "plays a crucial role",
    "stands as a",
    "serves as a",
    "cutting-edge",
    "seamless",
    "leverage",
    "unlock",
    "elevate",
    "empower",
    "game-changing",
]


def check_no_em_dash(text: str) -> tuple[bool, str]:
    if "—" in text:
        return False, "Conte un em dash (—)"
    return True, "Cap em dash trobat"


def check_no_ai_voice_phrases(text: str) -> tuple[bool, str]:
    lowered = text.lower()
    found = [p for p in BANNED_PHRASES if p in lowered]
    if found:
        return False, f"Frases d'IA genèrica trobades: {found}"
    return True, "Cap frase d'IA genèrica trobada"


def check_bullet_length(bullets_text: str, max_chars: int = 220) -> tuple[bool, str]:
    """Aproximacio de '2 linies renderitzades' -- no podem mesurar linies
    reals sense un navegador, fem servir longitud de caracters com a proxy."""
    lines = [line.strip() for line in bullets_text.split("\n") if line.strip()]
    too_long = [line for line in lines if len(line) > max_chars]
    if too_long:
        return False, f"{len(too_long)} bullet(s) superen ~{max_chars} caracters"
    return True, f"Tots els {len(lines)} bullets dins del limit"


def check_no_fabricated_numbers(generated_text: str, source_cv_text: str) -> tuple[bool, str]:
    """Cada numero que aparegui al text generat ha d'apareixer tambe al CV
    original -- si no, probablement s'ha inventat una metrica."""
    generated_numbers = set(re.findall(r"\d+", generated_text))
    source_numbers = set(re.findall(r"\d+", source_cv_text))
    fabricated = generated_numbers - source_numbers
    if fabricated:
        return False, f"Numeros al text generat que no son al CV original: {fabricated}"
    return True, "Tots els numeros generats es poden rastrejar al CV original"


def check_keyword_coverage(
    keywords: list[str], combined_text: str, min_ratio: float = 0.3
) -> tuple[bool, str]:
    lowered = combined_text.lower()
    found = [kw for kw in keywords if kw.lower() in lowered]
    ratio = len(found) / len(keywords) if keywords else 0
    if ratio < min_ratio:
        return False, f"Nomes {len(found)}/{len(keywords)} keywords trobades ({ratio:.0%})"
    return True, f"{len(found)}/{len(keywords)} keywords trobades ({ratio:.0%})"


def check_evidence_grounded(evidence: str, source_cv_text: str, min_overlap_words: int = 2) -> tuple[bool, str]:
    """Comprovacio aproximada: l'evidencia hauria de compartir almenys unes
    quantes paraules significatives amb el CV original (no es prova perfecta
    de 'no fabricacio', pero detecta els casos mes flagrants)."""
    evidence_words = {w.lower() for w in re.findall(r"[a-zA-Z]{4,}", evidence)}
    cv_words = {w.lower() for w in re.findall(r"[a-zA-Z]{4,}", source_cv_text)}
    overlap = evidence_words & cv_words
    if len(overlap) < min_overlap_words:
        return False, f"Nomes {len(overlap)} paraules en comu amb el CV: {overlap}"
    return True, f"{len(overlap)} paraules en comu amb el CV"

"""
Configuracio centralitzada de l'aplicacio.

Principi: cap clau, cap nom de model, cap URL sensible viu hardcoded
al codi. Tot ve de variables d'entorn. Aixo permet:
  - canviar de model (Haiku -> Sonnet -> GPT) sense tocar codi
  - mai pujar secrets a Git (el .env es queda fora del repo)
  - configuracions diferents per local/staging/produccio
"""

import os
from functools import lru_cache

from dotenv import load_dotenv

load_dotenv()


class Settings:
    # --- LLM ---
    anthropic_api_key: str = os.environ.get("ANTHROPIC_API_KEY", "")
    model_name: str = os.environ.get("MODEL_NAME", "claude-haiku-4-5-20251001")
    max_tokens_default: int = int(os.environ.get("MAX_TOKENS_DEFAULT", "1024"))

    # --- CORS (seguretat: nomes el frontend desplegat pot cridar l'API) ---
    # En local, afegim localhost. En produccio, NOMES el domini de Vercel.
    allowed_origins: list[str] = [
        origin.strip()
        for origin in os.environ.get(
            "ALLOWED_ORIGINS", "http://localhost:5173"
        ).split(",")
        if origin.strip()
    ]

    # --- Rate limiting (seguretat: evita que algu et cremi el credit) ---
    rate_limit_per_minute: int = int(os.environ.get("RATE_LIMIT_PER_MINUTE", "10"))

    # --- Upload validation ---
    max_upload_size_mb: int = int(os.environ.get("MAX_UPLOAD_SIZE_MB", "5"))

    def validate(self) -> None:
        """Falla ràpid i clar si falta configuració crítica, en lloc de fallar
        de forma confusa a mig d'una petició d'un usuari."""
        if not self.anthropic_api_key:
            raise RuntimeError(
                "ANTHROPIC_API_KEY no configurada. Copia .env.example a .env "
                "i afegeix la teva clau (console.anthropic.com)."
            )


@lru_cache
def get_settings() -> Settings:
    """Cache perquè no es rellegeixin les env vars a cada petició."""
    settings = Settings()
    settings.validate()
    return settings

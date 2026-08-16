"""
Instancia compartida del rate limiter.

Viu en un modul propi (no dins de main.py) perque tant main.py com
app/api/routes.py necessiten importar-lo, i main.py importa routes.py
-- si el limiter visques a main.py, tindriem un import circular.
"""

from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.config import get_settings

settings = get_settings()

# key_func=get_remote_address -> el limit s'aplica per IP.
# default_limits s'aplica a QUALSEVOL ruta que faci servir @limiter.limit(...)
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[f"{settings.rate_limit_per_minute}/minute"],
)

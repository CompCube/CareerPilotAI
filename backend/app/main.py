"""
Punt d'entrada de l'aplicacio FastAPI.

Aqui NOMES es configura la app (middleware, CORS, rate limit, rutes).
Cap logica de negoci en aquest fitxer.
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.api.auth_routes import router as auth_router
from app.api.profile_routes import router as profile_router
from app.api.routes import router
from app.core.config import get_settings
from sqlalchemy import inspect, text

from app.core.database import Base, engine
from app.core.limiter import limiter

settings = get_settings()

app = FastAPI(title="CareerPilot AI API", version="0.1.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Crea les taules si no existeixen -- create_all NOMES crea taules noves,
# mai afegeix columnes a taules que ja existeixen en produccio. Per aixo
# 'users'/'applications' es creen soles la primera vegada, pero afegir
# memory_text a user_profiles (que ja existia) necessita el pedaç de sota.
# Per canvis d'esquema mes grans caldria Alembic, no aquest create_all simple.
Base.metadata.create_all(bind=engine)


def _add_missing_columns() -> None:
    """Pedaç minim de migracio -- mira si falta alguna columna nova a una
    taula que ja existia, i l'afegeix amb ALTER TABLE. No es Alembic, pero
    per un projecte d'aquesta mida i nomes columnes nullable, es suficient
    i evita haver de tocar la base de dades a ma cada cop que s'afegeix
    un camp nou a un model existent."""
    inspector = inspect(engine)
    if "user_profiles" not in inspector.get_table_names():
        return
    existing_columns = {c["name"] for c in inspector.get_columns("user_profiles")}
    if "memory_text" not in existing_columns:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE user_profiles ADD COLUMN memory_text TEXT"))
            conn.commit()


_add_missing_columns()

# --- CORS: nomes el frontend desplegat pot cridar aquesta API ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """No exposem mai el detall intern de l'error a l'usuari (podria filtrar
    informacio del sistema) -- nomes un missatge generic. El detall real va
    als logs del servidor."""
    return JSONResponse(
        status_code=500,
        content={"detail": "Error intern del servidor. Torna-ho a provar."},
    )


app.include_router(router)
app.include_router(auth_router)
app.include_router(profile_router)

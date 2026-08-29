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
from app.api.routes import router
from app.core.config import get_settings
from app.core.database import Base, engine
from app.core.limiter import limiter

settings = get_settings()

app = FastAPI(title="CareerPilot AI API", version="0.1.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Crea les taules si no existeixen -- suficient per avui (nomes taula
# 'users'). Per canvis d'esquema mes endavant caldria Alembic, no aquest
# create_all simple.
Base.metadata.create_all(bind=engine)

# --- CORS: nomes el frontend desplegat pot cridar aquesta API ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
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

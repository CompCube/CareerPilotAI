"""
Seguretat d'autenticacio.

Flux: el frontend fa servir Google Identity Services (JS del navegador,
sense cap redirect al backend) i obte un "ID token" signat per Google.
El frontend l'envia UN COP a POST /auth/google. El backend el verifica
contra les claus publiques de Google (mai ens hem de refiar d'un token
sense verificar-lo criptograficament), crea/troba l'usuari, i emet el
NOSTRE PROPI JWT -- el frontend fa servir aquest, no el de Google, a
partir d'aqui.

Decisio de disseny (ja presa fa setmanes): el JWT viatja com a capçalera
Authorization: Bearer <token>, MAI com a cookie -- evita tots els
problemes de cookies entre dominis (frontend i backend en dominis
diferents: Vercel i Railway).
"""

from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.database import get_db
from app.models.db_models import User

_bearer_scheme = HTTPBearer(auto_error=False)


class AuthError(Exception):
    """Error d'autenticacio -- credencial invalida, expirada, o configuracio
    d'auth incompleta al servidor."""


def verify_google_id_token(google_token: str) -> dict:
    """Verifica el token de Google criptograficament -- mai ens refiem
    d'un token sense comprovar-ne la signatura contra Google mateix."""
    settings = get_settings()
    if not settings.google_client_id:
        raise AuthError("GOOGLE_CLIENT_ID no configurat al servidor.")
    try:
        payload = google_id_token.verify_oauth2_token(
            google_token, google_requests.Request(), settings.google_client_id
        )
    except ValueError as exc:
        raise AuthError(f"Token de Google invalid: {exc}") from exc
    return payload  # conte 'sub' (google id), 'email', 'name'


def create_access_token(user_id: int, email: str) -> str:
    settings = get_settings()
    if not settings.jwt_secret:
        raise AuthError("JWT_SECRET no configurat al servidor.")
    expire = datetime.now(timezone.utc) + timedelta(days=settings.jwt_expiry_days)
    payload = {"sub": str(user_id), "email": email, "exp": expire}
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")


def decode_access_token(token: str) -> dict:
    settings = get_settings()
    if not settings.jwt_secret:
        raise AuthError("JWT_SECRET no configurat al servidor.")
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
    except jwt.ExpiredSignatureError as exc:
        raise AuthError("Sessio expirada, torna a iniciar sessio.") from exc
    except jwt.InvalidTokenError as exc:
        raise AuthError(f"Token invalid: {exc}") from exc


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Dependency de FastAPI per protegir endpoints -- llegeix el capçalera
    Authorization: Bearer <token>, el valida, i retorna l'usuari real."""
    if credentials is None:
        raise HTTPException(status_code=401, detail="No autenticat.")
    try:
        payload = decode_access_token(credentials.credentials)
    except AuthError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc

    user = db.query(User).filter(User.id == int(payload["sub"])).first()
    if user is None:
        raise HTTPException(status_code=401, detail="Usuari no trobat.")
    return user


def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
    db: Session = Depends(get_db),
) -> User | None:
    """Com get_current_user, pero mai llança error -- per a endpoints com
    /tailor que funcionen igual amb o sense sessio iniciada (el Tailor
    es usable sense compte; nomes es fa servir la memoria si n'hi ha)."""
    if credentials is None:
        return None
    try:
        payload = decode_access_token(credentials.credentials)
    except AuthError:
        return None
    return db.query(User).filter(User.id == int(payload["sub"])).first()

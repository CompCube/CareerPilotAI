"""
Rutes d'autenticacio. Fitxer separat de routes.py (agents) perque son
responsabilitats diferents -- login no te res a veure amb l'orquestracio
dels agents.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import (
    AuthError,
    create_access_token,
    get_current_user,
    verify_google_id_token,
)
from app.models.db_models import User
from app.models.schemas import GoogleLoginRequest, LoginResponse, UserOut

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/google", response_model=LoginResponse)
def login_with_google(payload: GoogleLoginRequest, db: Session = Depends(get_db)) -> LoginResponse:
    try:
        google_data = verify_google_id_token(payload.google_id_token)
    except AuthError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc

    google_id = google_data["sub"]
    email = google_data["email"]
    name = google_data.get("name")

    user = db.query(User).filter(User.google_id == google_id).first()
    if user is None:
        user = User(google_id=google_id, email=email, name=name)
        db.add(user)
        db.commit()
        db.refresh(user)

    try:
        token = create_access_token(user_id=user.id, email=user.email)
    except AuthError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return LoginResponse(access_token=token, user=UserOut(id=user.id, email=user.email, name=user.name))


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)) -> UserOut:
    """Endpoint protegit -- prova que el JWT funciona de cap a cap."""
    return UserOut(id=current_user.id, email=current_user.email, name=current_user.name)

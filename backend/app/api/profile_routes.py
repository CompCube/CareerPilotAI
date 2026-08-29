"""
Rutes de perfil (CV base) i historial de candidatures. Totes protegides --
requereixen login (get_current_user), ja que son dades personals de l'usuari.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.db_models import Application, User, UserProfile
from app.models.schemas import (
    AnalyzeResponse,
    ApplicationCreateRequest,
    ApplicationDetail,
    ApplicationSummary,
    ProfileOut,
    ProfileUpdateRequest,
    TailorSections,
)

router = APIRouter(tags=["profile"])


@router.get("/profile", response_model=ProfileOut)
def get_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> ProfileOut:
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    return ProfileOut(base_cv_text=profile.base_cv_text if profile else None)


@router.put("/profile", response_model=ProfileOut)
def update_profile(
    payload: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ProfileOut:
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if profile is None:
        profile = UserProfile(user_id=current_user.id, base_cv_text=payload.base_cv_text)
        db.add(profile)
    else:
        profile.base_cv_text = payload.base_cv_text
    db.commit()
    return ProfileOut(base_cv_text=payload.base_cv_text)


@router.post("/applications", response_model=ApplicationSummary)
def create_application(
    payload: ApplicationCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ApplicationSummary:
    application = Application(
        user_id=current_user.id,
        title=payload.title,
        jd_text=payload.jd_text,
        cv_text_used=payload.cv_text_used,
        analysis_json=payload.analysis.model_dump_json() if payload.analysis else None,
        tailor_sections_json=payload.tailor_sections.model_dump_json() if payload.tailor_sections else None,
    )
    db.add(application)
    db.commit()
    db.refresh(application)
    return ApplicationSummary(
        id=application.id,
        title=application.title,
        applied=application.applied,
        created_at=application.created_at.isoformat(),
    )


@router.get("/applications", response_model=list[ApplicationSummary])
def list_applications(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> list[ApplicationSummary]:
    applications = (
        db.query(Application)
        .filter(Application.user_id == current_user.id)
        .order_by(Application.created_at.desc())
        .all()
    )
    return [
        ApplicationSummary(
            id=a.id, title=a.title, applied=a.applied, created_at=a.created_at.isoformat()
        )
        for a in applications
    ]


@router.get("/applications/{application_id}", response_model=ApplicationDetail)
def get_application(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ApplicationDetail:
    application = (
        db.query(Application)
        .filter(Application.id == application_id, Application.user_id == current_user.id)
        .first()
    )
    if application is None:
        raise HTTPException(status_code=404, detail="Application not found.")

    return ApplicationDetail(
        id=application.id,
        title=application.title,
        jd_text=application.jd_text,
        cv_text_used=application.cv_text_used,
        analysis=AnalyzeResponse.model_validate_json(application.analysis_json)
        if application.analysis_json
        else None,
        tailor_sections=TailorSections.model_validate_json(application.tailor_sections_json)
        if application.tailor_sections_json
        else None,
        applied=application.applied,
        created_at=application.created_at.isoformat(),
    )

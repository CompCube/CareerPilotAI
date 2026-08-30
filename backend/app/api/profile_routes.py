"""
Rutes de perfil (CV base) i historial de candidatures. Totes protegides --
requereixen login (get_current_user), ja que son dades personals de l'usuari.
"""

import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.agents.memory_agent import update_user_memory
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

logger = logging.getLogger("careerpilot.memory")
router = APIRouter(tags=["profile"])


def _update_memory_after_application(db: Session, current_user: User, payload: ApplicationCreateRequest) -> None:
    """Crida l'agent de memoria i desa el resultat -- si falla per qualsevol
    motiu (API caiguda, etc.), NO trenca el guardat de la candidatura,
    nomes es queda sense actualitzar la memoria aquest cop."""
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    existing_memory = profile.memory_text if profile else None

    sections = payload.tailor_sections
    resume_summary = "\n".join(
        filter(None, [sections.professional_summary, sections.achievements, sections.professional_experience])
    )

    try:
        updated_memory = update_user_memory(existing_memory, payload.jd_text, resume_summary)
    except Exception as exc:  # noqa: BLE001 -- fire-and-forget, mai trenca el guardat principal
        logger.warning("memory_update_failed reason=%s", str(exc))
        return

    if profile is None:
        profile = UserProfile(user_id=current_user.id, memory_text=updated_memory)
        db.add(profile)
    else:
        profile.memory_text = updated_memory
    db.commit()


@router.get("/profile", response_model=ProfileOut)
def get_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> ProfileOut:
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    return ProfileOut(
        base_cv_text=profile.base_cv_text if profile else None,
        memory_text=profile.memory_text if profile else None,
    )


@router.delete("/profile/memory", response_model=ProfileOut)
def clear_profile_memory(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> ProfileOut:
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if profile is not None:
        profile.memory_text = None
        db.commit()
    return ProfileOut(
        base_cv_text=profile.base_cv_text if profile else None,
        memory_text=None,
    )


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


MAX_APPLICATIONS_PER_USER = 20


@router.post("/applications", response_model=ApplicationSummary)
def create_application(
    payload: ApplicationCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ApplicationSummary:
    # Limit per usuari -- si ja n'hi ha 20, esborra la mes antiga abans de
    # crear-ne una de nova. Silenciós (auto-desat en segon pla, l'usuari
    # no ho decideix explicitament) -- millor podar que rebutjar.
    existing_count = db.query(Application).filter(Application.user_id == current_user.id).count()
    if existing_count >= MAX_APPLICATIONS_PER_USER:
        oldest = (
            db.query(Application)
            .filter(Application.user_id == current_user.id)
            .order_by(Application.created_at.asc())
            .first()
        )
        if oldest is not None:
            db.delete(oldest)

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

    # Actualitza la memoria evolutiva del perfil -- nomes te sentit si hi
    # ha seccions retocades (si nomes es una anàlisi, no hi ha prou
    # evidencia nova de com aquesta persona defensa les competencies).
    if payload.tailor_sections is not None:
        _update_memory_after_application(db, current_user, payload)

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


@router.delete("/applications/{application_id}")
def delete_application(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    application = (
        db.query(Application)
        .filter(Application.id == application_id, Application.user_id == current_user.id)
        .first()
    )
    if application is None:
        raise HTTPException(status_code=404, detail="Application not found.")
    db.delete(application)
    db.commit()
    return {"deleted": True}


@router.patch("/applications/{application_id}", response_model=ApplicationSummary)
def toggle_applied(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ApplicationSummary:
    application = (
        db.query(Application)
        .filter(Application.id == application_id, Application.user_id == current_user.id)
        .first()
    )
    if application is None:
        raise HTTPException(status_code=404, detail="Application not found.")
    application.applied = not application.applied
    db.commit()
    return ApplicationSummary(
        id=application.id,
        title=application.title,
        applied=application.applied,
        created_at=application.created_at.isoformat(),
    )

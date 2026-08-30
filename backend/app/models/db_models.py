"""
Models de base de dades. Avui afegim les dues taules de la Capa 1:
UserProfile (CV base) i Application (historial de candidatures).
"""

from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    google_id = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    profile = relationship("UserProfile", back_populates="user", uselist=False)
    applications = relationship("Application", back_populates="user")


class UserProfile(Base):
    """CV base de l'usuari -- s'usa per defecte quan marca el checkbox
    'Usa el meu CV base' en lloc d'enganxar-lo cada vegada.

    memory_text: resum evolutiu de qui es aquesta persona (background,
    competencies que pot defensar, patrons habituals). NO es un historial
    en brut -- cada cop que es completa un Tailor, es RESCRIU aquest
    resum (fusionant el que ja sabiem amb el que hem apres ara), no
    s'hi afegeix text indefinidament."""

    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    base_cv_text = Column(Text, nullable=True)
    memory_text = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="profile")


class Application(Base):
    """Una entrada de l'historial -- una JD analitzada, amb el resultat
    de l'Analyzer i (si es va fer) les seccions del Tailor, guardats com
    a JSON de text. Nomes es guarda quan l'usuari ha iniciat sessio."""

    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    jd_text = Column(Text, nullable=False)
    cv_text_used = Column(Text, nullable=False)
    analysis_json = Column(Text, nullable=True)
    tailor_sections_json = Column(Text, nullable=True)
    applied = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="applications")

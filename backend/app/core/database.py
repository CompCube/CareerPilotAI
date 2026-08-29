"""
Connexio a la base de dades. DATABASE_URL ve de Railway (variable injectada
automaticament quan afegeixes el plugin de Postgres al mateix projecte).

En local, si no hi ha DATABASE_URL, cau a un fitxer SQLite -- aixi es pot
desenvolupar sense necessitar Postgres instal·lat a l'ordinador.
"""

import os

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./careerpilot_dev.db")

# Railway (i molts proveidors) donen la URL amb prefix postgres://, pero
# SQLAlchemy 2.x exigeix postgresql:// explicit.
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """Dependency de FastAPI: obre una sessio, la tanca sempre al final."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.core.config import settings

import os

# Resolve relative SQLite paths to backend directory for directory-independent execution
db_url = settings.DATABASE_URL
connect_args = {}
if db_url.startswith("sqlite:///."):
    backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    rel_path = db_url.replace("sqlite:///.", "").lstrip("/\\")
    abs_path = os.path.join(backend_dir, rel_path).replace("\\", "/")
    db_url = f"sqlite:///{abs_path}"

if db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    db_url,
    connect_args=connect_args,
    pool_pre_ping=True,
    echo=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Base(DeclarativeBase):
    pass

def get_db() -> Generator:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

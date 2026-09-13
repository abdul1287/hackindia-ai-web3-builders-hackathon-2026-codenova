import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from sqlalchemy import text
from app.core.config import settings
from app.core.database import engine, Base
from app.routers import analyze_router, complaints_router, authorities_router, location_router
import app.models  # ensure models are loaded

# Ensure local uploads directory exists
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Auto-create tables for local development/sqlite ease
    Base.metadata.create_all(bind=engine)
    # Ensure resolution_image_url column exists in complaints table
    try:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE complaints ADD COLUMN resolution_image_url TEXT"))
            conn.commit()
    except Exception:
        pass  # Column already exists
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Production-quality REST API backend for CivicAI grievance redressal platform.",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount local uploads directory for static image serving
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Mount Routers under /api
app.include_router(analyze_router, prefix=settings.API_V1_STR)
app.include_router(complaints_router, prefix=settings.API_V1_STR)
app.include_router(authorities_router, prefix=settings.API_V1_STR)
app.include_router(location_router, prefix=settings.API_V1_STR)

@app.get("/api/health", tags=["Health"], summary="API Health Check")
def health_check():
    """Health check endpoint confirming service status."""
    return {
        "status": "ok",
        "service": "CivicAI Backend"
    }

# Centralized Error Handlers
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail, "status_code": exc.status_code}
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": exc.errors(), "message": "Validation failed for incoming payload."}
    )

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    # Log the exception internally without exposing stack traces to client
    print(f"[Unhandled Error] {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An unexpected internal server error occurred. Please try again later."}
    )

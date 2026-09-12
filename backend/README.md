# CivicAI — FastAPI Backend

Production-quality, hackathon-ready REST API backend for **CivicAI**, an AI-powered municipal grievance redressal and tracking platform.

---

## Key Capabilities

1. **Multimodal AI Analysis (`POST /api/analyze`)**:
   - Analyzes civic hazard photographs (potholes, garbage, broken streetlights, water pipeline leaks, uncovered manholes) alongside optional citizen notes and GPS coordinates.
   - Strictly enforces allowed categories and severity metrics.
   - Includes an intelligent zero-downtime heuristic fallback when `LLM_API_KEY` is not provided.

2. **Deterministic Authority Routing**:
   - The AI identifies the hazard category; the backend deterministically maps the category to the legally responsible municipal department:
     - `Pothole` / `Road Infrastructure` &rarr; **Public Works Department**
     - `Garbage` / `Sanitation` &rarr; **Sanitation Department**
     - `Streetlight` / `Electrical` &rarr; **Electrical Department**
     - `Water Leakage` / `Water Supply` &rarr; **Water Department**
     - `Open Manhole` / `Urban Safety` &rarr; **Municipal Engineering Department**

3. **Auditable Complaint Lifecycle (`POST /api/complaints`, `PATCH /api/complaints/{id}/status`)**:
   - Generates unique tracking codes (`CIV-2026-XXXXX`).
   - Every status transition (`SUBMITTED` &rarr; `ASSIGNED` &rarr; `IN_PROGRESS` &rarr; `RESOLVED`) is logged in an immutable `status_history` audit table.

4. **Storage & Cloudinary Integration**:
   - Direct integration with Cloudinary for scalable image delivery, with an automatic local static fallback (`/uploads/{file}`) for offline demo evaluation.

---

## Project Architecture

```
backend/
├── app/
│   ├── main.py                  # FastAPI application, CORS, exception handlers
│   ├── core/
│   │   ├── config.py            # Pydantic Settings reading .env
│   │   └── database.py          # SQLAlchemy 2.0 session factory & Base
│   ├── models/                  # SQLAlchemy ORM models (authorities, complaints, status_history)
│   ├── schemas/                 # Pydantic v2 validation & response schemas
│   ├── routers/                 # API route controllers (analyze, complaints, authorities)
│   ├── services/                # Business logic (AI vision, Cloudinary, Authority routing, Complaints)
│   ├── utils/                   # ID generator, GPS coordinate validators, MIME checks
│   └── seed.py                  # Preloaded realistic hackathon demo data
├── alembic/                     # Alembic database migration scripts
├── tests/                       # Pytest unit & integration test suite
├── .env.example                 # Environment configuration template
├── requirements.txt             # Python dependencies
├── alembic.ini                  # Alembic configuration
└── README.md                    # Backend documentation
```

---

## Quickstart Guide

### 1. Prerequisites
- Python 3.10+ (Tested on Python 3.14)
- PostgreSQL (or SQLite for local zero-configuration execution)

### 2. Installation
```bash
cd backend
python -m venv venv

# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Edit `.env` to configure your database and API keys:
```env
# Database: PostgreSQL or SQLite
DATABASE_URL=sqlite:///./civicai.db
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/civicai

# Multimodal LLM (Gemini or OpenAI compatible)
LLM_API_KEY=your_gemini_api_key_here
LLM_MODEL=gemini-1.5-flash

# Cloudinary Image Storage (Optional - falls back to local storage if blank)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# React Frontend Origin
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

### 4. Database Migrations
Apply Alembic migrations to set up tables, foreign keys, and indexes:
```bash
alembic upgrade head
```

### 5. Seed Realistic Demo Data
Seed the database with municipal authorities and realistic preloaded complaints (`CIV-2026-10482`, `CIV-2026-10481`, `CIV-2026-10480`):
```bash
python app/seed.py
```

### 6. Start Development Server
```bash
uvicorn app.main:app --reload --port 8000
```

The API will be available at: `http://localhost:8000`
Interactive Swagger UI documentation: `http://localhost:8000/docs`

---

## API Reference

### Health Check
- `GET /api/health`
  - Returns `{"status": "ok", "service": "CivicAI Backend"}`

### AI Analysis
- `POST /api/analyze`
  - **Body (multipart/form-data)**:
    - `image`: File (JPEG, PNG, WEBP)
    - `latitude`: Float (e.g. `28.6280`)
    - `longitude`: Float (e.g. `77.3649`)
    - `optional_text`: String
  - **Returns**: Analyzed issue type, category, severity, safety risk, AI-drafted complaint, and deterministically resolved authority. *(Does not store to database)*.

### Complaints
- `POST /api/complaints`
  - **Body (JSON)**:
    ```json
    {
      "issue_type": "pothole",
      "category": "road_infrastructure",
      "severity": "high",
      "safety_risk": true,
      "complaint_title": "Deep Pothole at Sector 62",
      "complaint_description": "Dangerous pothole creating an accident hazard.",
      "image_url": "https://...",
      "latitude": 28.6280,
      "longitude": 77.3649,
      "location_text": "Sector 62, Noida",
      "authority_id": 1
    }
    ```
  - **Returns**: `201 Created` with generated complaint ID (`CIV-2026-10482`), status `SUBMITTED`, and initial timeline record.

- `GET /api/complaints`
  - **Query Params**: `status`, `severity`, `category`, `search`, `page`, `limit`
  - **Returns**: Paginated list of complaints.

- `GET /api/complaints/{id}`
  - **Returns**: Detailed complaint dossier including full `status_history` audit trail.

- `PATCH /api/complaints/{id}/status`
  - **Body (JSON)**:
    ```json
    {
      "status": "IN_PROGRESS",
      "note": "Repair team dispatched with cold-mix asphalt."
    }
    ```
  - **Allowed statuses**: `SUBMITTED`, `ASSIGNED`, `IN_PROGRESS`, `RESOLVED`.
  - **Returns**: Updated complaint with appended audit entry.

### Authority Operations
- `GET /api/authorities`
  - Returns list of municipal authorities.
- `GET /api/authorities/{id}/complaints`
  - Returns complaints routed to a specific department, filterable by status/severity.

---

## Running Automated Tests

Run the full pytest test suite:
```bash
pytest tests -v
```

Tests cover:
- Health check verification
- Deterministic category & authority routing
- Tracking ID formatting (`CIV-YYYY-XXXXX`)
- Complaint creation and retrieval
- Multi-step status transitions and immutable audit logging
- Validation against invalid statuses and invalid GPS coordinates
- Authority operational endpoints

# CivicAI — AI-Powered Municipal Grievance Redressal Platform

> **Hackathon Team**: **CodeNova**  
> **Repository**: `HackIndiaXYZ/hackindia-ai-web3-builders-hackathon-2026-codenova`  
> **Track**: AI & Civic Infrastructure  

---

## 🏛️ Overview

**CivicAI** is an intelligent civic-tech platform that transforms citizen grievance reporting. Instead of filling out complex, multi-page municipal forms or figuring out which government department handles a particular issue, citizens simply **snap a photo** of a civic hazard.

Using **Google Gemini 3.6 Flash Multimodal Vision AI**, CivicAI automatically:
1. **Analyzes visual evidence** (potholes, garbage accumulation, broken streetlights, water pipeline leaks, uncovered manholes).
2. **Estimates severity & public safety risks** (Low, Medium, High, Critical).
3. **Generates formal, actionable municipal complaint dossiers** with structured titles and detailed descriptions.
4. **Deterministically routes** the grievance to the legally responsible municipal department with an immutable audit trail.

---

## ✨ Key Capabilities

| Feature | Description |
|---|---|
| **📸 Multimodal Vision Analysis** | Powered by Gemini 3.6 Flash to perform visual hazard detection and severity assessment from photo pixels in real time. |
| **🏢 Deterministic Department Routing** | Automatically dispatches grievances to the responsible authority (*Public Works*, *Sanitation*, *Electrical*, *Water Supply*, or *Municipal Engineering*). |
| **🎫 Auditable Complaint Lifecycle** | Generates unique tracking tickets (`CIV-2026-XXXXX`) and logs every status transition (`SUBMITTED` &rarr; `ASSIGNED` &rarr; `IN_PROGRESS` &rarr; `RESOLVED`). |
| **📍 Geolocation Tagging** | Captures browser GPS coordinates and supports incident address verification. |
| **📊 Authority Operations Dashboard** | Department-specific management portal allowing municipal officials to review grievances, update resolution progress, and record audit notes. |

---

## 🛠️ Technology Stack

- **Frontend**: React 19, Vite 8, Tailwind CSS v4, Lucide Icons, React Router 7
- **Backend**: FastAPI, Uvicorn, Pydantic v2, SQLAlchemy 2.0
- **AI / Multimodal Vision**: Google Gemini 3.6 Flash API (`inline_data` vision pipeline)
- **Database**: SQLite (Zero-config local development) / PostgreSQL ready
- **Storage**: Local static fallback (`/uploads`) + Cloudinary cloud storage support

---

## 🚀 Quickstart Guide

### Prerequisites
- **Node.js**: v18+ (Tested on v20+)
- **Python**: 3.10+ (Tested on Python 3.14)
- **Gemini API Key**: Free API key from [Google AI Studio](https://aistudio.google.com/app/apikey)

---

### 1. Backend Setup

```bash
# Navigate to the backend directory
cd backend

# Create and activate a virtual environment
python -m venv venv

# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Configure environment variables
# (Copy .env.example to .env and add your Gemini API key)
cp .env.example .env
```

Ensure your `backend/.env` contains:
```env
DATABASE_URL=sqlite:///./civicai.db
LLM_API_KEY=your_gemini_api_key_here
LLM_MODEL=gemini-3.6-flash
API_V1_STR=/api
ENVIRONMENT=development
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

Seed initial municipal authorities and start the API server:
```bash
# Seed initial authorities & demo complaints
python app/seed.py

# Start FastAPI server
uvicorn app.main:app --reload --port 8000
```
- API will be live at: `http://localhost:8000`
- Interactive Swagger API documentation: `http://localhost:8000/docs`

---

### 2. Frontend Setup

In a new terminal window:
```bash
# Navigate to project root
cd ..

# Install frontend dependencies
npm install

# Start Vite dev server
npm run dev
```
- Web Application will be live at: `http://localhost:5173`

---

## 📡 Core API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/analyze` | Multimodal Vision analysis on uploaded image + GPS metadata |
| `POST` | `/api/complaints` | Registers official grievance with unique `CIV-2026-XXXXX` ticket |
| `GET` | `/api/complaints` | Paginated listing with status, department, and severity filters |
| `GET` | `/api/complaints/{id}` | Retrieves complaint dossier and immutable timeline history |
| `PATCH` | `/api/complaints/{id}/status` | Updates status (`SUBMITTED` &rarr; `ASSIGNED` &rarr; `IN_PROGRESS` &rarr; `RESOLVED`) |
| `GET` | `/api/authorities` | Lists registered municipal departments |
| `GET` | `/api/health` | Service health check |

---

## 🔒 Security & Privacy

- Secret API keys (`LLM_API_KEY`, Cloudinary keys) are strictly loaded via `.env` and kept out of version control via `.gitignore`.
- Image uploads are validated against strict MIME types and file size bounds to prevent malicious payloads.
- Status history is immutable to prevent tampering with municipal accountability records.

---

## 👥 Team CodeNova
Built for **HackIndia 2026 AI & Web3 Builders Hackathon**.

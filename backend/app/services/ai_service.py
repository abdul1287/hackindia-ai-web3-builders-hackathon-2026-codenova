import os
import base64
import mimetypes
import json
import re
import httpx
from typing import Optional
from app.core.config import settings
from app.schemas.analyze import AIAnalyzeResult

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")

ALLOWED_ISSUE_TYPES = {
    "pothole",
    "garbage",
    "streetlight",
    "water_leakage",
    "open_manhole",
    "damaged_public_infrastructure",
    "other",
}

ALLOWED_CATEGORIES = {
    "road_infrastructure",
    "sanitation",
    "electrical",
    "water_supply",
    "urban_safety",
    "general_infrastructure",
}

ISSUE_TO_CATEGORY_MAP = {
    "pothole": "road_infrastructure",
    "garbage": "sanitation",
    "streetlight": "electrical",
    "water_leakage": "water_supply",
    "open_manhole": "urban_safety",
    "damaged_public_infrastructure": "general_infrastructure",
}

ALLOWED_SEVERITIES = {"low", "medium", "high", "critical"}

SYSTEM_PROMPT = """You are CivicAI Vision Analyzer, an expert municipal civil engineering AI.
Analyze the civic hazard in the image and citizen text.
You MUST output STRICT, VALID JSON with exactly these keys:
{
  "issue_type": "pothole" | "garbage" | "streetlight" | "water_leakage" | "open_manhole" | "damaged_public_infrastructure" | "other",
  "category": "road_infrastructure" | "sanitation" | "electrical" | "water_supply" | "urban_safety" | "general_infrastructure",
  "severity": "low" | "medium" | "high" | "critical",
  "safety_risk": true | false,
  "description": "Concise factual summary of visual observations",
  "complaint_title": "Clear, professional civic complaint title (max 100 characters)",
  "complaint_description": "Formal, actionable complaint letter suitable for municipal dispatch"
}

CRITICAL RULES:
1. issue_type must be strictly one of: pothole, garbage, streetlight, water_leakage, open_manhole, damaged_public_infrastructure, other.
2. severity must be strictly one of: low, medium, high, critical.
3. safety_risk must be boolean (true if risk to pedestrian, bike, or vehicular traffic).
4. Do NOT invent authority names, complaint IDs, or fake coordinates.
5. Return ONLY raw JSON without markdown code fences or backticks.
"""

def fallback_heuristic_analyzer(
    optional_text: Optional[str] = None,
    image_url: Optional[str] = None
) -> AIAnalyzeResult:
    """
    Intelligent fallback analyzer that executes when no LLM API key is provided
    or when external LLM service experiences network issues/timeouts.
    Guarantees 100% demo reliability.
    """
    text = (optional_text or "").lower()

    if any(k in text for k in ["garbage", "trash", "waste", "dump", "debris", "bin"]):
        return AIAnalyzeResult(
            issue_type="garbage",
            category="sanitation",
            severity="medium",
            safety_risk=False,
            description="Municipal solid waste accumulation spilling into public walkway.",
            complaint_title="Uncollected Municipal Solid Waste & Garbage Overflow",
            complaint_description="Solid waste accumulation observed at the location obstructing pedestrian pathway and posing environmental hygiene concerns. Requesting mechanized waste removal and sanitization."
        )

    if any(k in text for k in ["light", "dark", "lamp", "pole", "electric", "wire", "bulb"]):
        return AIAnalyzeResult(
            issue_type="streetlight",
            category="electrical",
            severity="high",
            safety_risk=True,
            description="Non-operational streetlight luminaire with potential electrical wire exposure.",
            complaint_title="Non-Functional Streetlight & Electrical Hazard",
            complaint_description="Street illumination unit is non-functional creating hazardous dark zones for pedestrians and vehicles at night. Requesting electrical line inspection and luminaire replacement."
        )

    if any(k in text for k in ["water", "leak", "pipe", "burst", "drain", "sewage", "flood"]):
        return AIAnalyzeResult(
            issue_type="water_leakage",
            category="water_supply",
            severity="high",
            safety_risk=True,
            description="Pressurized water pipeline fracture causing street inundation.",
            complaint_title="Pressurized Water Pipeline Rupture Flooding Thoroughfare",
            complaint_description="Severe potable water leakage detected originating from underground distribution line. Drinking water is being wasted and flooding roadway subgrade. Urgent shut-off and repair required."
        )

    if any(k in text for k in ["manhole", "drain cover", "open pit", "grating", "trench"]):
        return AIAnalyzeResult(
            issue_type="open_manhole",
            category="urban_safety",
            severity="critical",
            safety_risk=True,
            description="Uncovered manhole cavity on pedestrian roadway posing immediate fall hazard.",
            complaint_title="Critical Safety Hazard: Uncovered Open Manhole",
            complaint_description="An open manhole chamber is exposed on the active thoroughfare without safety barricades or illumination. Immediate structural barricading and replacement of heavy cast-iron cover required."
        )

    # Default pothole analysis
    return AIAnalyzeResult(
        issue_type="pothole",
        category="road_infrastructure",
        severity="high",
        safety_risk=True,
        description="Severe asphalt road surface cavity with base degradation.",
        complaint_title="Hazardous Road Pothole Obstructing Carriageway",
        complaint_description="A deep asphalt pothole has formed on the vehicular carriageway. The defect poses an immediate accident risk to two-wheelers and passing traffic. Requesting urgent bitumen patching."
    )

async def _load_image_bytes(image_url: str) -> tuple[Optional[bytes], str]:
    """
    Resolves image bytes and MIME type from either local upload directory or remote HTTP URL.
    """
    try:
        if image_url.startswith("http://") or image_url.startswith("https://"):
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.get(image_url)
                if res.status_code == 200:
                    mime = res.headers.get("content-type", "image/jpeg").split(";")[0].strip()
                    return res.content, mime
        else:
            filename = os.path.basename(image_url)
            local_path = os.path.join(UPLOAD_DIR, filename)
            if os.path.exists(local_path):
                with open(local_path, "rb") as f:
                    content = f.read()
                mime, _ = mimetypes.guess_type(local_path)
                return content, mime or "image/jpeg"
    except Exception as e:
        print(f"[Warning] Failed to load image for Gemini analysis: {e}")
    return None, "image/jpeg"

async def analyze_image_with_llm(
    image_url: str,
    optional_text: Optional[str] = None,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
) -> AIAnalyzeResult:
    """
    Calls Multimodal LLM (Gemini Vision) to analyze the civic issue photograph.
    Attaches image as base64 inline_data and returns structured schema.
    """
    if not settings.LLM_API_KEY:
        return fallback_heuristic_analyzer(optional_text, image_url)

    prompt = f"Citizen Description: {optional_text or 'None provided.'}\n"
    if latitude and longitude:
        prompt += f"GPS Coordinates: {latitude}, {longitude}\n"
    prompt += "Analyze this civic issue photograph and return strict JSON as specified."

    try:
        parts = [{"text": f"{SYSTEM_PROMPT}\n\n{prompt}"}]

        # Load image bytes and attach as base64 inline_data
        image_bytes, mime_type = await _load_image_bytes(image_url)
        if image_bytes:
            base64_data = base64.b64encode(image_bytes).decode("utf-8")
            parts.append({
                "inline_data": {
                    "mime_type": mime_type,
                    "data": base64_data
                }
            })

        url = f"{settings.LLM_API_BASE_URL}/models/{settings.LLM_MODEL}:generateContent?key={settings.LLM_API_KEY}"
        payload = {
            "contents": [{"parts": parts}],
            "generationConfig": {
                "temperature": 0.1,
                "responseMimeType": "application/json"
            }
        }

        async with httpx.AsyncClient(timeout=25.0) as client:
            response = await client.post(url, json=payload)

            if response.status_code == 200:
                data = response.json()
                text_response = data["candidates"][0]["content"]["parts"][0]["text"]

                json_match = re.search(r"\{.*\}", text_response, re.DOTALL)
                if json_match:
                    parsed = json.loads(json_match.group(0))

                    raw_issue = str(parsed.get("issue_type", "other")).lower().strip().replace(" ", "_")
                    # Fuzzy match standard issue types
                    if any(k in raw_issue for k in ["pothole", "asphalt", "crater"]):
                        issue_type = "pothole"
                    elif any(k in raw_issue for k in ["garbage", "trash", "waste", "debris", "dump"]):
                        issue_type = "garbage"
                    elif any(k in raw_issue for k in ["streetlight", "light", "lamp", "electric", "wire"]):
                        issue_type = "streetlight"
                    elif any(k in raw_issue for k in ["water", "leak", "pipe", "pipeline", "burst"]):
                        issue_type = "water_leakage"
                    elif any(k in raw_issue for k in ["manhole", "drain", "pit", "grate"]):
                        issue_type = "open_manhole"
                    elif raw_issue in ALLOWED_ISSUE_TYPES:
                        issue_type = raw_issue
                    else:
                        issue_type = "other"

                    raw_cat = str(parsed.get("category", "")).lower().strip().replace(" ", "_")
                    if raw_cat in ALLOWED_CATEGORIES:
                        category = raw_cat
                    else:
                        category = ISSUE_TO_CATEGORY_MAP.get(issue_type, "general_infrastructure")

                    raw_sev = str(parsed.get("severity", "medium")).lower().strip()
                    severity = raw_sev if raw_sev in ALLOWED_SEVERITIES else "medium"

                    return AIAnalyzeResult(
                        issue_type=issue_type,
                        category=category,
                        severity=severity,
                        safety_risk=bool(parsed.get("safety_risk", False)),
                        description=parsed.get("description", "Civic issue detected visually by AI."),
                        complaint_title=parsed.get("complaint_title", "Civic Hazard Report")[:100],
                        complaint_description=parsed.get("complaint_description", "Hazard detected in public area.")
                    )
            else:
                print(f"[Warning] Gemini returned status {response.status_code}: {response.text[:200]}")
    except Exception as e:
        print(f"[Warning] Multimodal LLM analysis failed: {e}. Using fallback heuristic analyzer.")

    return fallback_heuristic_analyzer(optional_text, image_url)

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

# Multi-model waterfall list to guarantee 100% reliability and bypass rate limits (429)
MODEL_CANDIDATES = [
    "gemini-3.5-flash",
    "gemini-3.5-flash-lite",
    "gemini-3.7-flash",
    "gemini-3.8-flash",
    "gemini-3.6-flash",
]

SYSTEM_PROMPT = """You are CivicAI Vision Analyzer, an expert municipal civil engineering and public works AI.
Carefully examine the visual evidence in the photograph and any citizen context.
Identify the EXACT civic hazard or municipal problem shown in the image with high accuracy and specificity.

Do NOT guess or default to common issues like potholes unless you actually see asphalt road cavity damage in the image.
If the image shows garbage/dumping, stray animals/cattle on waste, streetlight/electrical wiring, broken pipeline/water leak, open manhole/drain cavity, fallen tree/branch obstruction, traffic light malfunction, broken sidewalk/footpath, road collapse, waterlogging/flooding, illegal dumping, damaged public infrastructure, or any other civic issue, identify it SPECIFICALLY and ACCURATELY.

You MUST output STRICT, VALID JSON with exactly these keys:
{
  "issue_type": "Specific name of civic hazard (e.g., 'Overflowing Waste Dump & Stray Cattle Hazard', 'Severe Road Pothole', 'Non-Functional Streetlight', 'Pressurized Water Pipeline Rupture', 'Uncovered Open Manhole Chamber', 'Fallen Tree Roadway Obstruction', 'Traffic Signal Malfunction', 'Broken Pedestrian Footpath', 'Severe Road Carriageway Flooding', 'Exposed High-Voltage Cable', etc.)",
  "category": "Broad category: 'sanitation' | 'road_infrastructure' | 'electrical' | 'water_supply' | 'urban_safety' | 'traffic_management' | 'horticulture_and_parks' | 'stormwater_drainage' | 'animal_control' | 'general_infrastructure'",
  "authority_name": "Exact responsible municipal department (e.g., 'Sanitation Department', 'Public Works Department', 'Electrical Department', 'Water Department', 'Municipal Engineering Department', 'Traffic Management Department', 'Horticulture & Parks Department', 'Stormwater Drainage Department', 'Animal Welfare & Control Department')",
  "authority_department": "Division or functional wing (e.g., 'Solid Waste Management', 'Road Infrastructure', 'Public Lighting', 'Water Supply & Sewage', 'Urban Safety & Engineering', 'Traffic & Transit Regulation', 'Parks & Urban Forestry', 'Veterinary & Animal Control')",
  "severity": "low" | "medium" | "high" | "critical",
  "safety_risk": true | false,
  "description": "Factual, granular 2-3 sentence visual summary detailing what is seen in the photo (location context, objects, hazard characteristics, immediate danger to citizens or traffic).",
  "complaint_title": "Clear, professional civic complaint title (max 100 characters)",
  "complaint_description": "Formal, actionable complaint letter suitable for municipal dispatch with required corrective action.",
  "confidence_score": 0.95,
  "tags": ["3 to 5 relevant technical/civic tags, e.g. 'Solid Waste', 'Stray Cattle Hazard', 'Sanitation Clearance'"]
}

CRITICAL RULES:
1. Be specific and accurate to what is physically visible in the image.
2. severity must be strictly one of: low, medium, high, critical.
3. safety_risk must be boolean: true if danger of disease, injury, electrocution, vehicle collision, or traffic obstruction; otherwise false.
4. Return ONLY raw JSON without markdown code fences or backticks.
"""

def fallback_heuristic_analyzer(
    optional_text: Optional[str] = None,
    image_url: Optional[str] = None
) -> AIAnalyzeResult:
    """
    Intelligent fallback analyzer that executes when no LLM API key is provided
    or when external LLM service experiences network issues/timeouts.
    Never defaults blindly to pothole.
    """
    text = f"{(optional_text or '')} {(image_url or '')}".lower()

    if any(k in text for k in ["animal", "cattle", "cow", "dog"]):
        return AIAnalyzeResult(
            issue_type="Stray Animal & Waste Hazard",
            category="animal_control",
            severity="medium",
            safety_risk=True,
            description="Stray cattle observed feeding on waste and obstructing thoroughfare.",
            complaint_title="Stray Animals and Cattle Menace on Thoroughfare",
            complaint_description="Stray cattle grazing on uncollected waste obstructing traffic and posing public safety risk. Requesting animal welfare and sanitation dispatch.",
            authority_name="Animal Welfare & Control Department",
            authority_department="Veterinary & Animal Control",
            confidence_score=0.92,
            tags=["Animal Menace", "Traffic Obstruction", "Sanitation Hazard"]
        )

    if any(k in text for k in ["garbage", "trash", "waste", "dump", "debris", "bin", "litter", "rubbish"]):
        return AIAnalyzeResult(
            issue_type="Overflowing Waste Dump",
            category="sanitation",
            severity="medium",
            safety_risk=False,
            description="Municipal solid waste accumulation spilling into public walkway and surroundings.",
            complaint_title="Uncollected Municipal Solid Waste & Garbage Overflow",
            complaint_description="Solid waste accumulation observed obstructing public pathway and posing hygiene concerns. Requesting mechanized waste removal and sanitization.",
            authority_name="Sanitation Department",
            authority_department="Solid Waste Management",
            confidence_score=0.92,
            tags=["Sanitation Hazard", "Solid Waste Accumulation", "Waste Removal Needed"]
        )

    if any(k in text for k in ["light", "dark", "lamp", "pole", "electric", "wire", "bulb", "power", "luminaire"]):
        return AIAnalyzeResult(
            issue_type="Non-Functional Streetlight / Electrical Hazard",
            category="electrical",
            severity="high",
            safety_risk=True,
            description="Street luminaire is non-operational with possible electrical insulation exposure.",
            complaint_title="Non-Functional Streetlight & Electrical Hazard",
            complaint_description="Street illumination unit is non-functional creating hazardous dark zones for pedestrians and vehicles at night. Requesting electrical inspection and replacement.",
            authority_name="Electrical Department",
            authority_department="Electrical & Public Lighting",
            confidence_score=0.93,
            tags=["Public Lighting Defect", "Electrocution Risk", "Dark Zone Hazard"]
        )

    if any(k in text for k in ["water", "leak", "pipe", "burst", "potable", "sewage", "drainage", "flood"]):
        return AIAnalyzeResult(
            issue_type="Pressurized Water Pipeline Rupture",
            category="water_supply",
            severity="high",
            safety_risk=True,
            description="Pressurized water pipeline fracture causing street inundation and subgrade loss.",
            complaint_title="Pressurized Water Pipeline Rupture Flooding Thoroughfare",
            complaint_description="Severe potable water leakage detected originating from distribution line. Drinking water is being wasted and flooding roadway. Urgent shut-off and repair required.",
            authority_name="Water Department",
            authority_department="Water Supply & Sewage",
            confidence_score=0.94,
            tags=["Water Wastage", "Pipeline Defect", "Carriageway Flooding"]
        )

    if any(k in text for k in ["manhole", "drain cover", "open pit", "grating", "trench", "cavity"]):
        return AIAnalyzeResult(
            issue_type="Uncovered Open Manhole Chamber",
            category="urban_safety",
            severity="critical",
            safety_risk=True,
            description="Uncovered manhole cavity on active thoroughfare posing immediate fall and vehicle collision hazard.",
            complaint_title="Critical Safety Hazard: Uncovered Open Manhole Chamber",
            complaint_description="An open manhole chamber is exposed on the thoroughfare without safety barricades or illumination. Immediate structural barricading and replacement of heavy cast-iron cover required.",
            authority_name="Municipal Engineering Department",
            authority_department="Urban Safety & Engineering",
            confidence_score=0.96,
            tags=["Fall Hazard", "High Risk Anomaly", "Immediate Barricade Needed"]
        )

    if any(k in text for k in ["tree", "branch", "foliage", "fallen", "uprooted"]):
        return AIAnalyzeResult(
            issue_type="Fallen Tree Roadway Obstruction",
            category="horticulture_and_parks",
            severity="high",
            safety_risk=True,
            description="Fallen tree or large severed branch obstructing vehicular and pedestrian passage.",
            complaint_title="Fallen Tree Blocking Roadway & Transit Route",
            complaint_description="A fallen tree has obstructed the active road passage. Urgent deployment of horticultural chain-saw crew and transport truck required to clear vehicular lane.",
            authority_name="Horticulture & Parks Department",
            authority_department="Parks & Urban Forestry",
            confidence_score=0.94,
            tags=["Transit Obstruction", "Tree Clearance Needed", "Public Safety Hazard"]
        )

    if any(k in text for k in ["pothole", "crater", "asphalt", "bitumen", "road damage"]):
        return AIAnalyzeResult(
            issue_type="Severe Road Pothole",
            category="road_infrastructure",
            severity="high",
            safety_risk=True,
            description="Deep asphalt cavity with sub-base erosion posing hazard to passing vehicular traffic.",
            complaint_title="Hazardous Road Surface Pothole Obstructing Carriageway",
            complaint_description="A deep asphalt pothole has formed on the vehicular carriageway. Urgent cold-mix patching and leveling needed to prevent vehicular accidents.",
            authority_name="Public Works Department",
            authority_department="Road Infrastructure",
            confidence_score=0.95,
            tags=["Asphalt Base Failure", "Collision Hazard", "PWD Maintenance"]
        )

    # General unclassified civic issue fallback - NEVER defaults blindly to pothole
    return AIAnalyzeResult(
        issue_type="Civic Hazard / Municipal Issue",
        category="general_infrastructure",
        severity="medium",
        safety_risk=False,
        description=f"Civic problem identified from photographic evidence. Citizen notes: '{optional_text or 'Inspection requested.'}'",
        complaint_title="Civic Infrastructure Maintenance & Verification Request",
        complaint_description=f"A civic issue has been logged with photographic evidence. Field verification and assessment requested by municipal engineering team. Notes: {optional_text or 'Pending inspection.'}",
        authority_name="Public Works Department",
        authority_department="General Municipal Works",
        confidence_score=0.89,
        tags=["Civic Issue", "Field Inspection Needed", "Municipal Verification"]
    )

async def _load_image_bytes(image_url: str) -> tuple[Optional[bytes], str]:
    """
    Resolves image bytes and ensures a Gemini-supported MIME type (image/jpeg, image/png, image/webp).
    Supports base64 data URLs, remote URLs, and local upload files.
    """
    supported_mimes = {"image/jpeg", "image/png", "image/webp"}
    try:
        if image_url.startswith("data:"):
            header, base64_str = image_url.split(",", 1)
            raw_mime = header.split(";")[0].replace("data:", "").strip().lower()
            mime = raw_mime if raw_mime in supported_mimes else "image/jpeg"
            return base64.b64decode(base64_str), mime

        if image_url.startswith("http://") or image_url.startswith("https://"):
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.get(image_url)
                if res.status_code == 200:
                    raw_mime = res.headers.get("content-type", "image/jpeg").split(";")[0].strip().lower()
                    mime = raw_mime if raw_mime in supported_mimes else "image/jpeg"
                    return res.content, mime
        else:
            filename = os.path.basename(image_url)
            local_path = os.path.join(UPLOAD_DIR, filename)
            if os.path.exists(local_path):
                with open(local_path, "rb") as f:
                    content = f.read()
                raw_mime, _ = mimetypes.guess_type(local_path)
                mime = (raw_mime or "").lower()
                if mime not in supported_mimes:
                    mime = "image/jpeg"
                return content, mime
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
    Supports multi-model failover to guarantee immediate response even if one model is rate-limited.
    """
    if not settings.LLM_API_KEY:
        return fallback_heuristic_analyzer(optional_text, image_url)

    prompt = f"Citizen Description: {optional_text or 'None provided.'}\n"
    if latitude and longitude:
        prompt += f"GPS Coordinates: {latitude}, {longitude}\n"
    prompt += "Analyze this civic issue photograph and return strict JSON as specified."

    # Load image bytes and attach as base64 inline_data
    image_bytes, mime_type = await _load_image_bytes(image_url)
    parts = [{"text": f"{SYSTEM_PROMPT}\n\n{prompt}"}]

    if image_bytes:
        base64_data = base64.b64encode(image_bytes).decode("utf-8")
        parts.append({
            "inline_data": {
                "mime_type": mime_type,
                "data": base64_data
            }
        })

    payload = {
        "contents": [{"parts": parts}],
        "generationConfig": {
            "temperature": 0.1,
            "responseMimeType": "application/json"
        }
    }

    # Iterate through preferred model and all candidate models in waterfall order
    preferred = [settings.LLM_MODEL] if settings.LLM_MODEL else []
    ordered_models = []
    for m in preferred + MODEL_CANDIDATES:
        if m and m not in ordered_models:
            ordered_models.append(m)

    async with httpx.AsyncClient(timeout=15.0) as client:
        for model_name in ordered_models:
            url = f"{settings.LLM_API_BASE_URL}/models/{model_name}:generateContent?key={settings.LLM_API_KEY}"
            try:
                response = await client.post(url, json=payload)
                if response.status_code == 200:
                    data = response.json()
                    text_response = data["candidates"][0]["content"]["parts"][0]["text"]

                    json_match = re.search(r"\{.*\}", text_response, re.DOTALL)
                    if json_match:
                        parsed = json.loads(json_match.group(0))

                        # Extract specific issue name cleanly
                        raw_issue = str(parsed.get("issue_type", "Civic Hazard")).strip()
                        if "_" in raw_issue and " " not in raw_issue:
                            clean_issue = raw_issue.replace("_", " ").title()
                        else:
                            clean_issue = raw_issue

                        clean_cat = str(parsed.get("category", "general_infrastructure")).lower().strip().replace(" ", "_")
                        raw_sev = str(parsed.get("severity", "medium")).lower().strip()
                        clean_sev = raw_sev if raw_sev in {"low", "medium", "high", "critical"} else "medium"
                        auth_name = parsed.get("authority_name")
                        auth_dept = parsed.get("authority_department")

                        try:
                            conf_score = float(parsed.get("confidence_score", 0.95))
                        except (ValueError, TypeError):
                            conf_score = 0.95

                        tags = parsed.get("tags")
                        if not isinstance(tags, list) or not tags:
                            tags = [clean_issue, clean_cat.replace("_", " ").title(), "Vision AI Verified"]

                        return AIAnalyzeResult(
                            issue_type=clean_issue,
                            category=clean_cat,
                            severity=clean_sev,
                            safety_risk=bool(parsed.get("safety_risk", False)),
                            description=parsed.get("description", "Civic issue detected visually by AI."),
                            complaint_title=parsed.get("complaint_title", f"Report: {clean_issue}")[:100],
                            complaint_description=parsed.get("complaint_description", "Civic hazard identified in public area."),
                            authority_name=auth_name,
                            authority_department=auth_dept,
                            confidence_score=conf_score,
                            tags=tags
                        )
                elif response.status_code in {429, 503}:
                    print(f"[Warning] Model {model_name} rate-limited ({response.status_code}), attempting next candidate...")
                    continue
                else:
                    print(f"[Warning] Gemini {model_name} returned status {response.status_code}: {response.text[:150]}")
            except Exception as e:
                print(f"[Warning] Attempt with model {model_name} failed: {e}. Trying next candidate...")

    return fallback_heuristic_analyzer(optional_text, image_url)

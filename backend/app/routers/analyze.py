from typing import Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.analyze import AnalyzeResponse, LocationSimple
from app.schemas.authority import AuthoritySimple
from app.services.cloudinary_service import upload_image
from app.services.ai_service import analyze_image_with_llm
from app.services.authority_service import resolve_or_create_authority
from app.utils.validators import validate_coordinates

router = APIRouter(prefix="/analyze", tags=["Analyze"])

@router.post(
    "",
    response_model=AnalyzeResponse,
    status_code=status.HTTP_200_OK,
    summary="Analyze civic hazard photo using Vision AI and route authority"
)
async def analyze_civic_issue(
    image: UploadFile = File(..., description="Photographic evidence of civic problem"),
    latitude: Optional[float] = Form(None, description="GPS Latitude (-90 to 90)"),
    longitude: Optional[float] = Form(None, description="GPS Longitude (-180 to 180)"),
    optional_text: Optional[str] = Form(None, description="Optional citizen context notes"),
    db: Session = Depends(get_db),
):
    """
    1. Validates image and GPS coordinates.
    2. Uploads image to secure Cloudinary storage.
    3. Runs multimodal AI vision analysis.
    4. Deterministically maps category to responsible municipal authority.
    5. Returns analysis proposal without creating a database complaint record.
    """
    # 1. Validate coordinates if provided
    validate_coordinates(latitude, longitude)

    # 2. Upload image to Cloudinary (or local storage fallback)
    image_url = await upload_image(image)

    # 3. Analyze with Multimodal AI
    ai_result = await analyze_image_with_llm(
        image_url=image_url,
        optional_text=optional_text,
        latitude=latitude,
        longitude=longitude
    )

    # 4. Deterministically resolve or retrieve authority
    authority = resolve_or_create_authority(
        db=db,
        issue_type=ai_result.issue_type,
        category=ai_result.category
    )

    # 5. Assemble and return response
    return AnalyzeResponse(
        issue_type=ai_result.issue_type,
        category=ai_result.category,
        severity=ai_result.severity,
        safety_risk=ai_result.safety_risk,
        description=ai_result.description,
        complaint_title=ai_result.complaint_title,
        complaint_description=ai_result.complaint_description,
        authority=AuthoritySimple(
            id=authority.id,
            name=authority.name,
            department=authority.department
        ),
        location=LocationSimple(latitude=latitude, longitude=longitude) if (latitude or longitude) else None,
        image_url=image_url
    )

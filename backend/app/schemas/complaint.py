from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.authority import AuthorityResponse
from app.schemas.status import StatusHistoryResponse

class ComplaintCreate(BaseModel):
    issue_type: str = Field(..., description="Issue type detected, e.g. pothole, garbage, streetlight")
    category: str = Field(..., description="Category of civic issue")
    severity: str = Field(..., description="Severity level: low, medium, high, critical")
    safety_risk: bool = Field(default=False, description="Whether this issue poses immediate safety risks")
    complaint_title: str = Field(..., min_length=3, max_length=255)
    complaint_description: str = Field(..., min_length=5)
    image_url: str = Field(..., description="Cloudinary or storage URL for photographic evidence")
    latitude: Optional[float] = Field(None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(None, ge=-180.0, le=180.0)
    location_text: Optional[str] = None
    authority_id: int
    ai_description: Optional[str] = None

class ComplaintResponse(BaseModel):
    id: int
    complaint_id: str
    issue_type: str
    category: str
    severity: str
    safety_risk: bool
    ai_description: Optional[str] = None
    complaint_title: str
    complaint_description: str
    image_url: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location_text: Optional[str] = None
    authority_id: int
    status: str
    created_at: datetime
    updated_at: datetime
    authority: Optional[AuthorityResponse] = None
    status_history: List[StatusHistoryResponse] = []

    model_config = ConfigDict(from_attributes=True)

class ComplaintListResponse(BaseModel):
    items: List[ComplaintResponse]
    total: int
    page: int
    limit: int

from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.complaint import ComplaintCreate, ComplaintResponse, ComplaintListResponse
from app.schemas.status import StatusUpdate
from app.services.complaint_service import (
    create_complaint,
    get_complaints,
    get_complaint_by_id,
    update_complaint_status,
)
from app.utils.validators import validate_coordinates

router = APIRouter(prefix="/complaints", tags=["Complaints"])

@router.post(
    "",
    response_model=ComplaintResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create official civic complaint"
)
def create_new_complaint(
    payload: ComplaintCreate,
    db: Session = Depends(get_db)
):
    """
    Creates an official civic grievance ticket:
    - Generates unique tracking ID (CIV-2026-XXXXX).
    - Links to responsible authority.
    - Logs initial SUBMITTED status audit trail.
    """
    validate_coordinates(payload.latitude, payload.longitude)
    return create_complaint(db, payload)

@router.get(
    "",
    response_model=ComplaintListResponse,
    summary="List complaints with search and filtering"
)
def list_complaints(
    status: Optional[str] = Query(None, description="Filter by status: SUBMITTED, IN_PROGRESS, RESOLVED"),
    severity: Optional[str] = Query(None, description="Filter by severity: low, medium, high, critical"),
    category: Optional[str] = Query(None, description="Filter by category"),
    search: Optional[str] = Query(None, description="Search by ID, title, description, or location"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db)
):
    """Returns paginated complaints matching search/filter criteria."""
    items, total = get_complaints(
        db=db,
        status_filter=status,
        severity_filter=severity,
        category_filter=category,
        search=search,
        page=page,
        limit=limit
    )
    return ComplaintListResponse(
        items=items,
        total=total,
        page=page,
        limit=limit
    )

@router.get(
    "/{id}",
    response_model=ComplaintResponse,
    summary="Get full complaint dossier with timeline"
)
def get_complaint(
    id: str,
    db: Session = Depends(get_db)
):
    """Retrieves full complaint details by primary key ID or CIV-YYYY-XXXXX code."""
    complaint = get_complaint_by_id(db, id)
    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Complaint '{id}' not found."
        )
    return complaint

@router.patch(
    "/{id}/status",
    response_model=ComplaintResponse,
    summary="Update complaint resolution status"
)
def update_status(
    id: str,
    payload: StatusUpdate,
    db: Session = Depends(get_db)
):
    """
    Updates the resolution status:
    - Allowed transitions: SUBMITTED, ASSIGNED, IN_PROGRESS, RESOLVED.
    - Appends immutable record to status history audit trail.
    """
    return update_complaint_status(
        db=db,
        identifier=id,
        new_status=payload.status.value,
        note=payload.note,
        resolution_image=payload.resolution_image
    )

from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.authority import AuthorityResponse
from app.schemas.complaint import ComplaintListResponse
from app.services.authority_service import get_all_authorities, get_authority_by_id
from app.services.complaint_service import get_complaints

router = APIRouter(prefix="/authorities", tags=["Authorities"])

@router.get(
    "",
    response_model=List[AuthorityResponse],
    summary="List all municipal authorities"
)
def list_authorities(db: Session = Depends(get_db)):
    """Returns all active civic departments and agencies."""
    return get_all_authorities(db)

@router.get(
    "/{id}/complaints",
    response_model=ComplaintListResponse,
    summary="List complaints routed to a specific authority"
)
def list_authority_complaints(
    id: int,
    status: Optional[str] = Query(None, description="Filter by status"),
    severity: Optional[str] = Query(None, description="Filter by severity"),
    category: Optional[str] = Query(None, description="Filter by category"),
    search: Optional[str] = Query(None, description="Search query"),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Retrieves complaints assigned to this municipal authority for operations triage."""
    authority = get_authority_by_id(db, id)
    if not authority:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Authority with id {id} does not exist."
        )

    items, total = get_complaints(
        db=db,
        status_filter=status,
        severity_filter=severity,
        category_filter=category,
        authority_id=id,
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

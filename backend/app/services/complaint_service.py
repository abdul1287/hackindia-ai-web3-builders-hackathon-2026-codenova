from datetime import datetime, timezone
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, desc, func
from fastapi import HTTPException, status

from app.models.complaint import Complaint
from app.models.authority import Authority
from app.models.status_history import StatusHistory
from app.schemas.complaint import ComplaintCreate
from app.schemas.status import StatusEnum
from app.utils.complaint_id import generate_complaint_id

def create_complaint(db: Session, complaint_data: ComplaintCreate) -> Complaint:
    """Creates an official civic complaint and records the initial SUBMITTED status history."""
    # Verify authority exists
    authority = db.query(Authority).filter(Authority.id == complaint_data.authority_id).first()
    if not authority:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Authority with id {complaint_data.authority_id} does not exist."
        )

    # Generate unique formatted complaint ID (CIV-2026-XXXXX)
    complaint_id_str = generate_complaint_id(db)
    now = datetime.now(timezone.utc)

    complaint = Complaint(
        complaint_id=complaint_id_str,
        issue_type=complaint_data.issue_type,
        category=complaint_data.category,
        severity=complaint_data.severity,
        safety_risk=complaint_data.safety_risk,
        ai_description=complaint_data.ai_description,
        complaint_title=complaint_data.complaint_title,
        complaint_description=complaint_data.complaint_description,
        image_url=complaint_data.image_url,
        latitude=complaint_data.latitude,
        longitude=complaint_data.longitude,
        location_text=complaint_data.location_text,
        authority_id=complaint_data.authority_id,
        status=StatusEnum.SUBMITTED.value,
        created_at=now,
        updated_at=now,
    )

    db.add(complaint)
    db.flush()  # populate complaint.id

    # Create initial status history entry
    initial_history = StatusHistory(
        complaint_id=complaint.id,
        status=StatusEnum.SUBMITTED.value,
        note="Complaint logged by citizen and routed to responsible municipal department.",
        changed_at=now
    )
    db.add(initial_history)
    db.commit()

    # Re-fetch with eager loaded relationships
    return (
        db.query(Complaint)
        .options(joinedload(Complaint.authority), joinedload(Complaint.status_history))
        .filter(Complaint.id == complaint.id)
        .first()
    )

def get_complaints(
    db: Session,
    status_filter: Optional[str] = None,
    severity_filter: Optional[str] = None,
    category_filter: Optional[str] = None,
    authority_id: Optional[int] = None,
    search: Optional[str] = None,
    page: int = 1,
    limit: int = 10
) -> Tuple[List[Complaint], int]:
    """Retrieves paginated complaints with optional filtering and search."""
    query = db.query(Complaint).options(
        joinedload(Complaint.authority),
        joinedload(Complaint.status_history)
    )

    if status_filter and status_filter.upper() != "ALL":
        query = query.filter(Complaint.status == status_filter.upper())

    if severity_filter and severity_filter.lower() != "all":
        query = query.filter(Complaint.severity.ilike(severity_filter))

    if category_filter and category_filter.lower() != "all":
        query = query.filter(Complaint.category.ilike(category_filter))

    if authority_id is not None:
        query = query.filter(Complaint.authority_id == authority_id)

    if search:
        search_term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Complaint.complaint_id.ilike(search_term),
                Complaint.complaint_title.ilike(search_term),
                Complaint.complaint_description.ilike(search_term),
                Complaint.issue_type.ilike(search_term),
                Complaint.location_text.ilike(search_term),
            )
        )

    total = query.count()
    offset = max(0, (page - 1) * limit)
    items = query.order_by(desc(Complaint.created_at)).offset(offset).limit(limit).all()

    return items, total

def get_complaint_by_id(db: Session, identifier: str) -> Optional[Complaint]:
    """Retrieves complaint by numeric ID or formatted complaint_id string (CIV-2026-XXXXX)."""
    query = db.query(Complaint).options(
        joinedload(Complaint.authority),
        joinedload(Complaint.status_history)
    )

    if identifier.isdigit():
        complaint = query.filter(Complaint.id == int(identifier)).first()
        if complaint:
            return complaint

    return query.filter(Complaint.complaint_id.ilike(identifier)).first()

def update_complaint_status(
    db: Session,
    identifier: str,
    new_status: str,
    note: Optional[str] = None
) -> Complaint:
    """Updates complaint status and appends an auditable record to status_history."""
    complaint = get_complaint_by_id(db, identifier)
    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Complaint '{identifier}' was not found."
        )

    # Validate status against allowed enum
    norm_status = new_status.upper().strip()
    allowed_statuses = {s.value for s in StatusEnum}
    if norm_status not in allowed_statuses:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid status '{new_status}'. Allowed statuses: {', '.join(allowed_statuses)}"
        )

    # Update complaint
    now = datetime.now(timezone.utc)
    complaint.status = norm_status
    complaint.updated_at = now

    # Record history entry
    default_notes = {
        "SUBMITTED": "Complaint submitted to civic registry.",
        "ASSIGNED": "Dispatched to department inspector and ward response unit.",
        "IN_PROGRESS": "Field crew dispatched and remediation work active.",
        "RESOLVED": "Issue verified resolved and closed by municipal supervisor.",
    }

    history_entry = StatusHistory(
        complaint_id=complaint.id,
        status=norm_status,
        note=note or default_notes.get(norm_status, f"Status changed to {norm_status}."),
        changed_at=now
    )
    db.add(history_entry)
    db.commit()
    db.refresh(complaint)

    return complaint

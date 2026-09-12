from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.authority import Authority

# Deterministic mappings from civic categories and issue types to responsible departments
CATEGORY_AUTHORITY_MAP = {
    # Road & Infrastructure
    "pothole": {"name": "Public Works Department", "dept": "Road Infrastructure", "cat": "road_infrastructure"},
    "road_infrastructure": {"name": "Public Works Department", "dept": "Road Infrastructure", "cat": "road_infrastructure"},
    "damaged_public_infrastructure": {"name": "Public Works Department", "dept": "Road Infrastructure", "cat": "road_infrastructure"},
    
    # Waste & Sanitation
    "garbage": {"name": "Sanitation Department", "dept": "Sanitation & Waste Management", "cat": "sanitation"},
    "sanitation": {"name": "Sanitation Department", "dept": "Sanitation & Waste Management", "cat": "sanitation"},
    
    # Electrical & Public Lighting
    "streetlight": {"name": "Electrical Department", "dept": "Electrical & Public Lighting", "cat": "electrical"},
    "electrical": {"name": "Electrical Department", "dept": "Electrical & Public Lighting", "cat": "electrical"},
    
    # Water Supply & Sewage
    "water_leakage": {"name": "Water Department", "dept": "Water Supply & Sewage", "cat": "water_supply"},
    "water_supply": {"name": "Water Department", "dept": "Water Supply & Sewage", "cat": "water_supply"},
    
    # Urban Safety & Manholes
    "open_manhole": {"name": "Municipal Engineering Department", "dept": "Urban Safety & Engineering", "cat": "urban_safety"},
    "urban_safety": {"name": "Municipal Engineering Department", "dept": "Urban Safety & Engineering", "cat": "urban_safety"},
}

DEFAULT_AUTHORITY = {
    "name": "Public Works Department",
    "dept": "General Municipal Works",
    "cat": "general_infrastructure"
}

def get_authority_mapping(issue_type: str, category: str) -> dict:
    """Deterministic routing mapping lookup without LLM guesswork."""
    norm_issue = (issue_type or "").lower().strip().replace(" ", "_")
    norm_cat = (category or "").lower().strip().replace(" ", "_")

    if norm_issue in CATEGORY_AUTHORITY_MAP:
        return CATEGORY_AUTHORITY_MAP[norm_issue]
    if norm_cat in CATEGORY_AUTHORITY_MAP:
        return CATEGORY_AUTHORITY_MAP[norm_cat]

    return DEFAULT_AUTHORITY

def resolve_or_create_authority(
    db: Session,
    issue_type: str,
    category: str,
    area: Optional[str] = "Citywide"
) -> Authority:
    """
    Finds existing authority matching deterministic mapping or creates it in the database.
    """
    mapping = get_authority_mapping(issue_type, category)
    target_name = mapping["name"]

    authority = db.query(Authority).filter(
        Authority.name == target_name,
        Authority.is_active == True
    ).first()

    if not authority:
        authority = Authority(
            name=target_name,
            department=mapping["dept"],
            category=mapping["cat"],
            area=area or "Citywide",
            is_active=True
        )
        db.add(authority)
        db.commit()
        db.refresh(authority)

    return authority

def get_all_authorities(db: Session) -> List[Authority]:
    """Returns all active authorities."""
    return db.query(Authority).filter(Authority.is_active == True).all()

def get_authority_by_id(db: Session, authority_id: int) -> Optional[Authority]:
    """Retrieves single authority by ID."""
    return db.query(Authority).filter(Authority.id == authority_id).first()

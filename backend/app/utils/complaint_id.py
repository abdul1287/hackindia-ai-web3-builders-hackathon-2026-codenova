import random
from datetime import datetime
from sqlalchemy.orm import Session

def generate_complaint_id(db: Session = None) -> str:
    """
    Generates a unique civic complaint identifier in the format:
    CIV-YYYY-XXXXX (e.g., CIV-2026-10482)
    """
    year = datetime.now().year
    
    # Generate 5-digit random sequence
    for _ in range(10):  # Retry loop in rare case of collision
        rand_id = random.randint(10000, 99999)
        candidate = f"CIV-{year}-{rand_id}"
        
        if db is not None:
            from app.models.complaint import Complaint
            exists = db.query(Complaint.id).filter(Complaint.complaint_id == candidate).first()
            if not exists:
                return candidate
        else:
            return candidate
            
    # Fallback with timestamp millis if collision loop exceeded
    timestamp_suffix = str(int(datetime.now().timestamp() * 1000))[-5:]
    return f"CIV-{year}-{timestamp_suffix}"

from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, ConfigDict

class StatusEnum(str, Enum):
    SUBMITTED = "SUBMITTED"
    ASSIGNED = "ASSIGNED"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"

class StatusUpdate(BaseModel):
    status: StatusEnum
    note: Optional[str] = None

class StatusHistoryResponse(BaseModel):
    id: int
    complaint_id: int
    status: str
    changed_at: datetime
    note: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

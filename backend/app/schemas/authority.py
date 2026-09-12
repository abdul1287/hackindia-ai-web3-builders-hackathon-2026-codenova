from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class AuthorityBase(BaseModel):
    name: str
    department: str
    category: str
    area: Optional[str] = "Citywide"

class AuthorityCreate(AuthorityBase):
    pass

class AuthorityResponse(AuthorityBase):
    id: int
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class AuthoritySimple(BaseModel):
    id: int
    name: str
    department: str

    model_config = ConfigDict(from_attributes=True)

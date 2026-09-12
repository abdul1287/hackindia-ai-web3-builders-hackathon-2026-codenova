from typing import Optional, Dict, Any
from pydantic import BaseModel, Field

class ReverseGeocodeResponse(BaseModel):
    latitude: float = Field(..., description="GPS Latitude")
    longitude: float = Field(..., description="GPS Longitude")
    city: Optional[str] = Field(None, description="City, town, or district")
    display_name: str = Field(..., description="Human-readable address")
    formatted_address: Optional[str] = Field(None, description="Clean formatted address")
    raw: Optional[Dict[str, Any]] = Field(default=None, description="Raw geocoding address components")

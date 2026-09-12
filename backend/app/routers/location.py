from fastapi import APIRouter, Query, status
from app.schemas.location import ReverseGeocodeResponse
from app.services.location_service import reverse_geocode
from app.utils.validators import validate_coordinates

router = APIRouter(prefix="/location", tags=["Location"])

@router.get(
    "/reverse",
    response_model=ReverseGeocodeResponse,
    status_code=status.HTTP_200_OK,
    summary="Reverse geocode GPS coordinates into clean human-readable address"
)
async def get_reverse_geocode(
    latitude: float = Query(..., description="GPS Latitude (-90 to 90)"),
    longitude: float = Query(..., description="GPS Longitude (-180 to 180)")
):
    """
    Converts latitude + longitude into a human-readable location
    (street / locality / sector / city / state / country) using Nominatim.
    """
    validate_coordinates(latitude, longitude)
    return await reverse_geocode(latitude, longitude)

@router.get(
    "",
    response_model=ReverseGeocodeResponse,
    status_code=status.HTTP_200_OK,
    summary="Alias for reverse geocode"
)
async def get_reverse_geocode_alias(
    latitude: float = Query(..., description="GPS Latitude (-90 to 90)"),
    longitude: float = Query(..., description="GPS Longitude (-180 to 180)")
):
    validate_coordinates(latitude, longitude)
    return await reverse_geocode(latitude, longitude)

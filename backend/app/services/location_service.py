import asyncio
import logging
from typing import Optional, Dict, Any, Tuple
import httpx

try:
    from geopy.geocoders import Nominatim
    from geopy.exc import GeocoderServiceError, GeocoderTimedOut
    HAS_GEOPY = True
except ImportError:
    HAS_GEOPY = False

from app.schemas.location import ReverseGeocodeResponse

logger = logging.getLogger("civicai.location")

# In-memory coordinate cache: (rounded_lat, rounded_lng) -> ReverseGeocodeResponse
_CACHE: Dict[Tuple[float, float], ReverseGeocodeResponse] = {}

def format_clean_address(addr: Dict[str, Any], raw_display_name: str = "") -> str:
    """
    Constructs a concise, human-readable address from Nominatim structured address dictionary:
    - road
    - neighbourhood / suburb / residential / quarter / village
    - city / town / municipality
    - county / district (if city absent)
    - state
    - country
    Eliminates redundant entries, empty separators, and non-informative tokens.
    """
    if not addr and not raw_display_name:
        return "Location detected"

    components = []

    # 1. Road / Street (if present, clean and informative)
    road = addr.get("road")
    if road and isinstance(road, str) and road.strip():
        road_clean = road.strip()
        # Avoid generic non-street labels unless nothing else is present
        if not any(p in road_clean.lower() for p in ["unnamed", "pedestrian path", "path to", "pathway to"]):
            components.append(road_clean)

    # 2. Locality / Suburb / Sector / Neighbourhood / Village / Quarter / Residential
    localities = [
        addr.get("suburb"),
        addr.get("neighbourhood"),
        addr.get("residential"),
        addr.get("quarter"),
        addr.get("village"),
    ]
    for loc in localities:
        if loc and isinstance(loc, str) and loc.strip():
            loc_clean = loc.strip()
            if not any(loc_clean.lower() in c.lower() or c.lower() in loc_clean.lower() for c in components):
                components.append(loc_clean)
                break  # Pick the primary/most relevant locality level

    # If no road or locality found yet, check amenity/building/commercial/industrial
    if not components:
        for poikey in ["amenity", "building", "leisure", "commercial", "industrial"]:
            poi = addr.get(poikey)
            if poi and isinstance(poi, str) and poi.strip():
                components.append(poi.strip())
                break

    # 3. City / Town / Municipality
    city = (
        addr.get("city")
        or addr.get("town")
        or addr.get("municipality")
        or addr.get("city_district")
    )
    if city and isinstance(city, str) and city.strip():
        city_clean = city.strip()
        if not any(city_clean.lower() in c.lower() for c in components):
            components.append(city_clean)

    # 4. County / State District (if no primary city found or to disambiguate)
    if not city:
        county = addr.get("county") or addr.get("state_district")
        if county and isinstance(county, str) and county.strip():
            county_clean = county.strip()
            if not any(county_clean.lower() in c.lower() for c in components):
                components.append(county_clean)

    # 5. State
    state = addr.get("state")
    if state and isinstance(state, str) and state.strip():
        state_clean = state.strip()
        if not any(state_clean.lower() in c.lower() for c in components):
            components.append(state_clean)

    # 6. Country
    country = addr.get("country")
    if country and isinstance(country, str) and country.strip():
        country_clean = country.strip()
        if not any(country_clean.lower() in c.lower() for c in components):
            components.append(country_clean)

    # Filter out any "undefined", empty, numeric-only, or duplicate parts
    valid_parts = []
    seen = set()
    for part in components:
        norm = part.strip()
        if norm and norm.lower() not in seen and norm.lower() != "undefined" and not norm.isdigit():
            seen.add(norm.lower())
            valid_parts.append(norm)

    if valid_parts:
        return ", ".join(valid_parts)

    # Fallback to cleaned raw display_name if available
    if raw_display_name:
        parts = [p.strip() for p in raw_display_name.split(",") if p.strip() and not p.strip().isdigit() and p.strip().lower() != "undefined"]
        if len(parts) > 4:
            return ", ".join(parts[:3] + [parts[-1]])
        if parts:
            return ", ".join(parts)

    return "Location detected"


async def reverse_geocode(latitude: float, longitude: float) -> ReverseGeocodeResponse:
    """
    Converts latitude + longitude into a human-readable address using Nominatim/geopy,
    with in-memory coordinate caching and HTTP fallback.
    """
    cache_key = (round(latitude, 4), round(longitude, 4))
    if cache_key in _CACHE:
        return _CACHE[cache_key]

    raw_addr: Dict[str, Any] = {}
    display_name = ""
    city_val: Optional[str] = None

    # 1. Attempt geopy Nominatim in worker thread
    if HAS_GEOPY:
        try:
            def _geopy_call():
                geolocator = Nominatim(
                    user_agent="CivicAI-Municipal-Platform/1.0 (contact: info@civicai.local)",
                    timeout=3.5
                )
                return geolocator.reverse((latitude, longitude), exactly_one=True, language="en")

            location = await asyncio.to_thread(_geopy_call)
            if location and hasattr(location, "raw"):
                raw_data = location.raw
                raw_addr = raw_data.get("address", {})
                display_name = location.address or raw_data.get("display_name", "")
        except Exception as e:
            logger.warning(f"Geopy Nominatim failed: {e}. Attempting direct HTTP fallback.")

    # 2. Fallback to direct Nominatim OSM HTTP if geopy didn't succeed
    if not raw_addr:
        try:
            url = "https://nominatim.openstreetmap.org/reverse"
            headers = {
                "User-Agent": "CivicAI-Municipal-Platform/1.0 (contact: info@civicai.local)",
                "Accept-Language": "en"
            }
            params = {
                "lat": latitude,
                "lon": longitude,
                "format": "jsonv2",
                "addressdetails": 1
            }
            async with httpx.AsyncClient(timeout=4.0) as client:
                resp = await client.get(url, params=params, headers=headers)
                if resp.status_code == 200:
                    data = resp.json()
                    raw_addr = data.get("address", {})
                    display_name = data.get("display_name", "")
        except Exception as err:
            logger.error(f"HTTP reverse geocode fallback error: {err}")

    # Extract clean city
    if raw_addr:
        city_val = (
            raw_addr.get("city")
            or raw_addr.get("town")
            or raw_addr.get("municipality")
            or raw_addr.get("county")
            or raw_addr.get("suburb")
        )

    # Build clean human-readable address
    clean_address = format_clean_address(raw_addr, display_name)

    # Fallback if lookups returned empty
    if not clean_address:
        clean_address = "Location detected"
    display_name = clean_address

    result = ReverseGeocodeResponse(
        latitude=latitude,
        longitude=longitude,
        city=city_val or "Noida",
        display_name=clean_address,
        formatted_address=clean_address,
        raw=raw_addr or None
    )

    # Cache result
    _CACHE[cache_key] = result
    return result

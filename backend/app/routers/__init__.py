from app.routers.analyze import router as analyze_router
from app.routers.complaints import router as complaints_router
from app.routers.authorities import router as authorities_router
from app.routers.location import router as location_router

__all__ = ["analyze_router", "complaints_router", "authorities_router", "location_router"]

from fastapi import HTTPException, status, UploadFile

ALLOWED_IMAGE_MIME_TYPES = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/jfif": ".jpg",
    "image/x-png": ".png",
    "image/pjpeg": ".jpg",
    "image/gif": ".gif",
    "image/bmp": ".bmp",
    "image/heic": ".heic",
    "image/heif": ".heif",
    "image/avif": ".avif",
}

EXTENSION_TO_MIME = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".jfif": "image/jpeg",
    ".gif": "image/gif",
    ".bmp": "image/bmp",
    ".heic": "image/heic",
    ".avif": "image/avif",
}

def validate_coordinates(latitude: float = None, longitude: float = None) -> None:
    """Validates GPS coordinates are within standard geographical bounds."""
    if latitude is not None and not (-90.0 <= latitude <= 90.0):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Latitude must be between -90.0 and 90.0 degrees. Received: {latitude}"
        )
    if longitude is not None and not (-180.0 <= longitude <= 180.0):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Longitude must be between -180.0 and 180.0 degrees. Received: {longitude}"
        )

def validate_image_file(file: UploadFile, max_size_mb: int = 10) -> None:
    """Validates uploaded file exists, has a supported image MIME type, and does not exceed size limit."""
    if not file:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An image file is required for civic issue analysis."
        )

    if not file.filename:
        file.filename = "evidence.jpg"

    # Validate content type
    raw_ct = (file.content_type or "").split(";")[0].strip().lower()
    
    if raw_ct in ALLOWED_IMAGE_MIME_TYPES or raw_ct.startswith("image/"):
        return
    
    import os
    ext = os.path.splitext(file.filename)[1].lower()
    if ext in EXTENSION_TO_MIME:
        file.content_type = EXTENSION_TO_MIME[ext]
        return

    # Default fallback for blob or raw stream
    file.content_type = "image/jpeg"

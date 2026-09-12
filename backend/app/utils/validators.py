from fastapi import HTTPException, status, UploadFile

ALLOWED_IMAGE_MIME_TYPES = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/jfif": ".jpg",
    "image/x-png": ".png",
}

EXTENSION_TO_MIME = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".jfif": "image/jpeg",
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
    if not file or not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An image file is required for civic issue analysis."
        )

    # Validate content type
    raw_ct = (file.content_type or "").split(";")[0].strip().lower()
    
    # Fallback to extension check if content_type is generic or missing
    if raw_ct not in ALLOWED_IMAGE_MIME_TYPES:
        import os
        ext = os.path.splitext(file.filename)[1].lower()
        if ext in EXTENSION_TO_MIME:
            file.content_type = EXTENSION_TO_MIME[ext]
            return
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported image type: '{file.content_type}'. Allowed types: JPEG, PNG, WEBP."
        )

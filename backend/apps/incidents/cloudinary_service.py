import os
import time
import warnings

import cloudinary
import cloudinary.uploader
import cloudinary.utils
from django.conf import settings
from PIL import Image, UnidentifiedImageError
from rest_framework.exceptions import ValidationError

from apps.common.choices import IncidentMediaType

ALLOWED_IMAGE_CONTENT_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
}
ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_IMAGE_FORMATS = {"JPEG", "PNG", "WEBP"}
MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024

ALLOWED_VIDEO_CONTENT_TYPES = {
    "video/mp4",
    "video/webm",
    "video/quicktime",
}
ALLOWED_VIDEO_EXTENSIONS = {".mp4", ".webm", ".mov"}
MAX_VIDEO_SIZE_BYTES = 50 * 1024 * 1024


def configure_cloudinary() -> None:
    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
        secure=True,
    )


def detect_upload_media_type(uploaded_file) -> str:
    content_type = (getattr(uploaded_file, "content_type", "") or "").lower()
    filename = getattr(uploaded_file, "name", "") or ""
    _, extension = os.path.splitext(filename.lower())

    if content_type in ALLOWED_VIDEO_CONTENT_TYPES or extension in ALLOWED_VIDEO_EXTENSIONS:
        return IncidentMediaType.VIDEO
    if content_type in ALLOWED_IMAGE_CONTENT_TYPES or extension in ALLOWED_IMAGE_EXTENSIONS:
        return IncidentMediaType.IMAGE
    raise ValidationError(
        "Only JPEG, PNG, WebP images or MP4, WebM, and MOV videos are allowed."
    )


def validate_image_file(uploaded_file) -> None:
    content_type = getattr(uploaded_file, "content_type", "")
    if content_type not in ALLOWED_IMAGE_CONTENT_TYPES:
        raise ValidationError("Only JPEG, PNG, and WebP images are allowed.")

    filename = getattr(uploaded_file, "name", "") or ""
    _, extension = os.path.splitext(filename.lower())
    if extension not in ALLOWED_IMAGE_EXTENSIONS:
        raise ValidationError("Only JPEG, PNG, and WebP images are allowed.")

    if uploaded_file.size > MAX_IMAGE_SIZE_BYTES:
        raise ValidationError("Image must be 5 MB or smaller.")

    uploaded_file.seek(0)
    image_format = None
    try:
        with warnings.catch_warnings():
            warnings.simplefilter("error", Image.DecompressionBombWarning)
            with Image.open(uploaded_file) as image:
                if image.width * image.height > 25_000_000:
                    raise ValidationError("Image dimensions must not exceed 25 megapixels.")
                image_format = image.format
                image.verify()
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError, Image.DecompressionBombWarning) as exc:
        raise ValidationError("The uploaded file is not a valid image.") from exc
    finally:
        uploaded_file.seek(0)

    if image_format not in ALLOWED_IMAGE_FORMATS:
        raise ValidationError("Only JPEG, PNG, and WebP images are allowed.")


def validate_video_file(uploaded_file) -> None:
    content_type = (getattr(uploaded_file, "content_type", "") or "").lower()
    filename = getattr(uploaded_file, "name", "") or ""
    _, extension = os.path.splitext(filename.lower())

    if content_type not in ALLOWED_VIDEO_CONTENT_TYPES and extension not in ALLOWED_VIDEO_EXTENSIONS:
        raise ValidationError("Only MP4, WebM, and MOV videos are allowed.")

    if uploaded_file.size > MAX_VIDEO_SIZE_BYTES:
        raise ValidationError("Video must be 50 MB or smaller.")

    if uploaded_file.size < 1024:
        raise ValidationError("The uploaded video file is too small to be valid.")


def upload_incident_media(uploaded_file, incident_number: str) -> dict:
    configure_cloudinary()
    media_type = detect_upload_media_type(uploaded_file)

    if media_type == IncidentMediaType.VIDEO:
        validate_video_file(uploaded_file)
        result = cloudinary.uploader.upload(
            uploaded_file,
            folder=f"incident-management/{incident_number}",
            resource_type="video",
            type="authenticated",
            timeout=120,
            overwrite=False,
        )
        result["media_type"] = IncidentMediaType.VIDEO
        return result

    validate_image_file(uploaded_file)
    result = cloudinary.uploader.upload(
        uploaded_file,
        folder=f"incident-management/{incident_number}",
        resource_type="image",
        type="authenticated",
        timeout=30,
        overwrite=False,
    )
    result["media_type"] = IncidentMediaType.IMAGE
    return result


def upload_incident_image(uploaded_file, incident_number: str) -> dict:
    """Backward-compatible alias for image-only callers."""
    if detect_upload_media_type(uploaded_file) != IncidentMediaType.IMAGE:
        raise ValidationError("Only JPEG, PNG, and WebP images are allowed.")
    return upload_incident_media(uploaded_file, incident_number)


def _delivery_format(media) -> str:
    if getattr(media, "resource_format", ""):
        return media.resource_format
    return media.cloudinary_url.rsplit(".", 1)[-1].split("?")[0]


def media_delivery_url(media) -> str:
    configure_cloudinary()
    if "/authenticated/" not in media.cloudinary_url:
        return media.cloudinary_url

    expires_at = int(time.time()) + 60
    media_type = getattr(media, "media_type", IncidentMediaType.IMAGE)

    if media_type == IncidentMediaType.VIDEO:
        return cloudinary.utils.private_download_url(
            media.cloudinary_public_id,
            _delivery_format(media) or "mp4",
            resource_type="video",
            type="authenticated",
            expires_at=expires_at,
            attachment=False,
        )

    return cloudinary.utils.private_download_url(
        media.cloudinary_public_id,
        _delivery_format(media) or "jpg",
        type="authenticated",
        expires_at=expires_at,
        attachment=False,
    )


def image_delivery_url(image):
    return media_delivery_url(image)

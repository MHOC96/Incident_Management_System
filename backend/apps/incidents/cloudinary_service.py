import os
import time
import warnings

import cloudinary
import cloudinary.uploader
import cloudinary.utils
from django.conf import settings
from PIL import Image, UnidentifiedImageError
from rest_framework.exceptions import ValidationError

ALLOWED_IMAGE_CONTENT_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
}
ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_IMAGE_FORMATS = {"JPEG", "PNG", "WEBP"}
MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024


def configure_cloudinary() -> None:
    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
        secure=True,
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


def upload_incident_image(uploaded_file, incident_number: str) -> dict:
    configure_cloudinary()
    validate_image_file(uploaded_file)

    return cloudinary.uploader.upload(
        uploaded_file,
        folder=f"incident-management/{incident_number}",
        resource_type="image",
        type="authenticated",
        timeout=30,
        overwrite=False,
    )


def image_delivery_url(image):
    configure_cloudinary()
    if "/authenticated/" not in image.cloudinary_url:
        # Legacy uploads must be protected using protect_incident_media before release.
        return image.cloudinary_url
    image_format = image.cloudinary_url.rsplit(".", 1)[-1]
    return cloudinary.utils.private_download_url(
        image.cloudinary_public_id, image_format, type="authenticated",
        expires_at=int(time.time()) + 60, attachment=False,
    )

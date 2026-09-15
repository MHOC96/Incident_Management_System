"""Convert legacy publicly accessible uploads to authenticated Cloudinary assets."""
import cloudinary.uploader
from django.core.management.base import BaseCommand
from apps.incidents.cloudinary_service import configure_cloudinary
from apps.incidents.models import IncidentImage


class Command(BaseCommand):
    help = "Protect legacy incident media. Defaults to a dry run; use --apply to change Cloudinary assets."

    def add_arguments(self, parser):
        parser.add_argument("--apply", action="store_true")

    def handle(self, *args, **options):
        configure_cloudinary()
        images = IncidentImage.objects.exclude(cloudinary_url__contains="/authenticated/")
        self.stdout.write(f"{images.count()} legacy images require protection.")
        if not options["apply"]:
            return
        for image in images.iterator():
            result = cloudinary.uploader.rename(
                image.cloudinary_public_id, image.cloudinary_public_id,
                type="upload", to_type="authenticated", invalidate=True, timeout=30,
            )
            image.cloudinary_url = result["secure_url"]
            image.save(update_fields=["cloudinary_url"])
            self.stdout.write(f"Protected image {image.pk}.")

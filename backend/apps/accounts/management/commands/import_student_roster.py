import csv
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from apps.accounts.models import User
from apps.accounts.student_email import student_email_from_mc
from apps.common.choices import AccountStatus, UserRole
from apps.common.validators import validate_mc_number

DEFAULT_ROSTER = Path(settings.BASE_DIR) / "data" / "student_roster.csv"


class Command(BaseCommand):
    help = (
        "Import university student accounts from a roster CSV. "
        "MC number is the username and CPM number is the initial password. "
        "Existing student passwords are not overwritten."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--file",
            default=str(DEFAULT_ROSTER),
            help="CSV with headers mc_number,cpm_number (or Mc Number, Cpm Number).",
        )

    def handle(self, *args, **options):
        path = Path(options["file"])
        if not path.exists():
            raise CommandError(f"Roster file not found: {path}")

        created = 0
        skipped = 0
        with path.open(newline="", encoding="utf-8-sig") as handle:
            reader = csv.DictReader(handle)
            if not reader.fieldnames:
                raise CommandError("The roster file has no header row.")

            field_map = {name.strip().lower().replace(" ", "_"): name for name in reader.fieldnames}
            mc_key = field_map.get("mc_number")
            cpm_key = field_map.get("cpm_number")
            if not mc_key or not cpm_key:
                raise CommandError("CSV must include mc_number and cpm_number columns.")

            with transaction.atomic():
                for row in reader:
                    raw_mc = str(row.get(mc_key) or "").strip()
                    raw_cpm = str(row.get(cpm_key) or "").strip()
                    if not raw_mc or not raw_cpm:
                        continue
                    try:
                        mc_number = validate_mc_number(raw_mc)
                    except ValueError as exc:
                        raise CommandError(f"Invalid MC number '{raw_mc}': {exc}") from exc

                    email = student_email_from_mc(mc_number)
                    existing = User.objects.filter(mc_number=mc_number, role=UserRole.STUDENT).first()
                    if existing:
                        if existing.email.lower() != email.lower():
                            if User.objects.filter(email__iexact=email).exclude(pk=existing.pk).exists():
                                raise CommandError(
                                    f"Cannot update student {mc_number}: email {email} already exists."
                                )
                            existing.email = email
                            existing.save(update_fields=["email", "updated_at"])
                        skipped += 1
                        continue
                    if User.objects.filter(email__iexact=email).exists():
                        raise CommandError(
                            f"Cannot create student {mc_number}: email {email} already exists."
                        )

                    User.objects.create_user(
                        email=email,
                        password=raw_cpm,
                        name=f"Student {mc_number}",
                        mc_number=mc_number,
                        role=UserRole.STUDENT,
                        status=AccountStatus.ACTIVE,
                    )
                    created += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Imported student roster from {path.name}: {created} created, {skipped} already present."
            )
        )

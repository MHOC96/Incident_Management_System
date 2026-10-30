from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from apps.accounts.roster_import import import_student_roster_file

DEFAULT_ROSTER = Path(settings.BASE_DIR) / "data" / "student_roster.csv"


class Command(BaseCommand):
    help = (
        "Import STUDENT role accounts from a roster CSV or Excel file (PDF MVP). "
        "MC number is the login username and CPM is the initial password; "
        "passwords are not overwritten for existing students. "
        "Use seed_fmsc_demo_accounts for other PDF roles and create_staff_user "
        "for additional staff."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--file",
            default=str(DEFAULT_ROSTER),
            help="CSV/XLSX with mc_number and cpm_number (or Mc Number, Cpm Number).",
        )

    def handle(self, *args, **options):
        path = Path(options["file"])
        if not path.exists():
            raise CommandError(f"Roster file not found: {path}")

        try:
            created, skipped = import_student_roster_file(path)
        except ValueError as exc:
            raise CommandError(str(exc)) from exc

        self.stdout.write(
            self.style.SUCCESS(
                f"Imported student roster from {path.name}: {created} created, {skipped} already present."
            )
        )

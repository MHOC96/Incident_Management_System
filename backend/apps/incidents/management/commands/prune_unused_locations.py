from django.core.management.base import BaseCommand
from django.db.models import Count

from apps.incidents.models import Location


class Command(BaseCommand):
    help = (
        "Deactivate catalog locations that are not used on any incident or revision "
        "(for example legacy seeded Block A/B/C entries)."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Print locations that would be deactivated without changing the database.",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        candidates = (
            Location.objects.filter(is_active=True)
            .annotate(
                incident_refs=Count("incidents", distinct=True),
                original_revision_refs=Count("original_incident_revisions", distinct=True),
                proposed_revision_refs=Count("proposed_incident_revisions", distinct=True),
            )
            .filter(
                incident_refs=0,
                original_revision_refs=0,
                proposed_revision_refs=0,
            )
            .order_by("name")
        )

        names = list(candidates.values_list("name", flat=True))
        if not names:
            self.stdout.write(self.style.SUCCESS("No unused locations to deactivate."))
            return

        if dry_run:
            self.stdout.write("Would deactivate:")
            for name in names:
                self.stdout.write(f"  - {name}")
            return

        updated = candidates.update(is_active=False)
        self.stdout.write(
            self.style.SUCCESS(f"Deactivated {updated} unused location(s).")
        )

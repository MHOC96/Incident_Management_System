from django.core.management.base import BaseCommand
from django.db import transaction

from apps.accounts.models import User
from apps.common.choices import AccountStatus, OfficialPosition, UserRole

# Local / staging only — change passwords before any real deployment.
DEMO_ACCOUNTS = (
    {
        "role": UserRole.ADMIN,
        "email": "administrator@fmsc.demo",
        "name": "FMSC Administrator",
        "password": "AdminDemo123!",
    },
    {
        "role": UserRole.MANAGEMENT,
        "email": "management@fmsc.demo",
        "name": "Faculty Management",
        "password": "ManagementDemo123!",
    },
    {
        "role": UserRole.SYSADMIN,
        "email": "sysadmin@fmsc.demo",
        "name": "System Administrator",
        "password": "SysadminDemo123!",
    },
    {
        "role": UserRole.AUTHORITY,
        "email": "authority@fmsc.demo",
        "name": "Relevant Authority",
        "password": "AuthorityDemo123!",
        "position": OfficialPosition.MAINTENANCE_OFFICER,
    },
    {
        "role": UserRole.LECTURER,
        "email": "lecturer@fmsc.demo",
        "name": "Demo Lecturer",
        "password": "LecturerDemo123!",
    },
)


class Command(BaseCommand):
    help = (
        "Create one demo account per PDF role (Administrator, Management, System "
        "Administrator, Relevant Authority, Lecturer). Students come from "
        "import_student_roster. Skips emails that already exist unless --reset."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Reset passwords and names for existing demo emails.",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        reset = options["reset"]
        created = 0
        updated = 0
        skipped = 0

        for spec in DEMO_ACCOUNTS:
            email = spec["email"].lower()
            existing = User.objects.filter(email=email).first()
            if existing:
                if not reset:
                    skipped += 1
                    continue
                existing.name = spec["name"]
                existing.role = spec["role"]
                existing.status = AccountStatus.ACTIVE
                if spec.get("position"):
                    existing.position = spec["position"]
                existing.set_password(spec["password"])
                existing.save()
                updated += 1
                continue

            user = User.objects.create_user(
                email=email,
                password=spec["password"],
                name=spec["name"],
                role=spec["role"],
                status=AccountStatus.ACTIVE,
                position=spec.get("position"),
            )
            created += 1
            self.stdout.write(
                self.style.SUCCESS(
                    f"Created {user.role} demo user {user.email} ({user.name})."
                )
            )

        self.stdout.write(
            self.style.SUCCESS(
                f"Demo accounts: {created} created, {updated} reset, {skipped} skipped."
            )
        )
        self.stdout.write(
            "Students: run import_student_roster with your roster CSV/XLSX "
            "(MC number = username, CPM = initial password)."
        )
        self.stdout.write(
            "Other staff: use create_staff_user --role ADMIN|MANAGEMENT|SYSADMIN|"
            "LECTURER|AUTHORITY with email, name, and password."
        )

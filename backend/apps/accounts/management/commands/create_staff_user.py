from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from apps.accounts.models import User
from apps.common.choices import AccountStatus, UserRole

ALLOWED_ROLES = {
    UserRole.ADMIN,
    UserRole.MANAGEMENT,
    UserRole.SYSADMIN,
    UserRole.LECTURER,
    UserRole.AUTHORITY,
}


class Command(BaseCommand):
    help = (
        "Provision one staff account: ADMIN (Administrator), MANAGEMENT (Faculty "
        "Management), SYSADMIN (System Administrator), LECTURER (reporter), or "
        "AUTHORITY (Relevant Authority). Students use import_student_roster."
    )

    def add_arguments(self, parser):
        parser.add_argument("--email", required=True)
        parser.add_argument("--name", required=True)
        parser.add_argument("--password", required=True)
        parser.add_argument(
            "--role",
            required=True,
            choices=sorted(r.value for r in ALLOWED_ROLES),
        )
        parser.add_argument("--phone", default="")

    @transaction.atomic
    def handle(self, *args, **options):
        role = options["role"]
        email = options["email"].lower().strip()

        if role not in {r.value for r in ALLOWED_ROLES}:
            raise CommandError(f"Unsupported role: {role}")

        if User.objects.filter(email=email).exists():
            raise CommandError(f"A user with email {email} already exists.")

        user = User.objects.create_user(
            email=email,
            password=options["password"],
            name=options["name"],
            phone=options.get("phone", ""),
            role=role,
            status=AccountStatus.ACTIVE,
        )

        self.stdout.write(
            self.style.SUCCESS(
                f"Created {role} account for {user.name} ({user.email})."
            )
        )

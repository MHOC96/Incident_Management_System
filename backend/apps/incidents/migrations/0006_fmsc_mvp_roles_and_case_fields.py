from django.db import migrations, models


def migrate_roles_and_statuses(apps, schema_editor):
    User = apps.get_model("accounts", "User")
    Incident = apps.get_model("incidents", "Incident")

    User.objects.filter(role="DEAN").update(role="MANAGEMENT")
    User.objects.filter(role="OFFICIAL").update(role="AUTHORITY")

    status_map = {
        "VERIFIED": "NOT_STARTED",
        "FORWARDED_TO_DEAN": "NOT_STARTED",
    }
    for old, new in status_map.items():
        Incident.objects.filter(status=old).update(status=new)


class Migration(migrations.Migration):
    dependencies = [
        ("incidents", "0005_incidentnumbersequence"),
        ("accounts", "0003_unique_student_mc_number"),
    ]

    operations = [
        migrations.AddField(
            model_name="incident",
            name="case_type",
            field=models.CharField(
                choices=[("COMPLAINT", "Complaint"), ("SUGGESTION", "Suggestion")],
                default="COMPLAINT",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="incident",
            name="reporter_priority",
            field=models.CharField(
                choices=[("URGENT", "Urgent"), ("NORMAL", "Normal")],
                default="NORMAL",
                max_length=10,
            ),
        ),
        migrations.AlterField(
            model_name="incident",
            name="status",
            field=models.CharField(
                choices=[
                    ("SUBMITTED", "Submitted"),
                    ("UNDER_REVIEW", "Under Review"),
                    ("NOT_STARTED", "Not Started"),
                    ("ASSIGNED", "Assigned"),
                    ("IN_PROGRESS", "In Progress"),
                    ("WAITING_FOR_INFORMATION", "Waiting for Information"),
                    ("RESOLVED", "Solved"),
                    ("CLOSED", "Closed"),
                    ("REJECTED", "Rejected"),
                    ("REOPENED", "Reopened"),
                ],
                default="SUBMITTED",
                max_length=30,
            ),
        ),
        migrations.RunPython(migrate_roles_and_statuses, migrations.RunPython.noop),
    ]

from django.db import migrations, models


def remap_legacy_roles(apps, schema_editor):
    User = apps.get_model("accounts", "User")
    User.objects.filter(role="DEAN").update(role="MANAGEMENT")
    User.objects.filter(role="OFFICIAL").update(role="AUTHORITY")


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0003_unique_student_mc_number"),
    ]

    operations = [
        migrations.RunPython(remap_legacy_roles, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="user",
            name="role",
            field=models.CharField(
                choices=[
                    ("STUDENT", "Student"),
                    ("LECTURER", "Lecturer"),
                    ("ADMIN", "Administrator"),
                    ("AUTHORITY", "Relevant Authority"),
                    ("MANAGEMENT", "Faculty Management"),
                    ("SYSADMIN", "System Administrator"),
                ],
                default="STUDENT",
                max_length=20,
            ),
        ),
    ]

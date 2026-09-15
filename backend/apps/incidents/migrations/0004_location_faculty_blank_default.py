from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("incidents", "0003_incident_revision_and_workflow_notes"),
    ]

    operations = [
        migrations.AlterField(
            model_name="location",
            name="faculty",
            field=models.CharField(blank=True, default="", max_length=255),
        ),
    ]

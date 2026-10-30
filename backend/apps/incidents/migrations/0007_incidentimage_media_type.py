from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("incidents", "0006_fmsc_mvp_roles_and_case_fields"),
    ]

    operations = [
        migrations.AddField(
            model_name="incidentimage",
            name="media_type",
            field=models.CharField(
                choices=[("IMAGE", "Image"), ("VIDEO", "Video")],
                default="IMAGE",
                max_length=10,
            ),
        ),
        migrations.AddField(
            model_name="incidentimage",
            name="resource_format",
            field=models.CharField(blank=True, max_length=12),
        ),
    ]

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("incidents", "0004_location_faculty_blank_default")]
    operations = [migrations.CreateModel(
        name="IncidentNumberSequence",
        fields=[("year", models.PositiveIntegerField(primary_key=True, serialize=False)),
                ("value", models.PositiveIntegerField(default=0))],
    ), migrations.AlterField(
        model_name="location", name="faculty",
        field=models.CharField(blank=True, default="Faculty of Management Studies and Commerce", max_length=255),
    )]

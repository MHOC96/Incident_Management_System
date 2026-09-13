import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("incidents", "0002_incidentvote"),
    ]

    operations = [
        migrations.AddField(model_name="incident", name="admin_review_note", field=models.TextField(blank=True)),
        migrations.AddField(model_name="incident", name="progress_note", field=models.TextField(blank=True)),
        migrations.AddField(model_name="incident", name="resolution_statement", field=models.TextField(blank=True)),
        migrations.AddField(model_name="incident", name="closure_note", field=models.TextField(blank=True)),
        migrations.AddField(model_name="incident", name="reopen_reason", field=models.TextField(blank=True)),
        migrations.CreateModel(
            name="IncidentRevision",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("status", models.CharField(choices=[("PENDING", "Pending review"), ("APPROVED", "Approved"), ("REJECTED", "Rejected")], default="PENDING", max_length=20)),
                ("original_title", models.CharField(max_length=255)),
                ("proposed_title", models.CharField(max_length=255)),
                ("original_description", models.TextField()),
                ("proposed_description", models.TextField()),
                ("original_visibility", models.CharField(choices=[("PUBLIC", "Public"), ("PRIVATE", "Private"), ("RESTRICTED", "Restricted")], max_length=20)),
                ("proposed_visibility", models.CharField(choices=[("PUBLIC", "Public"), ("PRIVATE", "Private"), ("RESTRICTED", "Restricted")], max_length=20)),
                ("review_comment", models.TextField(blank=True)),
                ("submitted_at", models.DateTimeField(auto_now_add=True)),
                ("reviewed_at", models.DateTimeField(blank=True, null=True)),
                ("incident", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="revisions", to="incidents.incident")),
                ("original_category", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="original_incident_revisions", to="incidents.category")),
                ("proposed_category", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="proposed_incident_revisions", to="incidents.category")),
                ("original_location", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="original_incident_revisions", to="incidents.location")),
                ("proposed_location", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="proposed_incident_revisions", to="incidents.location")),
                ("reviewed_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="reviewed_incident_revisions", to=settings.AUTH_USER_MODEL)),
                ("submitted_by", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="submitted_incident_revisions", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["-submitted_at"]},
        ),
        migrations.AddConstraint(
            model_name="incidentrevision",
            constraint=models.UniqueConstraint(condition=models.Q(("status", "PENDING")), fields=("incident",), name="one_pending_revision_per_incident"),
        ),
        migrations.AddIndex(model_name="incidentrevision", index=models.Index(fields=["status", "submitted_at"], name="incidents_i_status_d05f7a_idx")),
        migrations.AddIndex(model_name="incidentrevision", index=models.Index(fields=["incident", "status"], name="incidents_i_inciden_8901da_idx")),
    ]

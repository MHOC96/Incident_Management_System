from django.db import transaction
from django.utils import timezone

from apps.incidents.models import Incident, IncidentNumberSequence


@transaction.atomic
def generate_incident_number() -> str:
    year = timezone.localdate().year
    prefix = f"INC-{year}-"
    sequence, created = IncidentNumberSequence.objects.select_for_update().get_or_create(year=year)
    if created:
        numbers = Incident.objects.filter(incident_number__startswith=prefix).values_list("incident_number", flat=True)
        sequence.value = max((int(n[len(prefix):]) for n in numbers if n[len(prefix):].isdigit()), default=0)
    sequence.value += 1
    sequence.save(update_fields=["value"])
    return f"{prefix}{sequence.value:05d}"

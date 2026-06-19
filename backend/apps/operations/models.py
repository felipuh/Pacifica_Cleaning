from django.core.exceptions import ValidationError
from django.db import models

from apps.core.models import TimeStampedUUIDModel


class WorkOrder(TimeStampedUUIDModel):
    class Status(models.TextChoices):
        PLANNED = "planned", "Planificado"
        CONFIRMED = "confirmed", "Confirmado"
        IN_PROGRESS = "in_progress", "En proceso"
        COMPLETED = "completed", "Completado"
        CANCELLED = "cancelled", "Cancelado"

    quote = models.OneToOneField("services.Quote", null=True, blank=True, related_name="work_order", on_delete=models.SET_NULL)
    customer = models.ForeignKey("crm.Customer", related_name="work_orders", on_delete=models.PROTECT)
    property = models.ForeignKey("crm.Property", related_name="work_orders", on_delete=models.PROTECT)
    scheduled_start = models.DateTimeField()
    scheduled_end = models.DateTimeField()
    status = models.CharField(max_length=24, choices=Status.choices, default=Status.PLANNED)
    route_zone = models.CharField(max_length=100, blank=True)
    travel_minutes = models.PositiveIntegerField(default=0)
    checklist_notes = models.TextField(blank=True)
    client_confirmation = models.CharField(max_length=160, blank=True)

    def clean(self):
        if self.scheduled_end <= self.scheduled_start:
            raise ValidationError("La hora final debe ser posterior a la inicial.")


class Assignment(TimeStampedUUIDModel):
    work_order = models.ForeignKey(WorkOrder, related_name="assignments", on_delete=models.CASCADE)
    worker = models.ForeignKey("people.WorkerProfile", related_name="assignments", on_delete=models.PROTECT)
    role = models.CharField(max_length=80, default="Limpieza")

    def clean(self):
        qs = Assignment.objects.filter(
            worker=self.worker,
            work_order__scheduled_start__lt=self.work_order.scheduled_end,
            work_order__scheduled_end__gt=self.work_order.scheduled_start,
        ).exclude(pk=self.pk)
        if qs.exists():
            raise ValidationError("La persona asignada ya tiene un servicio en ese horario.")


class ChecklistTemplate(TimeStampedUUIDModel):
    service = models.ForeignKey("services.Service", related_name="checklist_templates", on_delete=models.CASCADE)
    name = models.CharField(max_length=160)
    is_active = models.BooleanField(default=True)


class ChecklistItem(TimeStampedUUIDModel):
    template = models.ForeignKey(ChecklistTemplate, related_name="items", on_delete=models.CASCADE)
    label = models.CharField(max_length=180)
    required = models.BooleanField(default=True)
    sort_order = models.PositiveSmallIntegerField(default=0)


class ChecklistResult(TimeStampedUUIDModel):
    work_order = models.ForeignKey(WorkOrder, related_name="checklist_results", on_delete=models.CASCADE)
    item = models.ForeignKey(ChecklistItem, on_delete=models.PROTECT)
    completed = models.BooleanField(default=False)
    notes = models.TextField(blank=True)
    completed_by = models.ForeignKey("accounts.User", null=True, blank=True, on_delete=models.SET_NULL)


class QualityReview(TimeStampedUUIDModel):
    work_order = models.ForeignKey(WorkOrder, related_name="quality_reviews", on_delete=models.CASCADE)
    score = models.PositiveSmallIntegerField()
    observations = models.TextField(blank=True)
    claim = models.TextField(blank=True)
    rework_required = models.BooleanField(default=False)
    rework_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    nps = models.SmallIntegerField(null=True, blank=True)


class Incident(TimeStampedUUIDModel):
    work_order = models.ForeignKey(WorkOrder, related_name="incidents", on_delete=models.CASCADE)
    severity = models.CharField(max_length=20, choices=[("low", "Baja"), ("medium", "Media"), ("high", "Alta")])
    description = models.TextField()
    follow_up = models.TextField(blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

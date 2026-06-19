from django.db import models

from apps.core.models import TimeStampedUUIDModel


class WorkerProfile(TimeStampedUUIDModel):
    class WorkerType(models.TextChoices):
        EMPLOYEE = "employee", "Personal laboral"
        CONTRACTOR = "contractor", "Prestador independiente"

    class Status(models.TextChoices):
        ACTIVE = "active", "Activo"
        INACTIVE = "inactive", "Inactivo"
        SUSPENDED = "suspended", "Suspendido"

    user = models.OneToOneField("accounts.User", null=True, blank=True, related_name="worker_profile", on_delete=models.SET_NULL)
    worker_type = models.CharField(max_length=24, choices=WorkerType.choices)
    full_name = models.CharField(max_length=160)
    phone = models.CharField(max_length=32)
    email = models.EmailField(blank=True)
    emergency_contact = models.JSONField(default=dict, blank=True)
    availability = models.JSONField(default=dict, blank=True)
    zones = models.JSONField(default=list, blank=True)
    skills = models.JSONField(default=list, blank=True)
    trainings = models.JSONField(default=list, blank=True)
    references = models.TextField(blank=True)
    status = models.CharField(max_length=24, choices=Status.choices, default=Status.ACTIVE)
    start_date = models.DateField(null=True, blank=True)
    contract_expires_at = models.DateField(null=True, blank=True)
    ins_policy_status = models.CharField(max_length=120, blank=True)
    ccss_status = models.CharField(max_length=120, blank=True)
    compensation_terms = models.TextField(blank=True)
    incidents = models.TextField(blank=True)
    evaluations = models.JSONField(default=list, blank=True)
    contractor_exclusivity = models.BooleanField(default=False)
    contractor_fixed_schedule = models.BooleanField(default=False)
    contractor_direct_supervision = models.BooleanField(default=False)
    contractor_company_tools_required = models.BooleanField(default=False)

    def independence_risk_flags(self) -> list[str]:
        flags = []
        if self.worker_type != self.WorkerType.CONTRACTOR:
            return flags
        if self.contractor_exclusivity:
            flags.append("Exclusividad")
        if self.contractor_fixed_schedule:
            flags.append("Horario impuesto")
        if self.contractor_direct_supervision:
            flags.append("Supervision continua")
        if self.contractor_company_tools_required:
            flags.append("Herramientas obligatorias de la empresa")
        return flags


class WorkerPayment(TimeStampedUUIDModel):
    worker = models.ForeignKey(WorkerProfile, related_name="payments", on_delete=models.PROTECT)
    work_order = models.ForeignKey("operations.WorkOrder", null=True, blank=True, on_delete=models.SET_NULL)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, default="CRC")
    paid_at = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)

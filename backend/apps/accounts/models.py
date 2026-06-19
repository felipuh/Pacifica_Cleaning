import uuid

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone


class User(AbstractUser):
    class Role(models.TextChoices):
        SUPERADMIN = "superadmin", "Superadministrador"
        MANAGING_PARTNER = "managing_partner", "Socio administrador"
        OPERATIONS = "operations", "Operaciones"
        SALES = "sales", "Ventas"
        FINANCE = "finance", "Finanzas"
        QUALITY = "quality", "Supervisor de calidad"
        STAFF = "staff", "Personal operativo"
        CONTRACTOR = "contractor", "Prestador independiente"
        AUDITOR = "auditor", "Consulta o auditoria"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    role = models.CharField(max_length=32, choices=Role.choices, default=Role.AUDITOR)
    phone = models.CharField(max_length=32, blank=True)
    mfa_enabled = models.BooleanField(default=False)
    mfa_secret = models.CharField(max_length=64, blank=True)
    force_password_change = models.BooleanField(default=True)
    last_seen_at = models.DateTimeField(null=True, blank=True)

    def touch_last_seen(self) -> None:
        self.last_seen_at = timezone.now()
        self.save(update_fields=["last_seen_at"])


class LoginAttempt(models.Model):
    email = models.EmailField()
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    successful = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [models.Index(fields=["email", "created_at"])]

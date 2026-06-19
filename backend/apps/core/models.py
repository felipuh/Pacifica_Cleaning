import hashlib
import uuid
from datetime import timedelta

from django.conf import settings
from django.db import models
from django.urls import reverse
from django.utils import timezone


class TimeStampedUUIDModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class AuditLog(TimeStampedUUIDModel):
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)
    action = models.CharField(max_length=120)
    entity_type = models.CharField(max_length=120)
    entity_id = models.CharField(max_length=64, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["-created_at"]


class ConsentRecord(TimeStampedUUIDModel):
    class ConsentType(models.TextChoices):
        DATA_PROCESSING = "data_processing", "Tratamiento de datos"
        PHOTOS = "photos", "Fotografias autorizadas"
        MARKETING = "marketing", "Marketing"
        WHATSAPP = "whatsapp", "WhatsApp"

    subject_email = models.EmailField()
    consent_type = models.CharField(max_length=32, choices=ConsentType.choices)
    granted = models.BooleanField(default=True)
    source = models.CharField(max_length=120, blank=True)
    evidence = models.JSONField(default=dict, blank=True)
    revoked_at = models.DateTimeField(null=True, blank=True)


class PrivateAttachment(TimeStampedUUIDModel):
    owner_type = models.CharField(max_length=80)
    owner_id = models.UUIDField()
    title = models.CharField(max_length=160)
    file = models.FileField(upload_to="private/%Y/%m/")
    mime_type = models.CharField(max_length=120)
    size_bytes = models.PositiveIntegerField()
    sha256 = models.CharField(max_length=64, editable=False)
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)
    is_sensitive = models.BooleanField(default=True)

    def save(self, *args, **kwargs):
        if self.file and not self.sha256:
            digest = hashlib.sha256()
            for chunk in self.file.chunks():
                digest.update(chunk)
            self.sha256 = digest.hexdigest()
        super().save(*args, **kwargs)

    def signed_url(self, minutes: int = 10) -> str:
        expires = int((timezone.now() + timedelta(minutes=minutes)).timestamp())
        payload = f"{self.pk}:{expires}:{settings.SECRET_KEY}".encode()
        token = hashlib.sha256(payload).hexdigest()
        return f"{reverse('private-file', args=[self.pk])}?expires={expires}&token={token}"

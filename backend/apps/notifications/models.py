from django.db import models

from apps.core.models import TimeStampedUUIDModel


class NotificationTemplate(TimeStampedUUIDModel):
    class Channel(models.TextChoices):
        EMAIL = "email", "Correo"
        WHATSAPP = "whatsapp", "WhatsApp"
        INTERNAL = "internal", "Interna"

    key = models.SlugField(unique=True)
    channel = models.CharField(max_length=24, choices=Channel.choices)
    subject = models.CharField(max_length=180, blank=True)
    body_es = models.TextField()
    body_en = models.TextField(blank=True)
    active = models.BooleanField(default=True)


class NotificationLog(TimeStampedUUIDModel):
    template = models.ForeignKey(NotificationTemplate, null=True, blank=True, on_delete=models.SET_NULL)
    channel = models.CharField(max_length=24)
    recipient = models.CharField(max_length=180)
    payload = models.JSONField(default=dict)
    status = models.CharField(max_length=24, default="pending")
    error = models.TextField(blank=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    opt_out_respected = models.BooleanField(default=True)

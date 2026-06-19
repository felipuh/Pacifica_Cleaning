from django.db import models

from apps.core.models import TimeStampedUUIDModel


class Lead(TimeStampedUUIDModel):
    class Status(models.TextChoices):
        NEW = "new", "Nuevo"
        CONTACTED = "contacted", "Contactado"
        QUALIFIED = "qualified", "Calificado"
        WON = "won", "Convertido"
        LOST = "lost", "Perdido"

    full_name = models.CharField(max_length=160)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=32)
    preferred_language = models.CharField(max_length=2, choices=[("es", "Espanol"), ("en", "English")], default="es")
    source = models.CharField(max_length=80, blank=True)
    utm = models.JSONField(default=dict, blank=True)
    status = models.CharField(max_length=24, choices=Status.choices, default=Status.NEW)
    requested_service = models.CharField(max_length=120, blank=True)
    message = models.TextField(blank=True)
    consent_data_processing = models.BooleanField(default=False)
    consent_marketing = models.BooleanField(default=False)
    assigned_to = models.ForeignKey("accounts.User", null=True, blank=True, on_delete=models.SET_NULL)
    next_follow_up_at = models.DateTimeField(null=True, blank=True)

    def __str__(self) -> str:
        return self.full_name


class Customer(TimeStampedUUIDModel):
    class Status(models.TextChoices):
        ACTIVE = "active", "Activo"
        INACTIVE = "inactive", "Inactivo"
        DELINQUENT = "delinquent", "Moroso"

    display_name = models.CharField(max_length=160)
    legal_name = models.CharField(max_length=200, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=32, blank=True)
    preferred_language = models.CharField(max_length=2, choices=[("es", "Espanol"), ("en", "English")], default="es")
    status = models.CharField(max_length=24, choices=Status.choices, default=Status.ACTIVE)
    tags = models.JSONField(default=list, blank=True)
    preferences = models.JSONField(default=dict, blank=True)
    pets = models.TextField(blank=True)
    special_instructions = models.TextField(blank=True)
    referral_source = models.CharField(max_length=120, blank=True)

    def __str__(self) -> str:
        return self.display_name


class Contact(TimeStampedUUIDModel):
    customer = models.ForeignKey(Customer, related_name="contacts", on_delete=models.CASCADE)
    full_name = models.CharField(max_length=160)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=32, blank=True)
    role = models.CharField(max_length=80, blank=True)
    is_primary = models.BooleanField(default=False)


class Property(TimeStampedUUIDModel):
    class PropertyType(models.TextChoices):
        HOME = "home", "Residencial"
        OFFICE = "office", "Oficina"
        VACATION = "vacation", "Propiedad vacacional/Airbnb"

    customer = models.ForeignKey(Customer, related_name="properties", on_delete=models.CASCADE)
    name = models.CharField(max_length=160)
    property_type = models.CharField(max_length=24, choices=PropertyType.choices, default=PropertyType.HOME)
    address = models.TextField()
    zone = models.CharField(max_length=100)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    distance_km = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    area_m2 = models.PositiveIntegerField(null=True, blank=True)
    bedrooms = models.PositiveSmallIntegerField(default=0)
    bathrooms = models.DecimalField(max_digits=4, decimal_places=1, default=0)
    floor_type = models.CharField(max_length=120, blank=True)
    complexity_level = models.PositiveSmallIntegerField(default=1)
    amenities = models.JSONField(default=list, blank=True)
    inventory_notes = models.TextField(blank=True)
    airbnb_check_in = models.TimeField(null=True, blank=True)
    airbnb_check_out = models.TimeField(null=True, blank=True)
    access_instructions = models.TextField(blank=True)
    alarm_notes = models.TextField(blank=True)
    restrictions = models.TextField(blank=True)
    standard_minutes = models.PositiveIntegerField(default=120)

    def masked_access(self) -> str:
        return "Registrado; visible solo para roles autorizados." if self.access_instructions else ""


class Communication(TimeStampedUUIDModel):
    class Channel(models.TextChoices):
        PHONE = "phone", "Telefono"
        EMAIL = "email", "Correo"
        WHATSAPP = "whatsapp", "WhatsApp"
        INTERNAL = "internal", "Interno"

    lead = models.ForeignKey(Lead, null=True, blank=True, related_name="communications", on_delete=models.CASCADE)
    customer = models.ForeignKey(Customer, null=True, blank=True, related_name="communications", on_delete=models.CASCADE)
    channel = models.CharField(max_length=24, choices=Channel.choices)
    direction = models.CharField(max_length=16, choices=[("in", "Entrante"), ("out", "Saliente")])
    subject = models.CharField(max_length=160, blank=True)
    body = models.TextField()
    created_by = models.ForeignKey("accounts.User", null=True, blank=True, on_delete=models.SET_NULL)

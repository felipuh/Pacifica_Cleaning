from decimal import Decimal

from django.db import models
from django.utils import timezone

from apps.core.models import TimeStampedUUIDModel


class Service(TimeStampedUUIDModel):
    class PricingMode(models.TextChoices):
        HOURLY = "hourly", "Por hora"
        FIXED = "fixed", "Fijo"
        PACKAGE = "package", "Paquete"

    name_es = models.CharField(max_length=140)
    name_en = models.CharField(max_length=140)
    slug = models.SlugField(unique=True)
    description_es = models.TextField()
    description_en = models.TextField(blank=True)
    included_tasks = models.JSONField(default=list, blank=True)
    exclusions = models.JSONField(default=list, blank=True)
    pricing_mode = models.CharField(max_length=16, choices=PricingMode.choices)
    is_active = models.BooleanField(default=True)

    def __str__(self) -> str:
        return self.name_es


class PriceVersion(TimeStampedUUIDModel):
    service = models.ForeignKey(Service, related_name="prices", on_delete=models.CASCADE)
    currency = models.CharField(max_length=3, choices=[("CRC", "CRC"), ("USD", "USD")], default="CRC")
    hourly_rate = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    fixed_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    minimum_fee = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax_rate = models.DecimalField(max_digits=5, decimal_places=4, default=Decimal("0.1300"))
    expected_margin = models.DecimalField(max_digits=5, decimal_places=4, default=Decimal("0.3500"))
    valid_from = models.DateField(default=timezone.localdate)
    valid_to = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)
    approved_by = models.ForeignKey("accounts.User", null=True, blank=True, on_delete=models.SET_NULL)

    class Meta:
        ordering = ["-valid_from"]


class Quote(TimeStampedUUIDModel):
    class Status(models.TextChoices):
        DRAFT = "draft", "Borrador"
        SENT = "sent", "Enviada"
        ACCEPTED = "accepted", "Aceptada"
        REJECTED = "rejected", "Rechazada"
        EXPIRED = "expired", "Caducada"

    customer = models.ForeignKey("crm.Customer", related_name="quotes", on_delete=models.CASCADE)
    property = models.ForeignKey("crm.Property", related_name="quotes", on_delete=models.PROTECT)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    currency = models.CharField(max_length=3, choices=[("CRC", "CRC"), ("USD", "USD")], default="CRC")
    valid_until = models.DateField()
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    discount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    margin_estimate = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    notes = models.TextField(blank=True)
    accepted_at = models.DateTimeField(null=True, blank=True)
    source_lead = models.ForeignKey("crm.Lead", null=True, blank=True, related_name="quotes", on_delete=models.SET_NULL)
    terms = models.TextField(blank=True)

    def recalculate(self) -> None:
        subtotal = sum((line.line_total for line in self.lines.all()), Decimal("0.00"))
        max_tax_rate = max((line.tax_rate for line in self.lines.all()), default=Decimal("0.00"))
        self.subtotal = subtotal
        self.tax = (subtotal - self.discount) * max_tax_rate
        self.total = subtotal - self.discount + self.tax
        self.margin_estimate = sum((line.margin_estimate for line in self.lines.all()), Decimal("0.00"))

    def accept(self) -> None:
        if self.status != self.Status.SENT:
            raise ValueError("Solo una cotización enviada puede aceptarse.")
        if self.valid_until < timezone.localdate():
            self.status = self.Status.EXPIRED
            self.save(update_fields=["status", "updated_at"])
            raise ValueError("La cotización está vencida.")
        self.status = self.Status.ACCEPTED
        self.accepted_at = timezone.now()
        self.save(update_fields=["status", "accepted_at", "updated_at"])


class QuoteLine(TimeStampedUUIDModel):
    quote = models.ForeignKey(Quote, related_name="lines", on_delete=models.CASCADE)
    service = models.ForeignKey(Service, on_delete=models.PROTECT)
    description = models.CharField(max_length=220)
    quantity = models.DecimalField(max_digits=8, decimal_places=2, default=1)
    estimated_hours = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    tax_rate = models.DecimalField(max_digits=5, decimal_places=4, default=Decimal("0.1300"))
    expected_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    line_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    margin_estimate = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    def save(self, *args, **kwargs):
        basis = self.estimated_hours if self.estimated_hours else self.quantity
        self.line_total = basis * self.unit_price
        self.margin_estimate = self.line_total - self.expected_cost
        super().save(*args, **kwargs)


class QuoteStatusHistory(TimeStampedUUIDModel):
    quote = models.ForeignKey(Quote, related_name="status_history", on_delete=models.CASCADE)
    from_status = models.CharField(max_length=20, blank=True)
    to_status = models.CharField(max_length=20, choices=Quote.Status.choices)
    notes = models.TextField(blank=True)
    changed_by = models.ForeignKey("accounts.User", null=True, blank=True, on_delete=models.SET_NULL)

    class Meta:
        ordering = ["-created_at"]

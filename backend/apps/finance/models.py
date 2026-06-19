from django.db import models

from apps.core.models import TimeStampedUUIDModel


class Payment(TimeStampedUUIDModel):
    class Method(models.TextChoices):
        SINPE = "sinpe", "SINPE"
        CASH = "cash", "Efectivo"
        TRANSFER = "transfer", "Transferencia"
        CARD = "card", "Tarjeta"
        OTHER = "other", "Otro"

    customer = models.ForeignKey("crm.Customer", related_name="payments", on_delete=models.PROTECT)
    work_order = models.ForeignKey("operations.WorkOrder", null=True, blank=True, related_name="payments", on_delete=models.SET_NULL)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, choices=[("CRC", "CRC"), ("USD", "USD")], default="CRC")
    method = models.CharField(max_length=24, choices=Method.choices)
    paid_at = models.DateField()
    reference = models.CharField(max_length=160, blank=True)
    receipt = models.FileField(upload_to="receipts/%Y/%m/", blank=True)


class Expense(TimeStampedUUIDModel):
    class Category(models.TextChoices):
        SUPPLIES = "supplies", "Insumos"
        TRANSPORT = "transport", "Transporte"
        PAYROLL = "payroll", "Remuneraciones"
        CONTRACTOR = "contractor", "Honorarios"
        EQUIPMENT = "equipment", "Equipo"
        OTHER = "other", "Otro"

    work_order = models.ForeignKey("operations.WorkOrder", null=True, blank=True, related_name="expenses", on_delete=models.SET_NULL)
    category = models.CharField(max_length=24, choices=Category.choices)
    description = models.CharField(max_length=220)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, choices=[("CRC", "CRC"), ("USD", "USD")], default="CRC")
    incurred_at = models.DateField()
    vendor = models.CharField(max_length=160, blank=True)
    receipt = models.FileField(upload_to="expenses/%Y/%m/", blank=True)


class AccountingIntegrationIntent(TimeStampedUUIDModel):
    provider = models.CharField(max_length=120)
    payload = models.JSONField(default=dict)
    status = models.CharField(max_length=24, default="pending")
    response = models.JSONField(default=dict, blank=True)

from django.core.exceptions import ValidationError
from django.db import models

from apps.core.models import TimeStampedUUIDModel


class InventoryItem(TimeStampedUUIDModel):
    name = models.CharField(max_length=160)
    category = models.CharField(max_length=80)
    unit = models.CharField(max_length=32, default="unidad")
    stock_on_hand = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    minimum_stock = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    lot = models.CharField(max_length=80, blank=True)
    expires_at = models.DateField(null=True, blank=True)
    supplier = models.CharField(max_length=160, blank=True)
    unit_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    responsible = models.ForeignKey("accounts.User", null=True, blank=True, on_delete=models.SET_NULL)

    @property
    def below_minimum(self) -> bool:
        return self.stock_on_hand <= self.minimum_stock


class StockMovement(TimeStampedUUIDModel):
    class MovementType(models.TextChoices):
        IN = "in", "Entrada"
        OUT = "out", "Salida"
        LOSS = "loss", "Perdida o dano"

    item = models.ForeignKey(InventoryItem, related_name="movements", on_delete=models.PROTECT)
    work_order = models.ForeignKey("operations.WorkOrder", null=True, blank=True, on_delete=models.SET_NULL)
    movement_type = models.CharField(max_length=12, choices=MovementType.choices)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    notes = models.TextField(blank=True)

    def clean(self):
        if self.quantity <= 0:
            raise ValidationError("La cantidad debe ser positiva.")

    def save(self, *args, **kwargs):
        self.full_clean()
        if self._state.adding:
            if self.movement_type == self.MovementType.IN:
                self.item.stock_on_hand += self.quantity
            else:
                if self.item.stock_on_hand < self.quantity:
                    raise ValidationError("Stock insuficiente.")
                self.item.stock_on_hand -= self.quantity
            self.item.save(update_fields=["stock_on_hand", "updated_at"])
        super().save(*args, **kwargs)

from django.db import models

from apps.core.models import TimeStampedUUIDModel


class Campaign(TimeStampedUUIDModel):
    name = models.CharField(max_length=160)
    channel = models.CharField(max_length=80)
    starts_at = models.DateField()
    ends_at = models.DateField(null=True, blank=True)
    budget = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    consent_required = models.BooleanField(default=True)
    utm_source = models.CharField(max_length=80, blank=True)
    utm_campaign = models.CharField(max_length=120, blank=True)


class Coupon(TimeStampedUUIDModel):
    code = models.CharField(max_length=40, unique=True)
    description = models.CharField(max_length=180)
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    discount_percent = models.DecimalField(max_digits=5, decimal_places=4, default=0)
    max_uses = models.PositiveIntegerField(default=1)
    used_count = models.PositiveIntegerField(default=0)
    valid_until = models.DateField()
    active = models.BooleanField(default=True)


class Referral(TimeStampedUUIDModel):
    referrer = models.ForeignKey("crm.Customer", related_name="referrals_made", on_delete=models.PROTECT)
    referred = models.ForeignKey("crm.Customer", null=True, blank=True, related_name="referrals_received", on_delete=models.SET_NULL)
    lead = models.ForeignKey("crm.Lead", null=True, blank=True, on_delete=models.SET_NULL)
    reward_status = models.CharField(max_length=32, default="pending")

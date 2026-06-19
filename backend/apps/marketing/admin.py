from django.contrib import admin

from .models import Campaign, Coupon, Referral

admin.site.register(Campaign)
admin.site.register(Coupon)
admin.site.register(Referral)

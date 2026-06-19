from django.contrib import admin

from .models import PriceVersion, Quote, QuoteLine, Service

admin.site.register(Service)
admin.site.register(PriceVersion)
admin.site.register(Quote)
admin.site.register(QuoteLine)

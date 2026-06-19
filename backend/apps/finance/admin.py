from django.contrib import admin

from .models import AccountingIntegrationIntent, Expense, Payment

admin.site.register(Payment)
admin.site.register(Expense)
admin.site.register(AccountingIntegrationIntent)

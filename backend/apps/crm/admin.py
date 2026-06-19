from django.contrib import admin

from .models import Communication, Contact, Customer, Lead, Property

admin.site.register(Lead)
admin.site.register(Customer)
admin.site.register(Contact)
admin.site.register(Property)
admin.site.register(Communication)

from django.contrib import admin

from .models import WorkerPayment, WorkerProfile

admin.site.register(WorkerProfile)
admin.site.register(WorkerPayment)

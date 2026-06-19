from django.contrib import admin

from .models import NotificationLog, NotificationTemplate

admin.site.register(NotificationTemplate)
admin.site.register(NotificationLog)

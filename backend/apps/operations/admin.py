from django.contrib import admin

from .models import Assignment, ChecklistItem, ChecklistResult, ChecklistTemplate, Incident, QualityReview, WorkOrder

admin.site.register(WorkOrder)
admin.site.register(Assignment)
admin.site.register(ChecklistTemplate)
admin.site.register(ChecklistItem)
admin.site.register(ChecklistResult)
admin.site.register(QualityReview)
admin.site.register(Incident)

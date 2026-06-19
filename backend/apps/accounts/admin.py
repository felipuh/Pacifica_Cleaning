from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import LoginAttempt, User


@admin.register(User)
class PacificaUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (("Pacifica", {"fields": ("role", "phone", "mfa_enabled", "force_password_change")} ),)
    list_display = ("email", "username", "role", "is_active", "last_seen_at")


@admin.register(LoginAttempt)
class LoginAttemptAdmin(admin.ModelAdmin):
    list_display = ("email", "ip_address", "successful", "created_at")
    list_filter = ("successful",)

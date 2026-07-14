from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from apps.crm.models import Lead


class Command(BaseCommand):
    help = "Adds clearly synthetic role and archive records used by infrastructure validation."

    def handle(self, *args, **options):
        user_model = get_user_model()
        roles = [
            user_model.Role.SUPERADMIN,
            user_model.Role.MANAGING_PARTNER,
            user_model.Role.OPERATIONS,
            user_model.Role.SALES,
            user_model.Role.FINANCE,
            user_model.Role.QUALITY,
        ]
        for index, role in enumerate(roles, start=1):
            email = f"synthetic-role-{index}@example.invalid"
            user_model.objects.get_or_create(
                username=email,
                defaults={"email": email, "role": role, "is_active": True},
            )

        Lead.objects.get_or_create(
            phone="0000-ARCHIVED",
            defaults={
                "full_name": "Synthetic Archived Lead",
                "email": "synthetic-archived@example.invalid",
                "source": "staging-validation",
                "consent_data_processing": True,
                "is_archived": True,
            },
        )
        self.stdout.write(self.style.SUCCESS("Synthetic staging validation records are ready."))

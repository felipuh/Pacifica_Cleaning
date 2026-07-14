from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from rest_framework.test import APIClient

from apps.crm.models import Customer, Lead


class Command(BaseCommand):
    help = "Runs authenticated operational smoke checks against a restored staging database."

    def handle(self, *args, **options):
        user = get_user_model().objects.filter(is_superuser=True).first()
        if user is None:
            raise CommandError("A restored super administrator is required.")

        client = APIClient()
        client.force_authenticate(user=user)
        routes = [
            "/api/v1/dashboard/",
            "/api/v1/leads/",
            "/api/v1/customers/",
            "/api/v1/properties/",
            "/api/v1/quotes/",
            "/api/v1/work-orders/",
        ]
        for route in routes:
            response = client.get(route)
            if response.status_code != 200:
                raise CommandError(f"Restored smoke failed for {route}: HTTP {response.status_code}")

        lead_response = client.post(
            "/api/v1/leads/",
            {
                "full_name": "Synthetic Restored Smoke Lead",
                "email": "restored-smoke@example.invalid",
                "phone": "0000-SMOKE",
                "consent_data_processing": True,
            },
            format="json",
        )
        if lead_response.status_code != 201:
            raise CommandError(f"Restored lead creation failed: HTTP {lead_response.status_code}")
        lead_id = lead_response.json()["id"]

        conversion = client.post(f"/api/v1/leads/{lead_id}/convert/", {}, format="json")
        if conversion.status_code != 201:
            raise CommandError(f"Restored lead conversion failed: HTTP {conversion.status_code}")
        if not Lead.objects.filter(pk=lead_id, status=Lead.Status.WON).exists():
            raise CommandError("Converted lead did not persist in the restored database.")
        if not Customer.objects.filter(source_lead_id=lead_id).exists():
            raise CommandError("Converted customer did not persist in the restored database.")

        self.stdout.write(self.style.SUCCESS("Restored operational smoke passed."))

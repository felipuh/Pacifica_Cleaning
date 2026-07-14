from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from apps.crm.models import Lead


class PublicSiteTests(TestCase):
    def test_home_page_loads_in_spanish_and_english(self):
        spanish = self.client.get(reverse("public_site:home") + "?lang=es")
        english = self.client.get(reverse("public_site:home") + "?lang=en")

        self.assertContains(spanish, "Limpieza profesional")
        self.assertContains(english, "Professional cleaning")

    def test_contact_form_creates_lead(self):
        response = self.client.post(
            reverse("public_site:contact") + "?lang=es",
            {
                "full_name": "Cliente Web",
                "phone": "8888-1111",
                "email": "cliente@example.com",
                "preferred_language": "es",
                "requested_service": "Limpieza profunda",
                "message": "Casa en Tempate",
                "consent_data_processing": "true",
            },
        )

        self.assertRedirects(response, reverse("public_site:contact") + "?lang=es")
        self.assertEqual(Lead.objects.count(), 1)
        self.assertEqual(Lead.objects.get().source, "website")

    def test_public_api_creates_lead_but_does_not_expose_lead_list(self):
        client = APIClient()
        response = client.post(
            "/api/v1/leads/",
            {
                "full_name": "Cliente API",
                "phone": "8888-2222",
                "consent_data_processing": True,
                "source": "website",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(client.get("/api/v1/leads/").status_code, 403)

    def test_health_check_verifies_database(self):
        response = self.client.get(reverse("public_site:health"))

        self.assertEqual(response.status_code, 200)
        self.assertJSONEqual(response.content, {"status": "ok", "database": "ok"})

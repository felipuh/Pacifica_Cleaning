from django.test import TestCase
from django.urls import reverse

from apps.crm.models import Lead


class PublicSiteTests(TestCase):
    def test_home_page_loads_in_spanish_and_english(self):
        spanish = self.client.get(reverse("public_site:home") + "?lang=es")
        english = self.client.get(reverse("public_site:home") + "?lang=en")

        self.assertContains(spanish, "Limpieza confiable")
        self.assertContains(english, "Reliable cleaning")

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

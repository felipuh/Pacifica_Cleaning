from urllib.parse import parse_qs, urlparse

from django.contrib.auth import get_user_model
from django.core import mail
from django.test import TestCase, override_settings
from rest_framework.test import APIClient


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class PasswordRecoveryTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="operations@example.com",
            email="operations@example.com",
            password="Initial-Password-12345",
            role="operations",
        )
        self.client = APIClient()

    def test_reset_request_does_not_enumerate_accounts(self):
        existing = self.client.post(
            "/api/auth/password/reset/request/",
            {"email": self.user.email},
            format="json",
        )
        missing = self.client.post(
            "/api/auth/password/reset/request/",
            {"email": "missing@example.com"},
            format="json",
        )

        self.assertEqual(existing.status_code, 200)
        self.assertEqual(missing.status_code, 200)
        self.assertEqual(existing.json(), missing.json())
        self.assertEqual(len(mail.outbox), 1)

    def test_valid_reset_token_changes_password_and_cannot_be_reused(self):
        self.client.post(
            "/api/auth/password/reset/request/",
            {"email": self.user.email},
            format="json",
        )
        reset_url = mail.outbox[0].body.rsplit(" ", 1)[-1]
        query = parse_qs(urlparse(reset_url).query)
        payload = {
            "uid": query["uid"][0],
            "token": query["token"][0],
            "password": "Replacement-Password-98765",
        }

        response = self.client.post("/api/auth/password/reset/confirm/", payload, format="json")
        reused = self.client.post("/api/auth/password/reset/confirm/", payload, format="json")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(reused.status_code, 400)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("Replacement-Password-98765"))

    def test_authenticated_user_can_change_password(self):
        self.client.force_login(self.user)
        response = self.client.post(
            "/api/auth/password/change/",
            {
                "current_password": "Initial-Password-12345",
                "password": "Changed-Password-67890",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("Changed-Password-67890"))

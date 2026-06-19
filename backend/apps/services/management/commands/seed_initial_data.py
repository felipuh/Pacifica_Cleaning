from datetime import timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.notifications.models import NotificationTemplate
from apps.services.models import PriceVersion, Service


class Command(BaseCommand):
    help = "Seeds safe initial catalog data for Pacifica Cleaning."

    def handle(self, *args, **options):
        services = [
            ("limpieza-residencial", "Limpieza residencial", "Residential cleaning", "hourly", Decimal("9500")),
            ("limpieza-profunda", "Limpieza profunda", "Deep cleaning", "fixed", Decimal("65000")),
            ("limpieza-recurrente", "Limpieza recurrente", "Recurring cleaning", "hourly", Decimal("8500")),
            ("oficinas-pequenas", "Oficinas pequenas", "Small offices", "hourly", Decimal("10000")),
            ("airbnb", "Propiedades vacacionales y Airbnb", "Vacation rentals and Airbnb", "fixed", Decimal("55000")),
            ("organizacion", "Organizacion de espacios", "Space organization", "hourly", Decimal("12000")),
        ]
        for slug, es, en, mode, price in services:
            service, _ = Service.objects.get_or_create(
                slug=slug,
                defaults={
                    "name_es": es,
                    "name_en": en,
                    "description_es": f"Servicio de {es.lower()} configurable por alcance y propiedad.",
                    "description_en": f"Configurable {en.lower()} service based on scope and property.",
                    "pricing_mode": mode,
                    "included_tasks": ["Evaluacion del alcance", "Checklist operativo", "Control de calidad"],
                    "exclusions": ["Materiales especiales no aprobados", "Trabajos de alto riesgo"],
                },
            )
            PriceVersion.objects.get_or_create(
                service=service,
                valid_from=timezone.localdate(),
                defaults={
                    "currency": "CRC",
                    "hourly_rate": price if mode == "hourly" else 0,
                    "fixed_price": price if mode != "hourly" else 0,
                    "minimum_fee": Decimal("25000"),
                },
            )
        NotificationTemplate.objects.get_or_create(
            key="quote-sent",
            channel=NotificationTemplate.Channel.EMAIL,
            defaults={
                "subject": "Cotizacion de Pacifica Cleaning",
                "body_es": "Hola {{ customer }}, adjuntamos su cotizacion. Valida hasta {{ valid_until }}.",
                "body_en": "Hello {{ customer }}, your quote is attached. Valid until {{ valid_until }}.",
            },
        )
        self.stdout.write(self.style.SUCCESS("Initial safe data seeded."))

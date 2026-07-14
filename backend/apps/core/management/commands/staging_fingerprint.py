import hashlib
import json

from django.apps import apps
from django.core.management.base import BaseCommand
from django.core.serializers.json import DjangoJSONEncoder


class Command(BaseCommand):
    help = "Prints deterministic model counts and a SHA-256 fingerprint for staging integrity checks."

    def handle(self, *args, **options):
        payload = {}
        counts = {}
        for model in sorted(apps.get_models(), key=lambda item: item._meta.label_lower):
            label = model._meta.label_lower
            rows = []
            for instance in model._default_manager.order_by(model._meta.pk.name):
                fields = {}
                for field in model._meta.concrete_fields:
                    value = field.value_from_object(instance)
                    fields[field.attname] = value
                rows.append(fields)
            counts[label] = len(rows)
            payload[label] = rows

        encoded = json.dumps(payload, cls=DjangoJSONEncoder, sort_keys=True, separators=(",", ":")).encode()
        result = {
            "counts": counts,
            "sha256": hashlib.sha256(encoded).hexdigest(),
        }
        self.stdout.write(json.dumps(result, sort_keys=True))

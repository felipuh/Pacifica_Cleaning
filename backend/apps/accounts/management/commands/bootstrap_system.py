from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = "Creates the initial super administrator safely."

    def add_arguments(self, parser):
        parser.add_argument("--email", required=True)
        parser.add_argument("--password", required=True)

    def handle(self, *args, **options):
        User = get_user_model()
        email = options["email"].lower()
        if User.objects.filter(email=email).exists():
            raise CommandError("User already exists.")
        user = User.objects.create_superuser(
            username=email,
            email=email,
            password=options["password"],
            role=User.Role.SUPERADMIN,
            force_password_change=True,
        )
        self.stdout.write(self.style.SUCCESS(f"Created super administrator {user.email}"))

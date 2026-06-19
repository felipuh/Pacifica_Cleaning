from celery import shared_task
from django.core.mail import send_mail
from django.utils import timezone

from .models import NotificationLog, NotificationTemplate


@shared_task(bind=True, max_retries=3)
def send_email_notification(self, template_key: str, recipient: str, context: dict, language: str = "es") -> str:
    template = NotificationTemplate.objects.get(key=template_key, channel=NotificationTemplate.Channel.EMAIL, active=True)
    body = template.body_en if language == "en" and template.body_en else template.body_es
    for key, value in context.items():
        body = body.replace("{{ " + key + " }}", str(value))
    log = NotificationLog.objects.create(template=template, channel=template.channel, recipient=recipient, payload=context)
    try:
        send_mail(template.subject, body, None, [recipient], fail_silently=False)
    except Exception as exc:
        log.status = "failed"
        log.error = str(exc)
        log.save(update_fields=["status", "error", "updated_at"])
        raise self.retry(exc=exc, countdown=60)
    log.status = "sent"
    log.sent_at = timezone.now()
    log.save(update_fields=["status", "sent_at", "updated_at"])
    return str(log.id)

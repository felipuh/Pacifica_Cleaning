import hashlib
import hmac

from django.conf import settings
from django.http import FileResponse, HttpResponseForbidden
from django.utils import timezone

from .models import PrivateAttachment


def private_file(request, pk):
    expires = request.GET.get("expires", "")
    token = request.GET.get("token", "")
    if not expires.isdigit() or int(expires) < int(timezone.now().timestamp()):
        return HttpResponseForbidden("Expired private file URL.")
    expected = hashlib.sha256(f"{pk}:{expires}:{settings.SECRET_KEY}".encode()).hexdigest()
    if not token or not hmac.compare_digest(token, expected):
        return HttpResponseForbidden("Invalid private file URL.")
    attachment = PrivateAttachment.objects.get(pk=pk)
    return FileResponse(attachment.file.open("rb"), content_type=attachment.mime_type)

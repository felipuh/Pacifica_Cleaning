from datetime import timedelta

import pyotp
from django.conf import settings
from django.contrib.auth import login, logout
from django.middleware.csrf import get_token
from django.urls import path
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle

from .models import LoginAttempt
from .serializers import LoginSerializer, MfaVerifySerializer, UserSerializer


class LoginThrottle(AnonRateThrottle):
    rate = "10/min"


def _client_ip(request) -> str | None:
    forwarded = request.META.get("HTTP_X_FORWARDED_FOR")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


def _is_locked(email: str) -> bool:
    since = timezone.now() - timedelta(minutes=settings.LOGIN_LOCKOUT_MINUTES)
    failures = LoginAttempt.objects.filter(email=email, successful=False, created_at__gte=since).count()
    return failures >= settings.LOGIN_LOCKOUT_ATTEMPTS


@api_view(["GET"])
@permission_classes([AllowAny])
def csrf(request):
    return Response({"csrfToken": get_token(request)})


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([LoginThrottle])
def login_view(request):
    email = request.data.get("email", "").strip().lower()
    if _is_locked(email):
        return Response({"detail": "Cuenta bloqueada temporalmente por intentos fallidos."}, status=429)
    serializer = LoginSerializer(data=request.data, context={"request": request})
    success = serializer.is_valid()
    LoginAttempt.objects.create(
        email=email,
        ip_address=_client_ip(request),
        user_agent=request.META.get("HTTP_USER_AGENT", ""),
        successful=success,
    )
    if not success:
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    user = serializer.validated_data["user"]
    if user.mfa_enabled:
        request.session["pre_mfa_user_id"] = str(user.pk)
        return Response({"mfaRequired": True})
    login(request, user)
    user.touch_last_seen()
    return Response(UserSerializer(user).data)


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([LoginThrottle])
def mfa_verify(request):
    serializer = MfaVerifySerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user_id = request.session.get("pre_mfa_user_id")
    if not user_id:
        return Response({"detail": "Sesion MFA no encontrada."}, status=400)
    from .models import User

    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        request.session.pop("pre_mfa_user_id", None)
        return Response({"detail": "Sesion MFA no encontrada."}, status=400)
    if not pyotp.TOTP(user.mfa_secret).verify(serializer.validated_data["code"], valid_window=1):
        return Response({"detail": "Codigo MFA invalido."}, status=400)
    login(request, user)
    request.session.pop("pre_mfa_user_id", None)
    user.touch_last_seen()
    return Response(UserSerializer(user).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_view(request):
    logout(request)
    return Response(status=204)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    return Response(UserSerializer(request.user).data)


auth_urls = [
    path("csrf/", csrf, name="csrf"),
    path("login/", login_view, name="login"),
    path("mfa/verify/", mfa_verify, name="mfa-verify"),
    path("logout/", logout_view, name="logout"),
    path("me/", me, name="me"),
]

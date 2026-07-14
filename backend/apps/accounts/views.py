from datetime import timedelta

import pyotp
from django.conf import settings
from django.contrib.auth import login, logout
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.middleware.csrf import get_token
from django.urls import path
from django.utils import timezone
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from drf_spectacular.utils import OpenApiResponse, extend_schema, inline_serializer
from rest_framework import serializers, status, viewsets
from rest_framework.decorators import action, api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle

from apps.core.permissions import ADMIN_ROLES, RoleActionPermission

from .models import LoginAttempt, User
from .serializers import (
    LoginSerializer,
    MfaVerifySerializer,
    PasswordChangeSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    UserManagementSerializer,
    UserSerializer,
)


class LoginThrottle(AnonRateThrottle):
    scope = "authentication"
    rate = "10/min"


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by("first_name", "last_name", "email")
    serializer_class = UserManagementSerializer
    permission_classes = [RoleActionPermission]
    action_roles = {name: ADMIN_ROLES for name in ("list", "retrieve", "create", "update", "partial_update", "destroy")}
    action_roles["eligible_lead_assignees"] = {"superadmin", "managing_partner", "operations", "sales"}

    @action(detail=False, methods=["get"], url_path="eligible-lead-assignees")
    def eligible_lead_assignees(self, request):
        eligible = self.get_queryset().filter(
            is_active=True,
            role__in=(User.Role.SUPERADMIN, User.Role.MANAGING_PARTNER, User.Role.OPERATIONS, User.Role.SALES),
        )
        return Response(UserSerializer(eligible, many=True).data)


def _client_ip(request) -> str | None:
    forwarded = request.META.get("HTTP_X_FORWARDED_FOR")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


def _is_locked(email: str) -> bool:
    since = timezone.now() - timedelta(minutes=settings.LOGIN_LOCKOUT_MINUTES)
    failures = LoginAttempt.objects.filter(email=email, successful=False, created_at__gte=since).count()
    return failures >= settings.LOGIN_LOCKOUT_ATTEMPTS


@extend_schema(
    responses=inline_serializer(
        name="CsrfTokenResponse",
        fields={"csrfToken": serializers.CharField()},
    )
)
@api_view(["GET"])
@permission_classes([AllowAny])
def csrf(request):
    return Response({"csrfToken": get_token(request)})


@extend_schema(
    request=LoginSerializer,
    responses={
        200: UserSerializer,
        400: OpenApiResponse(description="Credenciales invalidas."),
        429: OpenApiResponse(description="Cuenta bloqueada temporalmente."),
    },
)
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


@extend_schema(
    request=MfaVerifySerializer,
    responses={
        200: UserSerializer,
        400: OpenApiResponse(description="Codigo MFA invalido o sesion no encontrada."),
    },
)
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


@extend_schema(request=None, responses={204: OpenApiResponse(description="Sesion cerrada.")})
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_view(request):
    logout(request)
    return Response(status=204)


@extend_schema(responses=UserSerializer)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    return Response(UserSerializer(request.user).data)


@extend_schema(request=PasswordResetRequestSerializer, responses={200: OpenApiResponse(description="Respuesta genérica de recuperación.")})
@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([LoginThrottle])
def password_reset_request(request):
    serializer = PasswordResetRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    from .models import User

    user = User.objects.filter(email__iexact=serializer.validated_data["email"], is_active=True).first()
    if user and user.has_usable_password():
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        frontend_origin = settings.FRONTEND_ORIGIN.rstrip("/")
        reset_url = f"{frontend_origin}/reset-password?uid={uid}&token={token}"
        send_mail(
            "Restablecer contraseña de Pacífica Cleaning",
            f"Use este enlace para restablecer su contraseña: {reset_url}",
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False,
        )
    return Response({"detail": "Si la cuenta existe, recibirá instrucciones para restablecer la contraseña."})


@extend_schema(request=PasswordResetConfirmSerializer, responses={200: OpenApiResponse(description="Contraseña actualizada.")})
@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([LoginThrottle])
def password_reset_confirm(request):
    serializer = PasswordResetConfirmSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    from .models import User

    try:
        user_id = force_str(urlsafe_base64_decode(serializer.validated_data["uid"]))
        user = User.objects.get(pk=user_id, is_active=True)
    except (ValueError, TypeError, OverflowError, User.DoesNotExist):
        return Response({"detail": "El enlace no es válido o expiró."}, status=400)
    if not default_token_generator.check_token(user, serializer.validated_data["token"]):
        return Response({"detail": "El enlace no es válido o expiró."}, status=400)
    password = PasswordResetConfirmSerializer(
        data=request.data,
        context={"user": user},
    )
    password.is_valid(raise_exception=True)
    user.set_password(password.validated_data["password"])
    user.force_password_change = False
    user.save(update_fields=["password", "force_password_change"])
    return Response({"detail": "Contraseña actualizada."})


@extend_schema(request=PasswordChangeSerializer, responses={200: OpenApiResponse(description="Contraseña actualizada.")})
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def password_change(request):
    serializer = PasswordChangeSerializer(data=request.data, context={"user": request.user})
    serializer.is_valid(raise_exception=True)
    request.user.set_password(serializer.validated_data["password"])
    request.user.force_password_change = False
    request.user.save(update_fields=["password", "force_password_change"])
    login(request, request.user)
    return Response({"detail": "Contraseña actualizada."})


auth_urls = [
    path("csrf/", csrf, name="csrf"),
    path("login/", login_view, name="login"),
    path("mfa/verify/", mfa_verify, name="mfa-verify"),
    path("logout/", logout_view, name="logout"),
    path("me/", me, name="me"),
    path("password/reset/request/", password_reset_request, name="password-reset-request"),
    path("password/reset/confirm/", password_reset_confirm, name="password-reset-confirm"),
    path("password/change/", password_change, name="password-change"),
]

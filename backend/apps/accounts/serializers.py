from django.contrib.auth import authenticate, password_validation
from rest_framework import serializers

from .models import User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "email", "username", "first_name", "last_name", "role", "phone", "mfa_enabled", "last_seen_at")
        read_only_fields = ("id", "role", "mfa_enabled", "last_seen_at")


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate(self, attrs):
        user = authenticate(
            self.context["request"],
            username=attrs["email"],
            password=attrs["password"],
        )
        if user is None:
            raise serializers.ValidationError("Credenciales invalidas.")
        if not user.is_active:
            raise serializers.ValidationError("Usuario inactivo.")
        attrs["user"] = user
        return attrs


class MfaVerifySerializer(serializers.Serializer):
    code = serializers.CharField(min_length=6, max_length=8)


class PasswordSerializer(serializers.Serializer):
    password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate_password(self, value):
        password_validation.validate_password(value, self.context.get("user"))
        return value


class PasswordChangeSerializer(PasswordSerializer):
    current_password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate_current_password(self, value):
        if not self.context["user"].check_password(value):
            raise serializers.ValidationError("La contraseña actual no es válida.")
        return value


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(PasswordSerializer):
    uid = serializers.CharField()
    token = serializers.CharField()

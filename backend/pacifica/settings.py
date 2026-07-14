from pathlib import Path

import environ

BASE_DIR = Path(__file__).resolve().parent.parent

env = environ.Env(DJANGO_ENV=(str, "local"))
environ.Env.read_env(BASE_DIR.parent / ".env")

APP_ENV = env("DJANGO_ENV", default=env("ENVIRONMENT", default="local")).lower()
IS_PRODUCTION = APP_ENV == "production"

SECRET_KEY = env("DJANGO_SECRET_KEY", default="unsafe-local-development-key-change-me")
DEBUG = env.bool("DJANGO_DEBUG", default=not IS_PRODUCTION)
ENVIRONMENT = env("ENVIRONMENT", default="local")

if IS_PRODUCTION and SECRET_KEY == "unsafe-local-development-key-change-me":
    raise RuntimeError("DJANGO_SECRET_KEY must be set when DJANGO_ENV=production")

default_hosts = [] if IS_PRODUCTION else [
    "localhost",
    "127.0.0.1",
    "192.168.56.10",
    "pacifica-cleaning.local",
    "pacifica-cleaning.test",
    "www.pacifica-cleaning.test",
    "testserver",
]
ALLOWED_HOSTS = env.list("DJANGO_ALLOWED_HOSTS", default=default_hosts)
if IS_PRODUCTION and not ALLOWED_HOSTS:
    raise RuntimeError("DJANGO_ALLOWED_HOSTS must be set when DJANGO_ENV=production")
# Exact development origins only. Production starts empty and must provide
# DJANGO_CSRF_TRUSTED_ORIGINS explicitly; wildcard origins are never added.
DEVELOPMENT_CSRF_TRUSTED_ORIGINS = [
    "http://localhost:8001",
    "http://127.0.0.1:8001",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://192.168.56.10:8001",
    "http://pacifica-cleaning.test",
    "http://www.pacifica-cleaning.test",
]
default_csrf_origins = [] if IS_PRODUCTION else DEVELOPMENT_CSRF_TRUSTED_ORIGINS
CSRF_TRUSTED_ORIGINS = env.list("DJANGO_CSRF_TRUSTED_ORIGINS", default=default_csrf_origins)
CORS_ALLOWED_ORIGINS = env.list("CORS_ALLOWED_ORIGINS", default=[env("FRONTEND_ORIGIN", default="http://localhost:8001")])
CORS_ALLOW_CREDENTIALS = True

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "corsheaders",
    "rest_framework",
    "drf_spectacular",
    "apps.public_site",
    "apps.accounts",
    "apps.core",
    "apps.crm",
    "apps.services",
    "apps.operations",
    "apps.people",
    "apps.finance",
    "apps.inventory",
    "apps.marketing",
    "apps.notifications",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.locale.LocaleMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "csp.middleware.CSPMiddleware",
]

ROOT_URLCONF = "pacifica.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "pacifica.wsgi.application"

DATABASES = {
    "default": env.db(
        "DATABASE_URL",
        default="postgres://pacifica:pacifica_dev_password@localhost:5432/pacifica",
    )
}

AUTH_USER_MODEL = "accounts.User"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator", "OPTIONS": {"min_length": 12}},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "es-cr"
LANGUAGES = [("es", "Espanol"), ("en", "English")]
TIME_ZONE = "America/Costa_Rica"
USE_I18N = True
USE_TZ = True

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_DIRS = [BASE_DIR / "static"]
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.SessionAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 25,
    "DEFAULT_THROTTLE_RATES": {
        "anon": "100/hour",
    },
}

SPECTACULAR_SETTINGS = {
    "TITLE": "Pacifica Cleaning API",
    "DESCRIPTION": "API operativa para Pacifica Cleaning.",
    "VERSION": "0.1.0",
}

SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax"
CSRF_COOKIE_SAMESITE = "Lax"
SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG
SECURE_SSL_REDIRECT = env("DJANGO_SECURE_SSL_REDIRECT", default=IS_PRODUCTION)
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_HSTS_SECONDS = 31536000 if not DEBUG else 0
SECURE_HSTS_INCLUDE_SUBDOMAINS = not DEBUG
SECURE_HSTS_PRELOAD = not DEBUG
SECURE_REFERRER_POLICY = "same-origin"
X_FRAME_OPTIONS = "DENY"

# CSP compatible con Django 5 via django-csp
CSP_DEFAULT_SRC = ("'self'",)
CSP_SCRIPT_SRC = ("'self'",)
CSP_STYLE_SRC = ("'self'", "'unsafe-inline'")
CSP_IMG_SRC = ("'self'", "data:", "https:")
CSP_FONT_SRC = ("'self'",)
CSP_CONNECT_SRC = ("'self'",)
CSP_FRAME_ANCESTORS = ("'none'",)

FILE_UPLOAD_MAX_MEMORY_SIZE = 5 * 1024 * 1024
DATA_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024
ALLOWED_UPLOAD_MIME_TYPES = {
    "application/pdf",
    "image/jpeg",
    "image/png",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
}

CELERY_BROKER_URL = env("CELERY_BROKER_URL", default=env("REDIS_URL", default="redis://localhost:6379/1"))
CELERY_RESULT_BACKEND = env("CELERY_RESULT_BACKEND", default="redis://localhost:6379/2")
CELERY_TASK_ALWAYS_EAGER = env.bool("CELERY_TASK_ALWAYS_EAGER", default=False)

EMAIL_HOST = env("EMAIL_HOST", default="localhost")
EMAIL_PORT = env.int("EMAIL_PORT", default=1025)
EMAIL_BACKEND = env(
    "EMAIL_BACKEND",
    default="django.core.mail.backends.smtp.EmailBackend" if IS_PRODUCTION else "django.core.mail.backends.console.EmailBackend",
)
EMAIL_USE_TLS = env.bool("EMAIL_USE_TLS", default=IS_PRODUCTION)
EMAIL_HOST_USER = env("EMAIL_HOST_USER", default="")
EMAIL_HOST_PASSWORD = env("EMAIL_HOST_PASSWORD", default="")
DEFAULT_FROM_EMAIL = env("DEFAULT_FROM_EMAIL", default="no-reply@pacificacleaning.cr")
ADMIN_EMAIL = env("ADMIN_EMAIL", default="admin@pacificacleaning.cr")
FRONTEND_ORIGIN = env("FRONTEND_ORIGIN", default="http://localhost:5174")

LOGIN_LOCKOUT_ATTEMPTS = 5
LOGIN_LOCKOUT_MINUTES = 15

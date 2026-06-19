from .models import AuditLog


def log_action(request, action: str, entity, metadata: dict | None = None) -> None:
    user = getattr(request, "user", None)
    AuditLog.objects.create(
        actor=user if getattr(user, "is_authenticated", False) else None,
        action=action,
        entity_type=entity.__class__.__name__,
        entity_id=str(getattr(entity, "pk", "")),
        ip_address=request.META.get("REMOTE_ADDR"),
        metadata=metadata or {},
    )

from rest_framework.permissions import BasePermission


ADMIN_ROLES = {"superadmin", "managing_partner"}
OPERATIONS_ROLES = ADMIN_ROLES | {"operations"}
SALES_ROLES = ADMIN_ROLES | {"sales", "operations"}
FINANCE_ROLES = ADMIN_ROLES | {"finance"}
QUALITY_ROLES = ADMIN_ROLES | {"quality", "operations"}
READ_ONLY_ROLES = ADMIN_ROLES | {"operations", "sales", "finance", "quality", "auditor"}
SENSITIVE_ACCESS_ROLES = ADMIN_ROLES | {"operations", "quality"}


class IsRole(BasePermission):
    allowed_roles: set[str] = set()

    def has_permission(self, request, view) -> bool:
        return bool(request.user and request.user.is_authenticated and request.user.role in self.allowed_roles)


def role_permission(*roles: str):
    return type("RolePermission", (IsRole,), {"allowed_roles": set(roles)})


class RoleActionPermission(BasePermission):
    """
    Map viewset actions to role sets. Unmapped actions fall back to authenticated read-only access.
    """

    action_roles: dict[str, set[str]] = {}

    def has_permission(self, request, view) -> bool:
        if not request.user or not request.user.is_authenticated:
            return False
        roles = getattr(view, "action_roles", {}).get(getattr(view, "action", ""), READ_ONLY_ROLES)
        return request.user.role in roles

from django.core.exceptions import ValidationError
from django.db import transaction
from rest_framework import decorators, response, serializers, status, viewsets

from apps.core.permissions import ADMIN_ROLES, OPERATIONS_ROLES, QUALITY_ROLES, READ_ONLY_ROLES, STAFF_ROLES, RoleActionPermission
from apps.people.models import WorkerProfile
from .models import Assignment, WorkOrder, WorkOrderStatusHistory
from .serializers import WorkOrderSerializer


class WorkOrderViewSet(viewsets.ModelViewSet):
    queryset = WorkOrder.objects.select_related("customer", "property", "quote").prefetch_related("assignments").all()
    serializer_class = WorkOrderSerializer
    permission_classes = [RoleActionPermission]
    action_roles = {
        "list": READ_ONLY_ROLES | STAFF_ROLES,
        "retrieve": READ_ONLY_ROLES | STAFF_ROLES,
        "create": OPERATIONS_ROLES,
        "update": OPERATIONS_ROLES | QUALITY_ROLES,
        "partial_update": OPERATIONS_ROLES | QUALITY_ROLES,
        "destroy": ADMIN_ROLES,
        "transition": OPERATIONS_ROLES | QUALITY_ROLES,
        "reschedule": OPERATIONS_ROLES,
        "assign": OPERATIONS_ROLES,
    }

    def get_queryset(self):
        queryset = super().get_queryset().order_by("scheduled_start")
        if self.request.user.role == "staff":
            queryset = queryset.filter(assignments__worker__user=self.request.user)
        selected_status = self.request.query_params.get("status")
        worker = self.request.query_params.get("worker")
        date_from = self.request.query_params.get("date_from")
        date_to = self.request.query_params.get("date_to")
        if selected_status:
            queryset = queryset.filter(status=selected_status)
        if worker:
            queryset = queryset.filter(assignments__worker_id=worker)
        if date_from:
            queryset = queryset.filter(scheduled_start__date__gte=date_from)
        if date_to:
            queryset = queryset.filter(scheduled_start__date__lte=date_to)
        return queryset.distinct()

    @decorators.action(detail=True, methods=["post"])
    def transition(self, request, pk=None):
        work_order = self.get_object()
        target = request.data.get("status", "")
        previous = work_order.status
        try:
            work_order.transition(target)
            work_order.full_clean()
        except ValidationError as error:
            raise serializers.ValidationError(error.messages) from error
        if target == WorkOrder.Status.CANCELLED:
            work_order.cancellation_reason = request.data.get("reason", "")
        work_order.save()
        WorkOrderStatusHistory.objects.create(work_order=work_order, from_status=previous, to_status=target, notes=request.data.get("notes", ""), changed_by=request.user)
        return response.Response(self.get_serializer(work_order).data)

    @decorators.action(detail=True, methods=["post"])
    def reschedule(self, request, pk=None):
        with transaction.atomic():
            work_order = WorkOrder.objects.select_for_update().get(pk=self.get_object().pk)
            if work_order.status in {WorkOrder.Status.COMPLETED, WorkOrder.Status.CANCELLED}:
                raise serializers.ValidationError("No se puede reprogramar un servicio finalizado o cancelado.")
            expected = request.data.get("expected_updated_at")
            if expected and expected != work_order.updated_at.isoformat().replace("+00:00", "Z"):
                return response.Response({"detail": "El servicio cambió; recargue antes de reprogramar."}, status=status.HTTP_409_CONFLICT)
            serializer = self.get_serializer(work_order, data={"scheduled_start": request.data.get("scheduled_start"), "scheduled_end": request.data.get("scheduled_end")}, partial=True)
            serializer.is_valid(raise_exception=True)
            start, end = serializer.validated_data["scheduled_start"], serializer.validated_data["scheduled_end"]
            worker_ids = work_order.assignments.values_list("worker_id", flat=True)
            conflict = WorkOrder.objects.filter(assignments__worker_id__in=worker_ids, scheduled_start__lt=end, scheduled_end__gt=start).exclude(pk=work_order.pk).exists()
            if conflict:
                return response.Response({"detail": "El personal asignado tiene un conflicto de agenda."}, status=status.HTTP_409_CONFLICT)
            serializer.save()
            WorkOrderStatusHistory.objects.create(
                work_order=work_order, from_status=work_order.status, to_status=work_order.status,
                notes=f"Reprogramado. Motivo: {request.data.get('reason', '').strip() or 'No indicado'}", changed_by=request.user,
            )
        return response.Response(serializer.data)

    @decorators.action(detail=True, methods=["post"])
    def assign(self, request, pk=None):
        worker_ids = request.data.get("worker_ids")
        if not isinstance(worker_ids, list) or len(worker_ids) != len(set(worker_ids)):
            raise serializers.ValidationError({"worker_ids": "Indique una lista de personal sin duplicados."})
        with transaction.atomic():
            work_order = WorkOrder.objects.select_for_update().get(pk=self.get_object().pk)
            workers = list(WorkerProfile.objects.filter(pk__in=worker_ids, status=WorkerProfile.Status.ACTIVE))
            if len(workers) != len(worker_ids):
                raise serializers.ValidationError({"worker_ids": "Todo el personal debe existir y estar activo."})
            candidates = [Assignment(work_order=work_order, worker=worker) for worker in workers]
            for assignment in candidates:
                try:
                    assignment.full_clean()
                except ValidationError as error:
                    return response.Response({"detail": error.messages[0]}, status=status.HTTP_409_CONFLICT)
            previous = list(work_order.assignments.values_list("worker__full_name", flat=True))
            work_order.assignments.all().delete()
            Assignment.objects.bulk_create(candidates)
            names = ", ".join(worker.full_name for worker in workers) or "Sin personal"
            WorkOrderStatusHistory.objects.create(
                work_order=work_order, from_status=work_order.status, to_status=work_order.status,
                notes=f"Asignación actualizada: {', '.join(previous) or 'Sin personal'} → {names}.", changed_by=request.user,
            )
        return response.Response(self.get_serializer(work_order).data)

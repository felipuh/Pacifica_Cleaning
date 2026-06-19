from celery import shared_task


@shared_task
def quote_follow_up(quote_id: str) -> str:
    return f"follow-up-scheduled:{quote_id}"

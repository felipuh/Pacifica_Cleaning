def shared_task(func=None, **_kwargs):
    if func is None:
        return lambda wrapped: wrapped
    return func

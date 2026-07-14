PYTHON ?= python3.12
VENV ?= backend/.venv
HOST ?= 0.0.0.0
PORT ?= 8001
PIP := $(VENV)/bin/pip
DJANGO := cd backend && . .venv/bin/activate && python manage.py

.PHONY: python-check venv install install-async migrate seed admin run test check deploy-check collectstatic

python-check:
	$(PYTHON) -c "import sys; assert sys.version_info[:2] == (3, 12), sys.version"

venv: python-check
	$(PYTHON) -m venv $(VENV)

install: venv
	$(PIP) install --upgrade pip
	$(PIP) install -r backend/requirements-dev.txt

install-async: venv
	$(PIP) install -r backend/requirements-async.txt

migrate:
	$(DJANGO) migrate

seed:
	$(DJANGO) seed_initial_data

admin:
	$(DJANGO) bootstrap_system --email admin@pacifica.local --password "Cambiar-Esto-123!"

run:
	$(DJANGO) runserver $(HOST):$(PORT)

test:
	cd backend && . .venv/bin/activate && DATABASE_URL=sqlite:///:memory: python manage.py test tests

check:
	$(DJANGO) check

deploy-check:
	$(DJANGO) check --deploy

collectstatic:
	$(DJANGO) collectstatic --noinput

FROM python:3.12-slim

# Set workdir to the repository root inside the container
WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Install system dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential gcc libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python deps
COPY config/requirements.txt /app/config/requirements.txt
RUN python -m pip install --upgrade pip setuptools wheel
RUN pip install -r /app/config/requirements.txt || true

# Copy project files
COPY . /app

ENV PATH="/app/env/Scripts:$PATH"

EXPOSE 8000

# Default command: run migrations then Django development server
CMD ["/bin/sh", "-c", "python config/manage.py migrate --noinput || true && python config/manage.py runserver 0.0.0.0:8000"]

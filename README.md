# HackathonPortal

This repository contains the HackathonPortal Django backend and a React frontend.

## Running with Docker

I added Dockerfiles and a docker-compose configuration to run the backend and frontend in containers.

Quick start (build & run):

```bash
docker-compose build
docker-compose up -d
```

- Backend will be available at: http://localhost:8000
- Frontend will be available at: http://localhost:3000 (served by nginx)

Notes:
- The backend Dockerfile uses the repository's `config/requirements.txt`. Make sure it's up to date.
- The project currently uses SQLite by default. The `docker-compose.yml` includes a commented Postgres service you may enable and configure if you prefer Postgres.

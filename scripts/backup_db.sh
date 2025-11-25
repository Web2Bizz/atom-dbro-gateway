#!/usr/bin/env bash
set -euo pipefail

# ===== Config (can be overridden via env) =====
PROJECT_NAME=${PROJECT_NAME:-atom-release}
POSTGRES_USER=${POSTGRES_USER:-postgres}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-postgres}
POSTGRES_DB=${POSTGRES_DB:-atom_dbro}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="${SCRIPT_DIR}/.."
BACKUP_DIR="${BACKUP_DIR:-${REPO_ROOT}/backups}"

mkdir -p "${BACKUP_DIR}"

cd "${REPO_ROOT}"

# ===== Find running Postgres container by service name =====
POSTGRES_CONTAINER_ID="$(docker compose -p "${PROJECT_NAME}" -f infrastructure.yml ps -q postgres || true)"

if [[ -z "${POSTGRES_CONTAINER_ID}" ]]; then
  echo "Postgres container for project '${PROJECT_NAME}' not found or not running (service name: postgres)." >&2
  echo "Make sure infrastructure is up, e.g. run: ./scripts/up_infrastructure.sh" >&2
  exit 1
fi

TIMESTAMP="$(date +'%Y%m%d_%H%M%S')"
BACKUP_FILE="${BACKUP_DIR}/${POSTGRES_DB}_${TIMESTAMP}.sql.gz"

echo "Creating PostgreSQL backup..."
echo "  Project:   ${PROJECT_NAME}"
echo "  Database:  ${POSTGRES_DB}"
echo "  User:      ${POSTGRES_USER}"
echo "  Container: ${POSTGRES_CONTAINER_ID}"
echo "  Target:    ${BACKUP_FILE}"

# Run pg_dump inside the container and stream compressed dump to host
docker exec -e PGPASSWORD="${POSTGRES_PASSWORD}" "${POSTGRES_CONTAINER_ID}" \
  pg_dump -U "${POSTGRES_USER}" "${POSTGRES_DB}" | gzip > "${BACKUP_FILE}"

echo "Backup completed successfully."
echo "File saved at: ${BACKUP_FILE}"



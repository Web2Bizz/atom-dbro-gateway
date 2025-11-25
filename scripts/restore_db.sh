#!/usr/bin/env bash
set -euo pipefail

# ===== Config (can be overridden via env) =====
PROJECT_NAME=${PROJECT_NAME:-atom-release}
POSTGRES_USER=${POSTGRES_USER:-postgres}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-postgres}
POSTGRES_DB=${POSTGRES_DB:-atom_dbro}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="${SCRIPT_DIR}/.."

cd "${REPO_ROOT}"

BACKUP_FILE="${1:-}"

if [[ -z "${BACKUP_FILE}" ]]; then
  echo "Usage: $0 /path/to/backup.sql[.gz]" >&2
  exit 1
fi

if [[ ! -f "${BACKUP_FILE}" ]]; then
  echo "Backup file not found: ${BACKUP_FILE}" >&2
  exit 1
fi

POSTGRES_CONTAINER_ID="$(docker compose -p "${PROJECT_NAME}" -f infrastructure.yml ps -q postgres || true)"

if [[ -z "${POSTGRES_CONTAINER_ID}" ]]; then
  echo "Postgres container for project '${PROJECT_NAME}' not found or not running (service name: postgres)." >&2
  echo "Make sure infrastructure is up, e.g. run: ./scripts/up_infrastructure.sh" >&2
  exit 1
fi

echo "Restoring PostgreSQL database from backup..."
echo "  Project:   ${PROJECT_NAME}"
echo "  Database:  ${POSTGRES_DB}"
echo "  User:      ${POSTGRES_USER}"
echo "  Container: ${POSTGRES_CONTAINER_ID}"
echo "  Backup:    ${BACKUP_FILE}"

if [[ "${BACKUP_FILE}" == *.gz ]]; then
  DECOMPRESS_CMD=(gunzip -c)
else
  DECOMPRESS_CMD=(cat)
fi

# WARNING: This will overwrite data in the target database.
printf 'This operation will apply SQL from "%s" into database "%s".\n' "${BACKUP_FILE}" "${POSTGRES_DB}"

"${DECOMPRESS_CMD[@]}" "${BACKUP_FILE}" | docker exec -i -e PGPASSWORD="${POSTGRES_PASSWORD}" \
  "${POSTGRES_CONTAINER_ID}" psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}"

echo "Restore completed successfully."



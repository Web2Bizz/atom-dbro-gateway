#!/usr/bin/env bash
set -euo pipefail

PROJECT_NAME=${PROJECT_NAME:-atom-release}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="${SCRIPT_DIR}/.."

cd "${REPO_ROOT}"

docker compose -p "${PROJECT_NAME}" -f infrastructure.yml up -d --build "$@"


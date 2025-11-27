#!/bin/bash

# Скрипт для запуска k6 с экспортом метрик в Prometheus
# Использование:
#   ./prometheus-export.sh public-api
#   ./prometheus-export.sh admin-api
#   PROMETHEUS_URL=http://localhost:9090/api/v1/write ./prometheus-export.sh public-api

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEST_TYPE="${1:-public-api}"

if [ "$TEST_TYPE" != "public-api" ] && [ "$TEST_TYPE" != "admin-api" ]; then
  echo "Использование: $0 [public-api|admin-api]"
  exit 1
fi

# URL Prometheus Remote Write endpoint
# По умолчанию используем локальный Prometheus из docker-compose
PROMETHEUS_URL="${PROMETHEUS_URL:-http://localhost:9090/api/v1/write}"

# Определяем тестовый файл
TEST_FILE="$SCRIPT_DIR/${TEST_TYPE}.load.test.js"

if [ ! -f "$TEST_FILE" ]; then
  echo "Ошибка: файл $TEST_FILE не найден"
  exit 1
fi

echo "🚀 Запуск нагрузочного теста: $TEST_TYPE"
echo "📊 Экспорт метрик в Prometheus: $PROMETHEUS_URL"
echo ""
echo "⚠️  Убедитесь, что Prometheus запущен и доступен по указанному адресу"
echo ""

# Запускаем k6 с экспортом в Prometheus Remote Write
K6_PROMETHEUS_RW_SERVER_URL="$PROMETHEUS_URL" \
K6_PROMETHEUS_RW_TREND_STATS="p(90),p(95),p(99),avg,min,max" \
K6_PROMETHEUS_RW_PUSH_INTERVAL="10s" \
  k6 run --out prometheus-rw "$TEST_FILE"

echo ""
echo "✅ Тест завершен. Метрики экспортированы в Prometheus."
echo ""
echo "Для просмотра метрик в Grafana:"
echo "  1. Откройте Grafana (обычно http://localhost:3000)"
echo "  2. Создайте дашборд с запросами к Prometheus"
echo "  3. Используйте метрики:"
echo "     - k6_http_req_duration (время ответа)"
echo "     - k6_http_req_failed (процент ошибок)"
echo "     - k6_http_reqs (количество запросов)"
echo "     - k6_vus (виртуальные пользователи)"


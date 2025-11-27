#!/bin/bash

# Скрипт для запуска нагрузочного теста с сохранением результатов
# Использование:
#   ./run-test.sh public-api
#   ./run-test.sh admin-api
#   ./run-test.sh public-api --out json=results/public-api-$(date +%Y%m%d-%H%M%S).json

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEST_TYPE="${1:-public-api}"

if [ "$TEST_TYPE" != "public-api" ] && [ "$TEST_TYPE" != "admin-api" ]; then
  echo "Использование: $0 [public-api|admin-api] [дополнительные опции k6]"
  exit 1
fi

# Создаем директорию для результатов
RESULTS_DIR="$SCRIPT_DIR/results"
mkdir -p "$RESULTS_DIR"

# Генерируем имя файла с timestamp
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
OUTPUT_FILE="$RESULTS_DIR/${TEST_TYPE}-${TIMESTAMP}.json"

# Определяем тестовый файл
TEST_FILE="$SCRIPT_DIR/${TEST_TYPE}.load.test.js"

if [ ! -f "$TEST_FILE" ]; then
  echo "Ошибка: файл $TEST_FILE не найден"
  exit 1
fi

echo "🚀 Запуск нагрузочного теста: $TEST_TYPE"
echo "📁 Результаты будут сохранены в: $OUTPUT_FILE"

# Проверяем и выводим информацию о переменных окружения для admin-api
if [ "$TEST_TYPE" = "admin-api" ]; then
  if [ -z "$ADMIN_TOKEN" ]; then
    echo "⚠️  ВНИМАНИЕ: ADMIN_TOKEN не установлен. Большинство запросов вернут 401/403."
    echo "   Установите токен: export ADMIN_TOKEN='your-token'"
  else
    echo "✅ ADMIN_TOKEN установлен"
  fi
  if [ -n "$ADMIN_BASE_URL" ]; then
    echo "✅ ADMIN_BASE_URL: $ADMIN_BASE_URL"
  fi
fi
echo ""

# Запускаем k6 с сохранением в JSON
# Передаем все дополнительные аргументы после первого (если есть)
# Переменные окружения (ADMIN_TOKEN, ADMIN_BASE_URL, BASE_URL) передаются автоматически
if [ $# -gt 1 ]; then
  shift
  k6 run "$TEST_FILE" --out json="$OUTPUT_FILE" "$@"
else
  k6 run "$TEST_FILE" --out json="$OUTPUT_FILE"
fi

echo ""
echo "✅ Тест завершен. Результаты сохранены в: $OUTPUT_FILE"
echo ""
echo "Для сравнения результатов используйте:"
echo "  node compare-results.js <baseline.json> <current.json>"


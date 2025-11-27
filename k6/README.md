## Нагрузочное тестирование через Grafana k6

В этой директории находятся k6‑сценарии для нагрузочного тестирования публичного и админского API сервиса, описанного openapi‑спецификациями:

- Публичное API: `https://it-hackathon-team05.mephi.ru/api-json`
- Админское API: `https://it-hackathon-team05.mephi.ru/admin/api-json`

### Структура

- `public-api.load.test.js` — сценарий чтения основных публичных эндпоинтов:
  - метрики `/api/v1/metrics`
  - регионы и города `/api/v1/regions`, `/api/v1/regions/{id}/cities`, `/api/v1/cities`
  - пользователи `/api/v1/users`, `/api/v1/users/{id}`
  - типы и список организаций `/api/v1/organization-types`, `/api/v1/organizations`
  - квесты и категории `/api/v1/quests`, `/api/v1/quests/{id}`, `/api/v1/categories`

- `admin-api.load.test.js` — базовый сценарий для админского API:
  - список регионов, пользователей, организаций, квестов
  - выборка сущностей по ID

### Установка k6 (локально)

1. Скачайте и установите k6 по инструкции с сайта Grafana:
   - Linux/macOS/Windows — через пакетный менеджер или бинарник `k6` (`https://grafana.com/docs/k6/latest/get-started/installation/`).
2. Убедитесь, что k6 доступен в PATH:

```bash
k6 version
```

### Запуск сценариев

#### Публичное API

```bash
cd k6

# Базовый случай (по умолчанию BASE_URL = https://it-hackathon-team05.mephi.ru)
k6 run public-api.load.test.js

# Явное указание BASE_URL
BASE_URL=https://it-hackathon-team05.mephi.ru k6 run public-api.load.test.js
```

#### Админское API

```bash
cd k6

# Способ 1: Использование скрипта run-test.sh (рекомендуется)
ADMIN_TOKEN="ВАШ_JWT_ИЛИ_ДРУГОЙ_ТОКЕН" ./run-test.sh admin-api

# Способ 2: С дополнительными опциями k6
ADMIN_TOKEN="ВАШ_JWT_ИЛИ_ДРУГОЙ_ТОКЕН" ./run-test.sh admin-api --duration 30s --vus 10

# Способ 3: Прямой запуск k6
ADMIN_BASE_URL=https://it-hackathon-team05.mephi.ru/admin \
ADMIN_TOKEN="ВАШ_JWT_ИЛИ_ДРУГОЙ_ТОКЕН" \
  k6 run admin-api.load.test.js
```

**Важно:** При использовании скрипта `run-test.sh` переменные окружения передаются автоматически. Не используйте `&&` для установки переменных - используйте синтаксис выше.

Без `ADMIN_TOKEN` большинство защищённых эндпоинтов будут возвращать `401/403`, но это всё равно создаёт нагрузку на авторизационный слой.

### Подключение к Grafana

#### Вариант 1. Grafana Cloud / k6 Cloud

1. Зарегистрируйтесь в Grafana Cloud и получите `K6_CLOUD_PROJECT_ID` и `K6_CLOUD_TOKEN`.
2. Запустите тест:

```bash
K6_CLOUD_TOKEN=... \
  k6 cloud public-api.load.test.js
```

Результаты и графики появятся в Grafana Cloud.

#### Вариант 2. Свой стек (Prometheus + Grafana)

1. Поднимите Prometheus и Grafana (например, через docker‑compose, см. корневой проект).
2. Запустите k6 с выводом в Prometheus Remote Write:

```bash
K6_PROMETHEUS_RW_SERVER_URL=http://prometheus:9090/api/v1/write \
K6_PROMETHEUS_RW_TREND_STATS="p(90),p(95),p(99),avg" \
  k6 run --out prometheus-rw public-api.load.test.js
```

3. В Grafana подключите Prometheus как datasource и используйте готовый k6 dashboard или создайте свой.

### Настройка профиля нагрузки

Параметры нагрузки задаются в `options.scenarios` в каждом скрипте:

- `ramping-vus` — постепенное увеличение/уменьшение числа виртуальных пользователей.
- `stages` — этапы нагрузки (длительность и целевое количество VU).

Пример изменения профиля:

```js
export const options = {
  scenarios: {
    ramping_read_only: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 50 },
        { duration: '5m', target: 50 },
        { duration: '2m', target: 0 },
      ],
    },
  },
};
```

Также определены `thresholds` (SLA по времени ответа и ошибкам). При нарушении порогов k6 завершает выполнение с ненулевым кодом, что удобно для CI/CD.

#### Настройка порогов (thresholds)

Пороги можно настраивать через переменные окружения:

```bash
# Увеличить допустимый процент ошибок до 5%
FAILED_RATE_THRESHOLD=0.05 ./run-test.sh public-api

# Увеличить допустимое время ответа p95 до 2000ms
DURATION_P95_THRESHOLD=2000 ./run-test.sh public-api

# Отключить все пороги (для отладки)
DISABLE_THRESHOLDS=true ./run-test.sh admin-api

# Комбинация настроек
FAILED_RATE_THRESHOLD=0.1 DURATION_P95_THRESHOLD=1500 ./run-test.sh admin-api
```

**По умолчанию:**
- `public-api`: `FAILED_RATE_THRESHOLD=0.01` (<1% ошибок), `DURATION_P95_THRESHOLD=800` (p95 < 800ms)
- `admin-api`: `FAILED_RATE_THRESHOLD=0.02` (<2% ошибок), `DURATION_P95_THRESHOLD=1000` (p95 < 1000ms)

**Если получаете ошибку `thresholds on metrics 'http_req_failed' have been crossed`:**
1. Проверьте, что токены/авторизация настроены правильно (для admin-api)
2. Увеличьте порог ошибок: `FAILED_RATE_THRESHOLD=0.1` (10% ошибок допустимо)
3. Или отключите пороги для отладки: `DISABLE_THRESHOLDS=true`
4. Проверьте логи сервера на предмет реальных проблем

### Сохранение и сравнение результатов

#### Сохранение результатов в JSON

Для последующего сравнения результатов сохраняйте вывод k6 в JSON:

```bash
# Используя скрипт (рекомендуется)
chmod +x run-test.sh
./run-test.sh public-api

# Для admin-api с токеном
ADMIN_TOKEN="your-token" ./run-test.sh admin-api

# Или вручную
k6 run --out json=results/public-api-$(date +%Y%m%d-%H%M%S).json public-api.load.test.js
```

Результаты сохраняются в директорию `k6/results/` с timestamp в имени файла.

#### Сравнение результатов

Используйте скрипт `compare-results.js` для сравнения двух запусков:

```bash
# Табличный формат (по умолчанию)
node compare-results.js results/public-api-20241201-120000.json results/public-api-20241201-140000.json

# JSON формат
node compare-results.js results/public-api-20241201-120000.json results/public-api-20241201-140000.json --format json
```

Скрипт сравнивает:
- **HTTP Request Duration** (avg, p50, p90, p95, p99)
- **HTTP Request Failed Rate** (процент ошибок)
- **HTTP Requests** (общее количество и rate)
- **Virtual Users** (максимальное количество)
- **Кастомные метрики** (regions_duration, cities_duration, и т.д.)

Результаты показывают:
- ✅ **Улучшение** — метрика улучшилась более чем на 5%
- ❌ **Ухудшение** — метрика ухудшилась более чем на 5%
- ➡️ **Без изменений** — изменение менее 5%

#### Интеграция с Prometheus для визуализации

Если у вас настроен Prometheus (см. `infrastructure.yml`), можно экспортировать метрики k6 напрямую:

```bash
# Экспорт в Prometheus Remote Write
K6_PROMETHEUS_RW_SERVER_URL=http://localhost:9090/api/v1/write \
K6_PROMETHEUS_RW_TREND_STATS="p(90),p(95),p(99),avg" \
  k6 run --out prometheus-rw public-api.load.test.js
```

Или используйте InfluxDB (если настроен):

```bash
# Экспорт в InfluxDB
K6_INFLUXDB_PUSH_INTERVAL=10s \
K6_INFLUXDB_ADDR=http://localhost:8086 \
K6_INFLUXDB_DB=k6 \
  k6 run --out influxdb public-api.load.test.js
```

После экспорта в Prometheus/InfluxDB можно:
1. Создать дашборды в Grafana для визуализации метрик
2. Сравнивать результаты разных запусков через временные ряды
3. Настроить алерты при ухудшении производительности

#### Пример workflow для сравнения

```bash
# 1. Базовый тест (до изменений)
./run-test.sh public-api
# Результат: results/public-api-20241201-120000.json

# 2. Внесите изменения в код/конфигурацию

# 3. Новый тест (после изменений)
./run-test.sh public-api
# Результат: results/public-api-20241201-140000.json

# 4. Сравните результаты
node compare-results.js \
  results/public-api-20241201-120000.json \
  results/public-api-20241201-140000.json
```

### Структура файлов

```
k6/
├── public-api.load.test.js      # Тест публичного API
├── admin-api.load.test.js       # Тест админского API
├── compare-results.js            # Скрипт сравнения результатов
├── run-test.sh                   # Скрипт запуска с сохранением
├── package.json                  # npm скрипты
├── README.md                     # Эта документация
└── results/                      # Директория с результатами (создается автоматически)
    ├── public-api-20241201-120000.json
    └── admin-api-20241201-130000.json
```



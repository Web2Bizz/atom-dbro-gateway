# Atom DBRO Gateway

API Gateway на базе Nginx для маршрутизации и балансировки нагрузки между приложениями.

## Описание

Этот проект реализует gateway для приложений с использованием Nginx. Gateway обеспечивает:

- Маршрутизацию запросов к различным сервисам
- Балансировку нагрузки между upstream серверами
- Rate limiting для защиты от перегрузок
- Health check endpoints
- Базовые security headers
- Gzip сжатие
- Логирование запросов

## Структура проекта

```
.
├── nginx/
│   ├── nginx.conf          # Основная конфигурация nginx
│   ├── conf.d/
│   │   ├── default.conf    # Конфигурация сервера
│   │   └── upstreams.conf  # Настройки upstream серверов
│   └── logs/               # Директория для логов
├── scripts/
│   ├── reload-nginx.sh     # Скрипт перезагрузки (Linux/Mac)
│   └── reload-nginx.bat    # Скрипт перезагрузки (Windows)
├── Dockerfile              # Docker образ для gateway
├── docker-compose.yml      # Docker Compose конфигурация
└── README.md               # Документация

```

## Быстрый старт

### Запуск через Docker Compose

```bash
# Сборка и запуск
docker-compose up -d

# Просмотр логов
docker-compose logs -f gateway

# Остановка
docker-compose down
```

### Проверка работоспособности

```bash
# Health check
curl http://localhost:16345/health
```

## Конфигурация

### Настройка upstream серверов

Отредактируйте файл `nginx/conf.d/upstreams.conf` для настройки ваших backend серверов:

```nginx
upstream backend {
    server backend1:8080 weight=3;
    server backend2:8080 weight=2;
    server backend3:8080 backup;
}
```

### Настройка маршрутов

Отредактируйте файл `nginx/conf.d/default.conf` для настройки маршрутизации:

```nginx
location /api/v1/ {
    proxy_pass http://api_backend;
    # ... дополнительные настройки
}
```

### Rate Limiting

По умолчанию настроены два зоны rate limiting:
- `api_limit`: 10 запросов в секунду для `/api/`
- `general_limit`: 50 запросов в секунду для остальных запросов

Настройки можно изменить в `nginx/nginx.conf`.

## Интеграция с приложениями

Для подключения ваших приложений к gateway:

1. Добавьте ваши сервисы в `docker-compose.yml` в ту же сеть `gateway-network`
2. Настройте upstream серверы в `nginx/conf.d/upstreams.conf`
3. Настройте маршруты в `nginx/conf.d/default.conf`

Пример:

```yaml
services:
  gateway:
    # ... конфигурация gateway
  
  my-app:
    image: my-app:latest
    networks:
      - gateway-network
    # ... остальная конфигурация
```

## Логи

Логи nginx сохраняются в директории `nginx/logs/`:
- `access.log` - логи доступа
- `error.log` - логи ошибок

## Разработка

### Локальная разработка без Docker

```bash
# Установите nginx локально
# Затем скопируйте конфигурацию и запустите:
nginx -c $(pwd)/nginx/nginx.conf -p $(pwd)/
```

### Изменение конфигурации без пересборки

Все конфигурационные файлы nginx монтируются как volumes, поэтому вы можете изменять их без пересборки образа:

- `nginx/nginx.conf` - основная конфигурация
- `nginx/conf.d/*.conf` - конфигурации серверов и upstream

После изменения конфигурации перезагрузите nginx:

**С помощью скрипта (рекомендуется):**

```bash
# Linux/Mac
./scripts/reload-nginx.sh

# Windows
scripts\reload-nginx.bat
```

**Или вручную:**

```bash
# Проверка конфигурации
docker exec atom-dbro-gateway nginx -t

# Перезагрузка без остановки (если проверка прошла успешно)
docker exec atom-dbro-gateway nginx -s reload

# Или через docker-compose
docker-compose exec gateway nginx -s reload
```

**Важно:** Скрипты автоматически проверяют конфигурацию перед перезагрузкой. Если конфигурация содержит ошибки, nginx не будет перезагружен.

## Безопасность

Gateway включает базовые security headers:
- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`

Для production рекомендуется добавить:
- SSL/TLS сертификаты
- Дополнительные security headers
- Более строгие rate limits
- IP whitelisting при необходимости

## Лицензия

MIT


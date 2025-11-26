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
├── services/
│   ├── atom-dbro-backend/          # Основной backend API (подмодуль)
│   ├── atom-dbro-backend-admin/    # Backend API админки/модерации (подмодуль)
│   ├── atom-dbro-moderator-app/    # Фронтенд админки/модератора (подмодуль)
│   ├── hakaton/                    # Основное пользовательское фронтенд‑приложение (подмодуль)
│   ├── emailer/                    # Email‑сервис (подмодуль)
│   └── gateway/                    # Nginx‑шлюз
├── docker-compose.yml      # Docker Compose конфигурация
└── README.md               # Документация

```

## Сервисы (git submodules)

Все приложения лежат в `services/` и подключены как **git submodules**:

- **`services/atom-dbro-backend`**: основной backend API для пользовательского приложения (репозиторий `Web2Bizz/atom-dbro-backend`).
- **`services/atom-dbro-backend-admin`**: backend API для административной панели и модераторов (репозиторий `Web2Bizz/atom-dbro-admin-api`).
- **`services/atom-dbro-moderator-app`**: фронтенд‑приложение модератора/админки (репозиторий `Web2Bizz/atom-dbro-moderator-app`).
- **`services/hakaton`**: основное пользовательское фронтенд‑приложение (репозиторий `Web2Bizz/hakaton`).
- **`services/emailer`**: сервис рассылки e‑mail уведомлений и служебных писем (репозиторий `Web2Bizz/atom-dbro-email-service`).
- **`services/gateway`**: конфигурация Nginx‑шлюза, который маршрутизирует запросы между сервисами.

# Быстрый старт

## Клонирование репозитория

```
# клонировать репозиторий 
git clone https://github.com/Web2Bizz/atom-dbro-gateway.git
cd atom-dbro-gateway

# подтянуть подмодули (однократно после клонирования)
git submodule update --init --recursive

```

При обновлении версий сервисов внутри монорепозитория:

```
# обновить код всех подмодулей до зафиксированных в текущем коммите ревизий
git submodule update --init --recursive

# при необходимости подтянуть последние изменения из origin внутри конкретного сервиса
cd services/atom-dbro-backend && git pull origin main
```

## Конфигурация бэка

В `services/atom-dbro-backend` нужно создать `.env` файл.  
Ниже — **минимальная dev‑конфигурация**, которая сразу работает с локальными `postgres` и `minio` из `infrastructure.yml`:

```env
# База данных
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=atom_dbro
POSTGRES_PORT=5432

# Приложение
PORT=3000

# JWT
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=24h

# Database URL
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/atom_dbro

# S3 Configuration (ОБЯЗАТЕЛЬНО)
S3_BUCKET_NAME=my-bucket
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minioadmin
S3_REGION=us-east-1

# Пример для локального MinIO (поднимается в infrastructure.yml)
S3_ENDPOINT=http://minio:9000
S3_FORCE_PATH_STYLE=true

# S3 Configuration (опционально, для кастомных провайдеров)
# S3_ENDPOINT=https://s3.ru1.storage.beget.cloud
# S3_PUBLIC_URL_TEMPLATE=https://{bucket}.s3.{region}.amazonaws.com/{key}
# S3_FORCE_PATH_STYLE=true
```

## Конфигурация admin-бэка

Аналогично, в `services/atom-dbro-backend-admin` нужен файл `.env`.  
Для быстрого старта можно использовать те же значения, что и для основного бэка:

```env
# База данных
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=atom_dbro
POSTGRES_PORT=5432

# Приложение
PORT=3000

# JWT
JWT_SECRET=dev-secret-key-change-in-production
JWT_EXPIRES_IN=24h

# Database URL
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/atom_dbro

# S3 Configuration (локальный MinIO)
S3_BUCKET_NAME=my-bucket
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minioadmin
S3_REGION=us-east-1
S3_ENDPOINT=http://minio:9000
S3_FORCE_PATH_STYLE=true
```

## Docker compose

```

docker compose -p atom-release up -d --build

```

# Скрипты запуска

- `scripts/up_infrastructure.sh` — поднимает инфраструктурные сервисы (`docker compose -f infrastructure.yml up -d --build`). Можно передавать дополнительные аргументы командной строки.
- `scripts/up_apps.sh` — поднимает приложения из `docker-compose.yml`.

Перед первым запуском сделайте скрипты исполняемыми (Linux/macOS):

```
chmod +x scripts/*.sh
```

# Архитектура и сети

- Основная информация по сетям и назначению compose файлов описана в [`ARCHITECTURE.md`](ARCHITECTURE.md).
- `infrastructure.yml` поднимает `gateway`, `postgres`, `emailer`, `redis`, `rabbitmq` и создает сети (`atom_internal_network`, `atom_frontend_network`, `atom_gateway_network`). Его имеет смысл запускать/перезапускать редко:

```
docker compose -f infrastructure.yml up -d --build
```

- `docker-compose.yml` содержит часто обновляемые приложения (backend и frontend). После обновления образов достаточно выполнить:

```
docker compose up -d --build
```

- `postgres` пробрасывает порт `${POSTGRES_PORT:-5432}` для администрирования через pgAdmin/psql.
- Встроенные Redis и RabbitMQ уже находятся в `atom_internal_network`. При использовании внешних экземпляров подключите их к той же сети.
- Gateway и emailer используют публичные DNS (8.8.8.8/8.8.4.4), поэтому свободно инициируют исходящие соединения (проверки сертификатов, отправка писем).

# Данные для входа

| Роль               | Email                   | Пароль       |
|--------------------|-------------------------|--------------|
| Обычный пользователь | ivan@example.com        | password123  |
| Админ              | admin-atom@example.com | password123  |
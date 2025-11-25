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
│   ├── atom-dbro-backend/          # Бэкенд приложения
│   ├── atom-dbro-moderator-app/    # Приложение модератора
│   ├── gateway/                    # Шлюз
│   └── hakaton/                    # Основное приложение
├── docker-compose.yml      # Docker Compose конфигурация
└── README.md               # Документация

```

# Быстрый старт

## Клонирование репозитория

```
# клонировать репозиторий 
git clone https://github.com/Web2Bizz/atom-dbro-gateway.git

# подтянуть подмодули
git submodule update --init --recursive

```

## Конфигурация бэка

в services/atom-dbro-backend нужно создать .env файл с содержимым

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
S3_BUCKET_NAME=your-bucket-name
S3_ACCESS_KEY_ID=your-access-key-id
S3_SECRET_ACCESS_KEY=your-secret-access-key
S3_REGION=us-east-1

# S3 Configuration (опционально, для кастомных провайдеров)
# S3_ENDPOINT=https://s3.ru1.storage.beget.cloud
# S3_PUBLIC_URL_TEMPLATE=https://{bucket}.s3.{region}.amazonaws.com/{key}
# S3_FORCE_PATH_STYLE=true
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
- `infrastructure.yml` поднимает `gateway`, `postgres`, `emailer` и создает сети (`atom_internal_network`, `atom_frontend_network`, `atom_gateway_network`). Его имеет смысл запускать/перезапускать редко:

```
docker compose -f infrastructure.yml up -d --build
```

- `docker-compose.yml` содержит часто обновляемые приложения (backend и frontend). После обновления образов достаточно выполнить:

```
docker compose up -d --build
```

- `postgres` пробрасывает порт `${POSTGRES_PORT:-5432}` для администрирования через pgAdmin/psql.
- RabbitMQ и Redis (если размещены вне репозитория) нужно подключить к сети `atom_internal_network`, чтобы backend имел к ним доступ.
- Gateway и emailer используют публичные DNS (8.8.8.8/8.8.4.4), поэтому свободно инициируют исходящие соединения (проверки сертификатов, отправка писем).

# Данные для входа

email: ivan@example.com
password: password123
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

# Данные для входа

email: ivan@example.com
password: password123
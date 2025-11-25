## Бэкап базы данных PostgreSQL

Этот проект использует скрипт `scripts/backup_db.sh` для создания резервной копии базы данных PostgreSQL, запущенной в Docker (сервис `postgres` из `infrastructure.yml`).

### Требования

- **Docker и docker compose** установлены и доступны в PATH.
- **Инфраструктура поднята**, в частности контейнер с Postgres:

```bash
./scripts/up_infrastructure.sh
```

### Базовый запуск

Запуск с настройками по умолчанию (имя проекта `atom-release`, БД `atom_dbro`, пользователь `postgres`, пароль `postgres`, папка `./backups` в корне репо):

```bash
./scripts/backup_db.sh
```

### Запуск с переопределением переменных окружения

Параметры можно задать прямо перед командой:

```bash
PROJECT_NAME=atom-release \
POSTGRES_USER=my_user \
POSTGRES_PASSWORD=my_secret \
POSTGRES_DB=my_db \
BACKUP_DIR=/e/backups/atom \
./scripts/backup_db.sh
```

### Результат работы скрипта

- В каталоге `BACKUP_DIR` создаётся файл:
  - `POSTGRES_DB_YYYYmmdd_HHMMSS.sql.gz`
- Пример имени файла:
  - `atom_dbro_20251125_153012.sql.gz`

### Доступные переменные окружения

- **`PROJECT_NAME`** – имя проекта в `docker compose` (по умолчанию `atom-release`).
- **`POSTGRES_USER`** – пользователь БД (по умолчанию `postgres`).
- **`POSTGRES_PASSWORD`** – пароль пользователя БД (по умолчанию `postgres`).
- **`POSTGRES_DB`** – имя базы (по умолчанию `atom_dbro`).
- **`BACKUP_DIR`** – директория для сохранения бэкапов (по умолчанию `./backups` в корне репозитория).



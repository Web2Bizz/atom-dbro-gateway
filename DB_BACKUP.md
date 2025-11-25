## Бэкап и восстановление базы данных PostgreSQL

Этот проект использует скрипты `scripts/backup_db.sh` и `scripts/restore_db.sh` для создания и восстановления резервной копии базы данных PostgreSQL, запущенной в Docker (сервис `postgres` из `infrastructure.yml`).

### Требования

- **Docker и docker compose** установлены и доступны в PATH.
- **Инфраструктура поднята**, в частности контейнер с Postgres:

```bash
./scripts/up_infrastructure.sh
```

---

## Создание бэкапа

### Базовый запуск

Запуск с настройками по умолчанию (имя проекта `atom-release`, БД `atom_dbro`, пользователь `postgres`, пароль `postgres`, папка `./backups` в корне репозитория):

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

---

## Восстановление из бэкапа

**Внимание:** восстановление может перезаписать данные в целевой базе данных. Перед выполнением убедитесь, что вы восстанавливаетесь в правильную среду.

### Восстановление через скрипт

Используйте скрипт `scripts/restore_db.sh`, указав путь к файлу бэкапа (`.sql` или `.sql.gz`):

```bash
./scripts/restore_db.sh ./backups/atom_dbro_20251125_153012.sql.gz
```

Также можно переопределить переменные окружения (как и при бэкапе):

```bash
PROJECT_NAME=atom-release \
POSTGRES_USER=my_user \
POSTGRES_PASSWORD=my_secret \
POSTGRES_DB=my_db \
./scripts/restore_db.sh /e/backups/atom/my_db_20251125_153012.sql.gz
```

### Восстановление вручную (без скрипта)

Если нужно выполнить восстановление руками:

```bash
gunzip -c /path/to/backup.sql.gz | docker exec -i \
  -e PGPASSWORD="POSTGRES_PASSWORD" \
  atom-release-postgres \
  psql -U POSTGRES_USER -d POSTGRES_DB
```

Подставьте свои значения `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` и имя контейнера, если оно отличается.

---

## Доступные переменные окружения

- **`PROJECT_NAME`** – имя проекта в `docker compose` (по умолчанию `atom-release`).
- **`POSTGRES_USER`** – пользователь БД (по умолчанию `postgres`).
- **`POSTGRES_PASSWORD`** – пароль пользователя БД (по умолчанию `postgres`).
- **`POSTGRES_DB`** – имя базы (по умолчанию `atom_dbro`).
- **`BACKUP_DIR`** – директория для сохранения бэкапов (по умолчанию `./backups` в корне репозитория, используется только в `backup_db.sh`).




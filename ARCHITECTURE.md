# Архитектура Atom DBRO Gateway

## Слои docker-compose

- `infrastructure.yml` — долгоживущие сервисы: `gateway`, `postgres`, `emailer` и общие сети. Запускается первым, чтобы предоставить инфраструктуру.
- `docker-compose.yml` — часто обновляемые приложения (backend и frontend). Стартует после инфраструктуры и использует уже созданные сети.

## Сетевые зоны

Создаются три bridge-сети (имена Docker): `atom_internal_network`, `atom_frontend_network`, `atom_gateway_network`.

| Сеть | Назначение | Сервисы |
| --- | --- | --- |
| `internal-network` | Внутренняя шина данных. Защищенная связь между backend, БД и сервисами поддержки. | `backend-app`, `backend-admin-app`, `postgres`, `emailer`, `redis`, `rabbitmq`. |
| `frontend-network` | Зона пользовательских интерфейсов. | `hakaton-app`, `frontend-admin-app`, `gateway`. |
| `gateway-network` | Пограничная зона для трафика из интернета и SSL-терминации. | `gateway` (можно подключать внешние балансировщики). |

Gateway добавлен в `internal-network` и `frontend-network`, поэтому может проксировать запросы к обоим слоям, оставаясь единственной точкой входа.

## Очереди и кеш

Redis и RabbitMQ входят в `infrastructure.yml`, разворачиваются один раз и используют собственные тома (`atom-redis_data`, `atom-rabbitmq_data`).  
Если требуется подключить внешние экземпляры, достаточно подключить их к сети `atom_internal_network` (через `docker network connect` или флаг `--network` при запуске).

## Outbound трафик

- `gateway` и `emailer` используют публичные DNS (8.8.8.8 / 8.8.4.4) и bridge-сети, поэтому могут инициировать исходящие соединения (например, TLS-проверки, отправка писем).
- Дополнительные настройки firewall не требуются: Docker bridge по умолчанию имеет доступ к интернету.

## Доступ к базе данных

Порт `5432` проброшен из контейнера `postgres` на хост (`${POSTGRES_PORT:-5432}:5432`). Это позволяет использовать pgAdmin/psql для обслуживания БД без попадания в публичную сеть. При необходимости порт можно ограничить firewall-ом.

## Устойчивость Gateway

Nginx настроен на повторные попытки и возврат контролируемого ответа (503 JSON), если upstream недоступен. Это предотвращает падение gateway при недоступности backend.



#!/bin/bash

# Скрипт для перезагрузки конфигурации nginx без перезапуска контейнера

CONTAINER_NAME="atom-dbro-gateway"

echo "Проверка конфигурации nginx..."
docker exec $CONTAINER_NAME nginx -t

if [ $? -eq 0 ]; then
    echo "Конфигурация валидна. Перезагрузка nginx..."
    docker exec $CONTAINER_NAME nginx -s reload
    echo "Nginx успешно перезагружен!"
else
    echo "ОШИБКА: Конфигурация содержит ошибки. Nginx не перезагружен."
    exit 1
fi


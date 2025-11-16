@echo off
REM Скрипт для перезагрузки конфигурации nginx без перезапуска контейнера (Windows)

set CONTAINER_NAME=atom-dbro-gateway

echo Проверка конфигурации nginx...
docker exec %CONTAINER_NAME% nginx -t

if %errorlevel% equ 0 (
    echo Конфигурация валидна. Перезагрузка nginx...
    docker exec %CONTAINER_NAME% nginx -s reload
    echo Nginx успешно перезагружен!
) else (
    echo ОШИБКА: Конфигурация содержит ошибки. Nginx не перезагружен.
    exit /b 1
)


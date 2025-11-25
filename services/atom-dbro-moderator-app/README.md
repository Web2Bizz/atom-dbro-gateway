# Atom DBRO Moderator App

React приложение с современным стеком технологий и архитектурой Feature-Sliced Design.

## Технологический стек

- **React 18** - UI библиотека
- **TypeScript** - типизация
- **Vite** - сборщик и dev-сервер
- **TanStack Query** - управление серверным состоянием
- **React Router** - маршрутизация
- **React Hook Form** - работа с формами
- **Tailwind CSS** - стилизация
- **SCSS** - препроцессор стилей
- **Shadcn/ui** - UI компоненты
- **Feature-Sliced Design** - архитектура проекта

## Структура проекта (FSD)

```
src/
├── app/          # Инициализация приложения, провайдеры, роутинг
├── pages/        # Страницы приложения
├── widgets/      # Крупные самостоятельные блоки интерфейса
├── features/     # Бизнес-фичи приложения
├── entities/     # Бизнес-сущности
└── shared/       # Переиспользуемые модули (UI компоненты, утилиты)
```

## Установка и запуск

### Установка зависимостей

```bash
npm install
```

### Запуск dev-сервера

```bash
npm run dev
```

### Сборка для production

```bash
npm run build
```

### Просмотр production сборки

```bash
npm run preview
```

## Алиасы путей

Проект использует алиасы для удобного импорта:

- `@app/*` - слой приложения
- `@pages/*` - страницы
- `@widgets/*` - виджеты
- `@features/*` - фичи
- `@entities/*` - сущности
- `@shared/*` - общие модули
- `@/*` - корень src

Пример использования:

```typescript
import { Button } from '@shared/ui/button'
import { HomePage } from '@pages/home'
```

## Shadcn/ui

Компоненты shadcn/ui находятся в `src/shared/ui/`. Для добавления новых компонентов используйте:

```bash
npx shadcn-ui@latest add [component-name]
```

## Тема

Приложение использует только светлую тему (dark mode отключен).

## Docker

### Production сборка

Сборка и запуск production версии через Docker:

```bash
# Сборка образа
docker build -f docker/Dockerfile -t atom-dbro-moderator-app .

# Запуск контейнера
docker run -p 3000:80 atom-dbro-moderator-app
```

Или через docker-compose:

```bash
docker-compose up --build
```

Приложение будет доступно по адресу: http://localhost:3000

### Development режим

Для разработки с hot-reload:

```bash
docker build -f docker/Dockerfile.dev -t atom-dbro-moderator-app:dev .
docker run -p 5173:5173 -v $(pwd):/app atom-dbro-moderator-app:dev
```

Или через docker-compose (добавьте сервис в docker-compose.yml):

```yaml
services:
  app-dev:
    build:
      context: .
      dockerfile: docker/Dockerfile.dev
    ports:
      - "5173:5173"
    volumes:
      - .:/app
      - /app/node_modules
```

# Router Utilities

Утилиты и компоненты для работы с маршрутизацией в приложении.

## Использование

### Базовые маршруты

Маршруты настраиваются в `src/app/router/routes.tsx`:

```tsx
import { Route, Routes } from 'react-router-dom'
import { HomePage } from '@pages/home'

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
    </Routes>
  )
}
```

### Защищенные маршруты

Для защиты маршрутов используйте компонент `ProtectedRoute`:

```tsx
import { ProtectedRoute } from '@shared/lib/router'
import { useAuth } from '@features/auth'

<Route
  path="/dashboard"
  element={
    <ProtectedRoute isAllowed={isAuthenticated} redirectTo="/login">
      <DashboardPage />
    </ProtectedRoute>
  }
/>
```

### Получение параметров маршрута

Используйте типизированный хук `useRouteParams`:

```tsx
import { useRouteParams } from '@shared/lib/router'

// Для маршрута /users/:id
const { id } = useRouteParams<{ id: string }>()
```

### Константы маршрутов

Используйте константы из `ROUTES` для избежания магических строк:

```tsx
import { ROUTES } from '@shared/lib/router/utils'
import { Link } from 'react-router-dom'

<Link to={ROUTES.HOME}>Home</Link>
```

### Создание путей с параметрами

```tsx
import { createPath } from '@shared/lib/router/utils'

const path = createPath('/users/:id', { id: '123' })
// Результат: '/users/123'
```


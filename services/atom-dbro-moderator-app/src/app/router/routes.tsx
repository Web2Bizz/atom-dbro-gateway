import { Route, Routes, Navigate } from 'react-router-dom'
import { AuthPage } from '@pages/auth'
import { DashboardPage } from '@pages/dashboard'
import { RegionsPage } from '@pages/regions'
import { CitiesPage } from '@pages/cities'
import { UsersPage } from '@pages/users'
import { HelpTypesPage } from '@pages/help-types'
import { AchievementsPage } from '@pages/achievements'
import { OrganizationsPage } from '@pages/organizations'
import { QuestsPage } from '@pages/quests'
import { NotFoundPage } from '@pages/not-found'
import { ProtectedRoute } from '@shared/lib/router/components'
import { useSession } from '@app/providers'
import { ROUTES } from '@shared/lib/router/utils'

/**
 * Компонент для редиректа авторизованных пользователей
 */
function HomeRedirect() {
  const { isAuthenticated, isLoading } = useSession()

  // Показываем загрузку, пока сессия не загрузилась
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Загрузка...</div>
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return <AuthPage />
}

/**
 * Конфигурация маршрутов приложения
 */
export const AppRoutes = () => {
  const { isAuthenticated } = useSession()

  return (
    <Routes>
      <Route path={ROUTES.HOME} element={<HomeRedirect />} />
      <Route
        path={ROUTES.DASHBOARD}
        element={
          <ProtectedRoute isAllowed={isAuthenticated} redirectTo="/">
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.REGIONS}
        element={
          <ProtectedRoute isAllowed={isAuthenticated} redirectTo="/">
            <RegionsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.CITIES}
        element={
          <ProtectedRoute isAllowed={isAuthenticated} redirectTo="/">
            <CitiesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.USERS}
        element={
          <ProtectedRoute isAllowed={isAuthenticated} redirectTo="/">
            <UsersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.HELP_TYPES}
        element={
          <ProtectedRoute isAllowed={isAuthenticated} redirectTo="/">
            <HelpTypesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.ACHIEVEMENTS}
        element={
          <ProtectedRoute isAllowed={isAuthenticated} redirectTo="/">
            <AchievementsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.ORGANIZATIONS}
        element={
          <ProtectedRoute isAllowed={isAuthenticated} redirectTo="/">
            <OrganizationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.QUESTS}
        element={
          <ProtectedRoute isAllowed={isAuthenticated} redirectTo="/">
            <QuestsPage />
          </ProtectedRoute>
        }
      />
      <Route path={ROUTES.NOT_FOUND} element={<NotFoundPage />} />
    </Routes>
  )
}

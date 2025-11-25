import { Navigate, useLocation } from 'react-router-dom'
import { ReactNode } from 'react'

interface ProtectedRouteProps {
  children: ReactNode
  isAllowed?: boolean
  redirectTo?: string
}

/**
 * Компонент для защиты маршрутов
 * Используется для маршрутов, требующих авторизации
 */
export const ProtectedRoute = ({
  children,
  isAllowed = false,
  redirectTo = '/',
}: ProtectedRouteProps) => {
  const location = useLocation()

  if (!isAllowed) {
    // Сохраняем текущий путь для редиректа после авторизации
    return <Navigate to={redirectTo} state={{ from: location }} replace />
  }

  return <>{children}</>
}


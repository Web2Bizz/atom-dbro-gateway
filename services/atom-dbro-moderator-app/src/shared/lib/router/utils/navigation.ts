/**
 * Утилиты для навигации
 */

export const ROUTES = {
  HOME: '/',
  AUTH: '/',
  DASHBOARD: '/dashboard',
  REGIONS: '/regions',
  CITIES: '/cities',
  USERS: '/users',
  HELP_TYPES: '/help-types',
  ORGANIZATIONS: '/organizations',
  QUESTS: '/quests',
  ACHIEVEMENTS: '/achievements',
  NOT_FOUND: '*',
} as const

export type RoutePath = typeof ROUTES[keyof typeof ROUTES]

/**
 * Создает путь с параметрами
 */
export function createPath(
  path: string,
  params?: Record<string, string | number>
): string {
  if (!params) return path

  return Object.entries(params).reduce(
    (acc, [key, value]) => acc.replace(`:${key}`, String(value)),
    path
  )
}


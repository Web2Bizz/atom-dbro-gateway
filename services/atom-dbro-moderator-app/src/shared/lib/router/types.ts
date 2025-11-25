/**
 * Типы для маршрутизации
 */

export interface RouteConfig {
  path: string
  element: React.ComponentType
  children?: RouteConfig[]
  index?: boolean
}

export type RouteParams = Record<string, string>


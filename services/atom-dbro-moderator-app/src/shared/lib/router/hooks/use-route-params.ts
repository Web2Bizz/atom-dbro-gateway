import { useParams } from 'react-router-dom'
import type { RouteParams } from '../types'

/**
 * Типизированный хук для получения параметров маршрута
 */
export function useRouteParams<T extends RouteParams = RouteParams>(): T {
  return useParams() as T
}


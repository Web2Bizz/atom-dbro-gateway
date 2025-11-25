import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query'
import { get } from '../api/client'
import type { ApiError } from '../api/types'

/**
 * Типизированный хук для GET запросов
 */
export function useApiQuery<TData = unknown, TError = ApiError>(
  queryKey: string[],
  endpoint: string,
  options?: Omit<UseQueryOptions<TData, TError>, 'queryKey' | 'queryFn'>
): UseQueryResult<TData, TError> {
  return useQuery<TData, TError>({
    queryKey,
    queryFn: () => get<TData>(endpoint),
    ...options,
  })
}


import {
  useMutation,
  UseMutationOptions,
  UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query'
import { post, put, patch, del } from '../api/client'
import type { ApiError } from '../api/types'

type MutationMethod = 'POST' | 'PUT' | 'PATCH' | 'DELETE'

interface UseApiMutationOptions<TData, TVariables, TError = ApiError> {
  endpoint: string
  method?: MutationMethod
  invalidateQueries?: string[][]
  onSuccess?: (data: TData, variables: TVariables) => void | Promise<void>
  onError?: (error: TError, variables: TVariables) => void | Promise<void>
}

/**
 * Типизированный хук для мутаций (POST, PUT, PATCH, DELETE)
 */
export function useApiMutation<TData = unknown, TVariables = unknown, TError = ApiError>(
  options: UseApiMutationOptions<TData, TVariables, TError>,
  mutationOptions?: Omit<UseMutationOptions<TData, TError, TVariables>, 'mutationFn'>
): UseMutationResult<TData, TError, TVariables> {
  const queryClient = useQueryClient()
  const { endpoint, method = 'POST', invalidateQueries, onSuccess, onError } = options

  return useMutation<TData, TError, TVariables>({
    mutationFn: async (variables: TVariables) => {
      switch (method) {
        case 'POST':
          return post<TData>(endpoint, variables)
        case 'PUT':
          return put<TData>(endpoint, variables)
        case 'PATCH':
          return patch<TData>(endpoint, variables)
        case 'DELETE':
          return del<TData>(endpoint)
        default:
          throw new Error(`Unsupported method: ${method}`)
      }
    },
    onSuccess: async (data, variables) => {
      // Инвалидируем указанные запросы
      if (invalidateQueries) {
        await Promise.all(
          invalidateQueries.map((queryKey) => queryClient.invalidateQueries({ queryKey }))
        )
      }
      // Вызываем пользовательский onSuccess
      if (onSuccess) {
        await onSuccess(data, variables)
      }
    },
    onError: async (error, variables) => {
      if (onError) {
        await onError(error, variables)
      }
    },
    ...mutationOptions,
  })
}


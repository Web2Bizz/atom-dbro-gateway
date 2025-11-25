import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ReactNode } from 'react'

// Создаем QueryClient с расширенной конфигурацией
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Не перезапрашивать при фокусе окна
      refetchOnWindowFocus: false,
      // Не перезапрашивать при переподключении
      refetchOnReconnect: true,
      // Не перезапрашивать при монтировании, если данные свежие
      refetchOnMount: true,
      // Время, в течение которого данные считаются свежими (5 минут)
      staleTime: 5 * 60 * 1000,
      // Время хранения неиспользуемых данных в кэше (10 минут)
      gcTime: 10 * 60 * 1000,
      // Количество повторных попыток при ошибке
      retry: (failureCount, error: any) => {
        // Не повторять при 4xx ошибках (кроме 408, 429)
        if (error?.status >= 400 && error?.status < 500) {
          if (error?.status === 408 || error?.status === 429) {
            return failureCount < 2
          }
          return false
        }
        // Повторять до 3 раз для других ошибок
        return failureCount < 3
      },
      // Задержка между повторными попытками (экспоненциальная)
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      // Количество повторных попыток при ошибке мутации
      retry: 1,
      // Задержка между повторными попытками
      retryDelay: 1000,
    },
  },
})

export const QueryProvider = ({ children }: { children: ReactNode }) => {
  const isDevelopment = import.meta.env.DEV

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {isDevelopment && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  )
}


import type { ApiError, ApiResponse, RequestConfig } from './types'
import { getAuthToken as getTokenFromSession } from '@app/providers/session-provider'

/**
 * Базовый URL API
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://82.202.140.37:3000/api/v1'

/**
 * Получить токен авторизации из контекста сессии
 */
function getAuthToken(): string | null {
  const token = getTokenFromSession()
  if (token) {
    console.log('[API Client] Token found from context, length:', token.length)
  } else {
    console.warn('[API Client] No token in session context')
  }
  return token
}

/**
 * Обработчик ошибок авторизации
 */
let onUnauthorized: (() => void) | null = null

export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler
}

/**
 * Создает полный URL для запроса
 */
function createUrl(endpoint: string): string {
  if (endpoint.startsWith('http')) {
    return endpoint
  }
  return `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`
}

/**
 * Обработка ответа от сервера
 */
async function handleResponse<T>(response: Response, endpoint: string): Promise<T> {
  const contentType = response.headers.get('content-type')
  const isJson = contentType?.includes('application/json')

  if (!response.ok) {
    const error: ApiError = {
      status: response.status,
      message: response.statusText,
    }

    if (isJson) {
      try {
        const data = await response.json()
        error.message = data.message || data.error || response.statusText
        error.errors = data.errors
      } catch {
        // Если не удалось распарсить JSON, используем дефолтное сообщение
      }
    }

    // Обработка ошибки 401 (неавторизован) - только для защищенных эндпоинтов
    // Не обрабатываем 401 для /auth/login, чтобы не было зацикливания
    if (response.status === 401 && !endpoint.includes('/auth/')) {
      // Очищаем сессию
      localStorage.removeItem('atom_dbro_session')
      // Вызываем обработчик неавторизации
      if (onUnauthorized) {
        onUnauthorized()
      }
    }

    throw error
  }

  if (isJson) {
    const jsonData = await response.json()
    console.log(`[API Client] Response data for ${endpoint}:`, jsonData)
    // API может возвращать данные в формате { data: ... } или напрямую
    const data: ApiResponse<T> = jsonData
    return data.data ?? (data as unknown as T)
  }

  return response.text() as unknown as T
}

/**
 * Базовый клиент для выполнения HTTP запросов
 */
export async function apiClient<T>(
  endpoint: string,
  config: RequestConfig = {}
): Promise<T> {
  const { method = 'GET', headers = {}, body, signal } = config

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  }

  // Добавляем токен авторизации из сессии
  const token = getAuthToken()
  if (token) {
    defaultHeaders.Authorization = `Bearer ${token}`
  } else {
    console.warn(`[API Client] No token found for endpoint: ${endpoint}`)
  }

  const requestConfig: RequestInit = {
    method,
    headers: defaultHeaders,
    signal,
  }

  if (body && method !== 'GET') {
    requestConfig.body = JSON.stringify(body)
  }

  const url = createUrl(endpoint)
  console.log(`[API Client] ${method} ${url}`, {
    hasToken: !!token,
    headers: Object.keys(defaultHeaders),
  })
  const response = await fetch(url, requestConfig)
  console.log(`[API Client] Response for ${endpoint}:`, {
    status: response.status,
    ok: response.ok,
  })
  return handleResponse<T>(response, endpoint)
}

/**
 * GET запрос
 */
export function get<T>(endpoint: string, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<T> {
  return apiClient<T>(endpoint, { ...config, method: 'GET' })
}

/**
 * POST запрос
 */
export function post<T>(endpoint: string, body?: unknown, config?: Omit<RequestConfig, 'method'>): Promise<T> {
  return apiClient<T>(endpoint, { ...config, method: 'POST', body })
}

/**
 * PUT запрос
 */
export function put<T>(endpoint: string, body?: unknown, config?: Omit<RequestConfig, 'method'>): Promise<T> {
  return apiClient<T>(endpoint, { ...config, method: 'PUT', body })
}

/**
 * PATCH запрос
 */
export function patch<T>(endpoint: string, body?: unknown, config?: Omit<RequestConfig, 'method'>): Promise<T> {
  return apiClient<T>(endpoint, { ...config, method: 'PATCH', body })
}

/**
 * DELETE запрос
 */
export function del<T>(endpoint: string, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<T> {
  return apiClient<T>(endpoint, { ...config, method: 'DELETE' })
}


import { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react'

interface Session {
  token: string
  user?: {
    id: string
    email: string
    [key: string]: unknown
  }
}

interface SessionContextType {
  session: Session | null
  setSession: (session: Session | null) => void
  isAuthenticated: boolean
  isLoading: boolean
  logout: () => void
}

const SessionContext = createContext<SessionContextType | undefined>(undefined)

const SESSION_STORAGE_KEY = 'atom_dbro_session'

// Глобальная функция для получения токена (для использования вне React компонентов)
let getTokenFromContext: (() => string | null) | null = null

export function setTokenGetter(getter: () => string | null) {
  getTokenFromContext = getter
}

export function getAuthToken(): string | null {
  if (getTokenFromContext) {
    return getTokenFromContext()
  }
  // Fallback на localStorage, если контекст еще не инициализирован
  try {
    const storedSession = localStorage.getItem(SESSION_STORAGE_KEY)
    if (storedSession) {
      const session = JSON.parse(storedSession)
      return session?.token || null
    }
  } catch {
    // Игнорируем ошибки парсинга
  }
  return null
}

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSessionState] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const sessionRef = useRef<Session | null>(null)

  // Загружаем сессию из localStorage при монтировании
  useEffect(() => {
    const storedSession = localStorage.getItem(SESSION_STORAGE_KEY)
    if (storedSession) {
      try {
        const parsedSession = JSON.parse(storedSession)
        console.log('Loaded session from localStorage:', parsedSession)
        // Обновляем ref синхронно
        sessionRef.current = parsedSession
        setSessionState(parsedSession)
      } catch {
        // Если не удалось распарсить, удаляем невалидные данные
        localStorage.removeItem(SESSION_STORAGE_KEY)
        sessionRef.current = null
      }
    } else {
      console.log('No session found in localStorage')
      sessionRef.current = null
    }
    setIsLoading(false)
  }, [])

  // Сохраняем сессию в localStorage при изменении
  useEffect(() => {
    if (session) {
      console.log('[SessionProvider] Saving session to localStorage:', { 
        hasToken: !!session.token,
        hasUser: !!session.user 
      })
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
    } else {
      console.log('[SessionProvider] Clearing session from localStorage')
      localStorage.removeItem(SESSION_STORAGE_KEY)
    }
  }, [session])

  const setSession = (newSession: Session | null) => {
    console.log('[SessionProvider] setSession called with:', {
      hasToken: !!newSession?.token,
      hasUser: !!newSession?.user,
    })
    // Синхронно обновляем ref, чтобы getTokenFromContext сразу получил актуальное значение
    sessionRef.current = newSession
    // Обновляем состояние, чтобы контекст обновился
    setSessionState(newSession)
    // Сохраняем в localStorage сразу для синхронизации
    if (newSession) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newSession))
      console.log('[SessionProvider] Session saved to localStorage immediately')
    } else {
      localStorage.removeItem(SESSION_STORAGE_KEY)
    }
  }

  const logout = () => {
    sessionRef.current = null
    setSessionState(null)
  }

  const value: SessionContextType = {
    session,
    setSession,
    isAuthenticated: !!session,
    isLoading,
    logout,
  }


  // Устанавливаем функцию для получения токена из контекста
  // Используем ref для получения актуального значения
  useEffect(() => {
    const getter = () => {
      // Используем ref для получения актуального значения сессии
      const currentSession = sessionRef.current
      if (currentSession?.token) {
        return currentSession.token
      }
      // Fallback на localStorage, если контекст еще не обновился
      try {
        const storedSession = localStorage.getItem(SESSION_STORAGE_KEY)
        if (storedSession) {
          const parsed = JSON.parse(storedSession)
          return parsed?.token || null
        }
      } catch {
        // Игнорируем ошибки
      }
      return null
    }
    setTokenGetter(getter)
    console.log('[SessionProvider] Token getter updated, current token:', session?.token ? 'exists' : 'none')
  }, [session])

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  )
}

export const useSession = () => {
  const context = useContext(SessionContext)
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider')
  }
  return context
}


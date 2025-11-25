import { BrowserRouter, useNavigate } from 'react-router-dom'
import { QueryProvider, SessionProvider } from './providers'
import { AppRoutes } from './router'
import { setUnauthorizedHandler } from '@shared/lib/api/client'
import { Toaster } from '@shared/ui/toaster'

// Компонент для настройки обработчика неавторизации
function UnauthorizedHandler() {
  const navigate = useNavigate()
  
  // Настраиваем обработчик редиректа при 401 ошибке
  setUnauthorizedHandler(() => {
    navigate('/')
  })
  
  return null
}

function App() {
  return (
    <QueryProvider>
      <SessionProvider>
        <BrowserRouter basename="/moderator">
          <UnauthorizedHandler />
          <AppRoutes />
          <Toaster />
        </BrowserRouter>
      </SessionProvider>
    </QueryProvider>
  )
}

export default App


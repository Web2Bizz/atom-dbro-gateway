import { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useSession } from '@app/providers'
import { ROUTES } from '@shared/lib/router/utils'
import { Button } from '@shared/ui/button'
import { LogOut } from 'lucide-react'

interface LayoutProps {
  children: ReactNode
}

const navigation = [
  { name: 'Панель управления', path: ROUTES.DASHBOARD },
  { name: 'Регионы', path: ROUTES.REGIONS },
  { name: 'Города', path: ROUTES.CITIES },
  { name: 'Пользователи', path: ROUTES.USERS },
  { name: 'Виды помощи', path: ROUTES.HELP_TYPES },
  { name: 'Организации', path: ROUTES.ORGANIZATIONS },
  { name: 'Квесты', path: ROUTES.QUESTS },
  { name: 'Достижения', path: ROUTES.ACHIEVEMENTS },
]

export const Layout = ({ children }: LayoutProps) => {
  const location = useLocation()
  const { session, logout } = useSession()

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <aside className="w-64 border-r border-border bg-background flex flex-col">
          <div className="p-6 flex-1 overflow-y-auto">
            <h2 className="text-lg font-light mb-6">Модератор</h2>
            <nav className="space-y-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.path
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`block px-3 py-2 text-sm transition-colors ${
                      isActive
                        ? 'bg-muted text-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                  >
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="border-b border-border bg-background flex-shrink-0">
            <div className="flex items-center justify-between px-6 py-4">
              <div>
                <h1 className="text-xl font-light">
                  {navigation.find((item) => item.path === location.pathname)
                    ?.name || 'Панель управления'}
                </h1>
              </div>
              <div className="flex items-center gap-4">
                {session?.user && (
                  <span className="text-sm text-muted-foreground">
                    {session.user.email}
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    logout()
                  }}
                  className="gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Выход
                </Button>
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="p-6 flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </div>
  )
}


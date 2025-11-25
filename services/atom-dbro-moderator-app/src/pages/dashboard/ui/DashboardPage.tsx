import { useApiQuery } from '@shared/lib/hooks'
import { Layout } from '@widgets/layout'
import type { Region, City, User, HelpType, Organization, Quest, Achievement } from '@shared/lib/api/types'

export const DashboardPage = () => {
  const { data: regions = [] } = useApiQuery<Region[]>(['regions'], '/regions')
  const { data: cities = [] } = useApiQuery<City[]>(['cities'], '/cities')
  const { data: users = [] } = useApiQuery<User[]>(['users'], '/users')
  const { data: helpTypes = [] } = useApiQuery<HelpType[]>(['help-types'], '/help-types')
  const { data: organizations = [] } = useApiQuery<Organization[]>(['organizations'], '/organizations')
  const { data: quests = [] } = useApiQuery<Quest[]>(['quests'], '/quests')
  const { data: achievements = [] } = useApiQuery<Achievement[]>(['achievements'], '/achievements')

  const stats = [
    {
      title: 'Регионы',
      value: regions.length,
      description: 'Всего регионов в системе',
    },
    {
      title: 'Города',
      value: cities.length,
      description: 'Всего городов в системе',
    },
    {
      title: 'Пользователи',
      value: users.length,
      description: 'Зарегистрированных пользователей',
    },
    {
      title: 'Виды помощи',
      value: helpTypes.length,
      description: 'Доступных видов помощи',
    },
    {
      title: 'Организации',
      value: organizations.length,
      description: 'Зарегистрированных организаций',
    },
    {
      title: 'Квесты',
      value: quests.length,
      description: 'Активных квестов',
    },
    {
      title: 'Достижения',
      value: achievements.length,
      description: 'Всего достижений',
    },
  ]

  const activeQuests = quests.filter((q) => q.status === 'active').length
  const completedQuests = quests.filter((q) => q.status === 'completed').length

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-light mb-2">Панель модератора</h2>
          <p className="text-muted-foreground">
            Обзор системы и статистика
          </p>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div
              key={stat.title}
              className="border border-border rounded-lg p-6 bg-background"
            >
              <div className="text-3xl font-light mb-2">{stat.value}</div>
              <div className="text-sm font-medium mb-1">{stat.title}</div>
              <div className="text-xs text-muted-foreground">{stat.description}</div>
            </div>
          ))}
        </div>

        {/* Дополнительная статистика по квестам */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-border rounded-lg p-6 bg-background">
            <div className="text-2xl font-light mb-2">{activeQuests}</div>
            <div className="text-sm font-medium mb-1">Активных квестов</div>
            <div className="text-xs text-muted-foreground">
              Квесты в статусе "Активный"
            </div>
          </div>
          <div className="border border-border rounded-lg p-6 bg-background">
            <div className="text-2xl font-light mb-2">{completedQuests}</div>
            <div className="text-sm font-medium mb-1">Завершенных квестов</div>
            <div className="text-xs text-muted-foreground">
              Квесты в статусе "Завершен"
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

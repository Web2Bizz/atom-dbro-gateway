import { useState, useMemo } from 'react'
import { useApiQuery, useApiMutation } from '@shared/lib/hooks'
import { patch, del } from '@shared/lib/api/client'
import { useQueryClient } from '@tanstack/react-query'
import { Layout } from '@widgets/layout'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@shared/ui/table'
import { Button } from '@shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@shared/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@shared/ui/form'
import { Input } from '@shared/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/ui/select'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import type { Achievement, CreateAchievementDto } from '@shared/lib/api/types'
import { Plus, Pencil, Trash2, Search, X } from 'lucide-react'

const achievementSchema = z.object({
  title: z.string().min(1, 'Название обязательно'),
  description: z.string().optional(),
  icon: z.string().optional(),
  rarity: z.enum(['common', 'epic', 'rare', 'legendary', 'private']),
})

type AchievementFormData = z.infer<typeof achievementSchema>

export const AchievementsPage = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingAchievement, setEditingAchievement] = useState<Achievement | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const queryClient = useQueryClient()

  const { data: achievements = [], isLoading } = useApiQuery<Achievement[]>(
    ['achievements'],
    '/achievements'
  )

  // Фильтрация достижений
  const filteredAchievements = useMemo(() => {
    if (!searchQuery) return achievements
    const query = searchQuery.toLowerCase()
    return achievements.filter(
      (achievement) =>
        achievement.title?.toLowerCase().includes(query) ||
        achievement.description?.toLowerCase().includes(query) ||
        achievement.rarity?.toLowerCase().includes(query)
    )
  }, [achievements, searchQuery])

  const createMutation = useApiMutation<Achievement, CreateAchievementDto>({
    endpoint: '/achievements',
    method: 'POST',
    invalidateQueries: [['achievements']],
    onSuccess: () => {
      setIsCreateOpen(false)
      createForm.reset()
    },
  })

  const createForm = useForm<AchievementFormData>({
    resolver: zodResolver(achievementSchema),
    defaultValues: {
      title: '',
      description: '',
      icon: '',
      rarity: 'common',
    },
  })

  const editForm = useForm<AchievementFormData>({
    resolver: zodResolver(achievementSchema),
    defaultValues: {
      title: editingAchievement?.title || '',
      description: editingAchievement?.description || '',
      icon: editingAchievement?.icon || '',
      rarity: editingAchievement?.rarity || 'common',
    },
  })

  const handleCreate = (data: AchievementFormData) => {
    createMutation.mutate(data)
  }

  const handleEdit = async (data: AchievementFormData) => {
    if (editingAchievement) {
      setIsUpdating(true)
      try {
        await patch<Achievement>(`/achievements/${editingAchievement.id}`, data)
        queryClient.invalidateQueries({ queryKey: ['achievements'] })
        setEditingAchievement(null)
        editForm.reset()
      } catch (error) {
        console.error('Ошибка при обновлении достижения:', error)
      } finally {
        setIsUpdating(false)
      }
    }
  }

  const handleDelete = async (achievement: Achievement) => {
    if (confirm(`Удалить достижение "${achievement.title}"?`)) {
      try {
        await del<void>(`/achievements/${achievement.id}`)
        queryClient.invalidateQueries({ queryKey: ['achievements'] })
      } catch (error) {
        console.error('Ошибка при удалении достижения:', error)
      }
    }
  }

  const handleEditClick = (achievement: Achievement) => {
    setEditingAchievement(achievement)
    editForm.reset({
      title: achievement.title,
      description: achievement.description || '',
      icon: achievement.icon || '',
      rarity: achievement.rarity,
    })
  }

  const rarityLabels = {
    common: 'Обычное',
    epic: 'Эпическое',
    rare: 'Редкое',
    legendary: 'Легендарное',
    private: 'Приватное',
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-light">Достижения</h2>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Добавить достижение
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Создать достижение</DialogTitle>
              </DialogHeader>
              <Form {...createForm}>
                <form
                  onSubmit={createForm.handleSubmit(handleCreate)}
                  className="space-y-4"
                >
                  <FormField
                    control={createForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Название</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Описание</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="icon"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Иконка (URL)</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="rarity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Редкость</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Выберите редкость" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(rarityLabels).map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateOpen(false)}
                    >
                      Отмена
                    </Button>
                    <Button
                      type="submit"
                      disabled={createMutation.isPending}
                    >
                      Создать
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Фильтры */}
        <div className="flex items-center gap-4 p-4 border rounded-lg bg-card">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по названию, описанию или редкости..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="text-muted-foreground">Загрузка...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Название</TableHead>
                <TableHead>Описание</TableHead>
                <TableHead>Редкость</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAchievements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    {achievements.length === 0
                      ? 'Нет достижений'
                      : 'Не найдено достижений по заданным фильтрам'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredAchievements.map((achievement) => (
                  <TableRow key={achievement.id}>
                    <TableCell>{achievement.id}</TableCell>
                    <TableCell>{achievement.title}</TableCell>
                    <TableCell>{achievement.description || '-'}</TableCell>
                    <TableCell>{rarityLabels[achievement.rarity]}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClick(achievement)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(achievement)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}

        {/* Edit Dialog */}
        <Dialog open={!!editingAchievement} onOpenChange={(open: boolean) => !open && setEditingAchievement(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Редактировать достижение</DialogTitle>
            </DialogHeader>
            <Form {...editForm}>
              <form
                onSubmit={editForm.handleSubmit(handleEdit)}
                className="space-y-4"
              >
                <FormField
                  control={editForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Название</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Описание</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="icon"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Иконка (URL)</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="rarity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Редкость</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите редкость" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(rarityLabels).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingAchievement(null)}
                  >
                    Отмена
                  </Button>
                  <Button
                    type="submit"
                    disabled={isUpdating}
                  >
                    {isUpdating ? 'Сохранение...' : 'Сохранить'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  )
}


import { useState, useMemo, useEffect } from 'react'
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
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import type { User, CreateUserDto } from '@shared/lib/api/types'
import { Plus, Pencil, Trash2, Search, X } from 'lucide-react'

const userSchema = z.object({
  firstName: z.string().min(1, 'Имя обязательно'),
  lastName: z.string().min(1, 'Фамилия обязательна'),
  middleName: z.string().optional(),
  email: z.string().email('Некорректный email'),
  password: z.string().min(6, 'Минимум 6 символов').optional(),
})

type UserFormData = z.infer<typeof userSchema>

export const UsersPage = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const queryClient = useQueryClient()

  const { data: users = [], isLoading } = useApiQuery<User[]>(['users'], '/users')

  // Фильтрация пользователей
  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users
    const query = searchQuery.toLowerCase()
    return users.filter(
      (user) =>
        user.firstName?.toLowerCase().includes(query) ||
        user.lastName?.toLowerCase().includes(query) ||
        user.middleName?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query)
    )
  }, [users, searchQuery])

  const createMutation = useApiMutation<User, CreateUserDto>({
    endpoint: '/users',
    method: 'POST',
    invalidateQueries: [['users']],
    onSuccess: () => {
      setIsCreateOpen(false)
      createForm.reset()
    },
  })

  const createForm = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      middleName: '',
      email: '',
      password: '',
    },
  })

  const editForm = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      middleName: '',
      email: '',
    },
  })

  useEffect(() => {
    if (editingUser) {
      editForm.reset({
        firstName: editingUser.firstName,
        lastName: editingUser.lastName,
        middleName: editingUser.middleName || '',
        email: editingUser.email,
      })
    }
  }, [editingUser, editForm])

  const handleCreate = (data: UserFormData) => {
    const { password, ...userData } = data
    createMutation.mutate({
      ...userData,
      password: password || '',
    } as CreateUserDto)
  }

  const handleEdit = async (data: UserFormData) => {
    if (editingUser) {
      setIsUpdating(true)
      try {
        const updateData: Partial<CreateUserDto> = {
          firstName: data.firstName,
          lastName: data.lastName,
          middleName: data.middleName,
          email: data.email,
        }
        await patch<User>(`/users/${editingUser.id}`, updateData)
        queryClient.invalidateQueries({ queryKey: ['users'] })
        setEditingUser(null)
        editForm.reset()
      } catch (error) {
        console.error('Ошибка при обновлении пользователя:', error)
      } finally {
        setIsUpdating(false)
      }
    }
  }

  const handleDelete = async (user: User) => {
    if (confirm(`Удалить пользователя "${user.firstName} ${user.lastName}"?`)) {
      try {
        await del<void>(`/users/${user.id}`)
        queryClient.invalidateQueries({ queryKey: ['users'] })
      } catch (error) {
        console.error('Ошибка при удалении пользователя:', error)
      }
    }
  }

  const handleEditClick = (user: User) => {
    setEditingUser(user)
    editForm.reset({
      firstName: user.firstName,
      lastName: user.lastName,
      middleName: user.middleName || '',
      email: user.email,
    })
  }

  const getInitials = (user: User) => {
    const firstLetter = user.lastName?.[0]?.toUpperCase() || ''
    const secondLetter = user.firstName?.[0]?.toUpperCase() || ''
    return `${firstLetter}${secondLetter}`
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-light">Пользователи</h2>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Добавить пользователя
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Создать пользователя</DialogTitle>
              </DialogHeader>
              <Form {...createForm}>
                <form
                  onSubmit={createForm.handleSubmit(handleCreate)}
                  className="space-y-4"
                >
                  <FormField
                    control={createForm.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Имя</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Фамилия</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="middleName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Отчество</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Пароль</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
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
              placeholder="Поиск по имени, фамилии, отчеству или email..."
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
                <TableHead></TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Имя</TableHead>
                <TableHead>Фамилия</TableHead>
                <TableHead>Отчество</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Роль</TableHead>
                <TableHead>Опыт</TableHead>
                <TableHead>Уровень</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-muted-foreground">
                    {users.length === 0
                      ? 'Нет пользователей'
                      : 'Не найдено пользователей по заданным фильтрам'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => {
                  const experience = user.experience || 0
                  const level = Math.floor(experience / 100) + 1
                  const avatarUrl = user.avatarUrls?.[5]
                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt={`${user.firstName} ${user.lastName}`}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                            {getInitials(user)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{user.id}</TableCell>
                      <TableCell>{user.firstName}</TableCell>
                      <TableCell>{user.lastName}</TableCell>
                      <TableCell>{user.middleName || '-'}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.role || '-'}</TableCell>
                      <TableCell>{experience}</TableCell>
                      <TableCell>{level}</TableCell>
                      <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClick(user)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(user)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        )}

        {/* Edit Dialog */}
        <Dialog open={!!editingUser} onOpenChange={(open: boolean) => !open && setEditingUser(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Редактировать пользователя</DialogTitle>
            </DialogHeader>
            <Form {...editForm}>
              <form
                onSubmit={editForm.handleSubmit(handleEdit)}
                className="space-y-4"
              >
                <FormField
                  control={editForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Имя</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Фамилия</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="middleName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Отчество</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingUser(null)}
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


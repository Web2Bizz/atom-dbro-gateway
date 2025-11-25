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
import { Textarea } from '@shared/ui/textarea'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import type { HelpType, CreateHelpTypeDto } from '@shared/lib/api/types'
import { Plus, Pencil, Trash2, Search, X } from 'lucide-react'

const helpTypeSchema = z.object({
  name: z.string().min(1, 'Название обязательно'),
  description: z.string().optional(),
})

type HelpTypeFormData = z.infer<typeof helpTypeSchema>

export const HelpTypesPage = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingHelpType, setEditingHelpType] = useState<HelpType | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const queryClient = useQueryClient()

  const { data: helpTypes = [], isLoading } = useApiQuery<HelpType[]>(
    ['help-types'],
    '/help-types'
  )

  // Фильтрация видов помощи
  const filteredHelpTypes = useMemo(() => {
    if (!searchQuery) return helpTypes
    const query = searchQuery.toLowerCase()
    return helpTypes.filter(
      (helpType) =>
        helpType.name?.toLowerCase().includes(query) ||
        helpType.description?.toLowerCase().includes(query)
    )
  }, [helpTypes, searchQuery])

  const createMutation = useApiMutation<HelpType, CreateHelpTypeDto>({
    endpoint: '/help-types',
    method: 'POST',
    invalidateQueries: [['help-types']],
    onSuccess: () => {
      setIsCreateOpen(false)
      createForm.reset()
    },
  })

  const createForm = useForm<HelpTypeFormData>({
    resolver: zodResolver(helpTypeSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  })

  const editForm = useForm<HelpTypeFormData>({
    resolver: zodResolver(helpTypeSchema),
    defaultValues: {
      name: editingHelpType?.name || '',
      description: editingHelpType?.description || '',
    },
  })

  const handleCreate = (data: HelpTypeFormData) => {
    createMutation.mutate(data)
  }

  const handleEdit = async (data: HelpTypeFormData) => {
    if (editingHelpType) {
      setIsUpdating(true)
      try {
        await patch<HelpType>(`/help-types/${editingHelpType.id}`, data)
        queryClient.invalidateQueries({ queryKey: ['help-types'] })
        setEditingHelpType(null)
        editForm.reset()
      } catch (error) {
        console.error('Ошибка при обновлении вида помощи:', error)
      } finally {
        setIsUpdating(false)
      }
    }
  }

  const handleDelete = async (helpType: HelpType) => {
    if (confirm(`Удалить вид помощи "${helpType.name}"?`)) {
      try {
        await del<void>(`/help-types/${helpType.id}`)
        queryClient.invalidateQueries({ queryKey: ['help-types'] })
      } catch (error) {
        console.error('Ошибка при удалении вида помощи:', error)
      }
    }
  }

  const handleEditClick = (helpType: HelpType) => {
    setEditingHelpType(helpType)
    editForm.reset({
      name: helpType.name,
      description: helpType.description || '',
    })
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-light">Виды помощи</h2>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Добавить вид помощи
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Создать вид помощи</DialogTitle>
              </DialogHeader>
              <Form {...createForm}>
                <form
                  onSubmit={createForm.handleSubmit(handleCreate)}
                  className="space-y-4"
                >
                  <FormField
                    control={createForm.control}
                    name="name"
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
                          <Textarea {...field} />
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
              placeholder="Поиск по названию или описанию..."
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
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredHelpTypes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    {helpTypes.length === 0
                      ? 'Нет видов помощи'
                      : 'Не найдено видов помощи по заданным фильтрам'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredHelpTypes.map((helpType) => (
                  <TableRow key={helpType.id}>
                    <TableCell>{helpType.id}</TableCell>
                    <TableCell>{helpType.name}</TableCell>
                    <TableCell>{helpType.description || '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClick(helpType)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(helpType)}
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
        <Dialog open={!!editingHelpType} onOpenChange={(open: boolean) => !open && setEditingHelpType(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Редактировать вид помощи</DialogTitle>
            </DialogHeader>
            <Form {...editForm}>
              <form
                onSubmit={editForm.handleSubmit(handleEdit)}
                className="space-y-4"
              >
                <FormField
                  control={editForm.control}
                  name="name"
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
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingHelpType(null)}
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


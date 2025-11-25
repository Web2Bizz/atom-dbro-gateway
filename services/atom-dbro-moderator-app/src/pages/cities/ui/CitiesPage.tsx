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
import type { City, CreateCityDto, Region } from '@shared/lib/api/types'
import { Plus, Pencil, Trash2, Search, X } from 'lucide-react'

const citySchema = z.object({
  name: z.string().min(1, 'Название обязательно'),
  regionId: z.number().min(1, 'Регион обязателен'),
})

type CityFormData = z.infer<typeof citySchema>

export const CitiesPage = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingCity, setEditingCity] = useState<City | null>(null)
  const [selectedRegionId, setSelectedRegionId] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const queryClient = useQueryClient()

  const { data: regions = [] } = useApiQuery<Region[]>(['regions'], '/regions')

  const citiesQueryKey = selectedRegionId
    ? ['cities', selectedRegionId.toString()]
    : ['cities']
  const citiesEndpoint = selectedRegionId
    ? `/cities?regionId=${selectedRegionId}`
    : '/cities'

  const { data: cities = [], isLoading } = useApiQuery<City[]>(
    citiesQueryKey,
    citiesEndpoint
  )

  // Фильтрация городов по поисковому запросу
  const filteredCities = useMemo(() => {
    if (!searchQuery) return cities
    const query = searchQuery.toLowerCase()
    return cities.filter((city) =>
      city.name?.toLowerCase().includes(query)
    )
  }, [cities, searchQuery])

  const createMutation = useApiMutation<City, CreateCityDto>({
    endpoint: '/cities',
    method: 'POST',
    invalidateQueries: [['cities']],
    onSuccess: () => {
      setIsCreateOpen(false)
      createForm.reset()
    },
  })

  const createForm = useForm<CityFormData>({
    resolver: zodResolver(citySchema),
    defaultValues: {
      name: '',
      regionId: undefined,
    },
  })

  const editForm = useForm<CityFormData>({
    resolver: zodResolver(citySchema),
    defaultValues: {
      name: editingCity?.name || '',
      regionId: editingCity?.regionId || undefined,
    },
  })

  const handleCreate = (data: CityFormData) => {
    createMutation.mutate(data)
  }

  const handleEdit = async (data: CityFormData) => {
    if (editingCity) {
      setIsUpdating(true)
      try {
        await patch<City>(`/cities/${editingCity.id}`, data)
        queryClient.invalidateQueries({ queryKey: ['cities'] })
        setEditingCity(null)
        editForm.reset()
      } catch (error) {
        console.error('Ошибка при обновлении города:', error)
      } finally {
        setIsUpdating(false)
      }
    }
  }

  const handleDelete = async (city: City) => {
    if (confirm(`Удалить город "${city.name}"?`)) {
      try {
        await del<void>(`/cities/${city.id}`)
        queryClient.invalidateQueries({ queryKey: ['cities'] })
      } catch (error) {
        console.error('Ошибка при удалении города:', error)
      }
    }
  }

  const handleEditClick = (city: City) => {
    setEditingCity(city)
    editForm.reset({ name: city.name, regionId: city.regionId })
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-light">Города</h2>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Добавить город
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Создать город</DialogTitle>
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
                    name="regionId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Регион</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(Number(value))}
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Выберите регион" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {regions.map((region) => (
                              <SelectItem key={region.id} value={region.id.toString()}>
                                {region.name}
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
        <div className="flex flex-wrap items-center gap-4 p-4 border rounded-lg bg-card">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по названию города..."
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
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground whitespace-nowrap">Фильтр по региону:</label>
            <Select
              value={selectedRegionId?.toString() || 'all'}
              onValueChange={(value) =>
                setSelectedRegionId(value === 'all' ? null : Number(value))
              }
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Все регионы" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все регионы</SelectItem>
                {regions.map((region) => (
                  <SelectItem key={region.id} value={region.id.toString()}>
                    {region.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {(searchQuery || selectedRegionId !== null) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery('')
                setSelectedRegionId(null)
              }}
            >
              <X className="h-4 w-4 mr-2" />
              Сбросить
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="text-muted-foreground">Загрузка...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Название</TableHead>
                <TableHead>Регион</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCities.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    {cities.length === 0
                      ? 'Нет городов'
                      : 'Не найдено городов по заданным фильтрам'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredCities.map((city) => (
                  <TableRow key={city.id}>
                    <TableCell>{city.id}</TableCell>
                    <TableCell>{city.name}</TableCell>
                    <TableCell>
                      {city.region?.name || regions.find((r) => r.id === city.regionId)?.name || city.regionId}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClick(city)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(city)}
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
        <Dialog open={!!editingCity} onOpenChange={(open: boolean) => !open && setEditingCity(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Редактировать город</DialogTitle>
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
                  name="regionId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Регион</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(Number(value))}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите регион" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {regions.map((region) => (
                            <SelectItem key={region.id} value={region.id.toString()}>
                              {region.name}
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
                    onClick={() => setEditingCity(null)}
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


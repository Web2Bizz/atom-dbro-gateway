import { useState, useEffect, useMemo } from "react";
import { useApiQuery, useApiMutation, useToast } from "@shared/lib/hooks";
import { patch, del } from "@shared/lib/api/client";
import { useQueryClient } from "@tanstack/react-query";
import { Layout } from "@widgets/layout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/ui/table";
import { Button } from "@shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@shared/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@shared/ui/form";
import { Input } from "@shared/ui/input";
import { Textarea } from "@shared/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import type {
  Organization,
  CreateOrganizationDto,
  City,
  OrganizationType,
} from "@shared/lib/api/types";
import { Plus, Pencil, Trash2, Search, X } from "lucide-react";

const organizationSchema = z.object({
  name: z.string().min(1, "Название обязательно"),
  organizationTypeId: z.number().min(1, "Тип организации обязателен"),
  cityId: z.number().min(1, "Город обязателен"),
  address: z.string().optional(),
  summary: z.string().optional(),
  description: z.string().optional(),
});

type OrganizationFormData = z.infer<typeof organizationSchema>;

export const OrganizationsPage = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingOrganization, setEditingOrganization] =
    useState<Organization | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTypeId, setFilterTypeId] = useState<number | null>(null);
  const [filterCityId, setFilterCityId] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: cities = [] } = useApiQuery<City[]>(["cities"], "/cities");
  const { 
    data: organizationTypesRaw, 
    isLoading: isLoadingTypes,
    error: organizationTypesError 
  } = useApiQuery<OrganizationType[] | { type: OrganizationType[] } | { data: OrganizationType[] }>(
    ["organization-types"], 
    "/organization-types"
  );

  // Обрабатываем разные форматы ответа API
  // API может возвращать либо массив напрямую, либо объект с полем type, data, organizationTypes, или types
  const organizationTypes = useMemo(() => {
    if (!organizationTypesRaw) return [];
    
    // Если это массив - возвращаем как есть
    if (Array.isArray(organizationTypesRaw)) {
      return organizationTypesRaw;
    }
    
    // Если это объект, проверяем различные возможные поля
    if (typeof organizationTypesRaw === "object" && organizationTypesRaw !== null) {
      const obj = organizationTypesRaw as Record<string, unknown>;
      
      // Проверяем поле type
      if ("type" in obj && Array.isArray(obj.type)) {
        return obj.type as OrganizationType[];
      }
      
      // Проверяем поле data
      if ("data" in obj && Array.isArray(obj.data)) {
        return obj.data as OrganizationType[];
      }
      
      // Проверяем поле organizationTypes
      if ("organizationTypes" in obj && Array.isArray(obj.organizationTypes)) {
        return obj.organizationTypes as OrganizationType[];
      }
      
      // Проверяем поле types
      if ("types" in obj && Array.isArray(obj.types)) {
        return obj.types as OrganizationType[];
      }
    }
    
    return [];
  }, [organizationTypesRaw]);

  const { data: organizations = [], isLoading } = useApiQuery<Organization[]>(
    ["organizations"],
    "/organizations"
  );

  // Фильтрация организаций
  const filteredOrganizations = useMemo(() => {
    return organizations.filter((org) => {
      // Фильтр по поисковому запросу (название, адрес)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          org.name?.toLowerCase().includes(query) ||
          org.address?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Фильтр по типу организации
      if (filterTypeId !== null) {
        const orgTypeId =
          org.organizationTypeId ||
          org.organizationType?.id ||
          org.type?.id;
        if (orgTypeId !== filterTypeId) return false;
      }

      // Фильтр по городу
      if (filterCityId !== null) {
        const orgCityId = org.cityId || org.city?.id;
        if (orgCityId !== filterCityId) return false;
      }

      return true;
    });
  }, [organizations, searchQuery, filterTypeId, filterCityId]);

  const createMutation = useApiMutation<Organization, CreateOrganizationDto>({
    endpoint: "/organizations",
    method: "POST",
    invalidateQueries: [["organizations"]],
    onSuccess: () => {
      setIsCreateOpen(false);
      createForm.reset();
      toast({
        title: "Успешно",
        description: "Организация успешно создана",
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось создать организацию",
        variant: "destructive",
      });
    },
  });

  const createForm = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: "",
      organizationTypeId: undefined,
      cityId: undefined,
      address: "",
      summary: "",
      description: "",
    },
  });

  const editForm = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: "",
      organizationTypeId: undefined,
      cityId: undefined,
      address: "",
      summary: "",
      description: "",
    },
  });

  useEffect(() => {
    console.log(
      "[OrganizationsPage] Raw organizationTypesRaw:",
      organizationTypesRaw
    );
    console.log(
      "[OrganizationsPage] Processed organizationTypes:",
      organizationTypes
    );
    console.log(
      "[OrganizationsPage] isLoadingTypes:",
      isLoadingTypes
    );
    console.log(
      "[OrganizationsPage] organizationTypesError:",
      organizationTypesError
    );
    if (organizationTypesError) {
      console.error(
        "[OrganizationsPage] Error loading organization types:",
        organizationTypesError
      );
    }
    if (organizationTypes.length > 0) {
      console.log(
        "[OrganizationsPage] Organization types structure:",
        JSON.stringify(organizationTypes, null, 2)
      );
    } else if (!isLoadingTypes && !organizationTypesError) {
      console.warn(
        "[OrganizationsPage] Organization types is empty but no error. Raw data:",
        organizationTypesRaw
      );
    }
  }, [organizationTypesRaw, organizationTypes, isLoadingTypes, organizationTypesError]);

  useEffect(() => {
    if (editingOrganization) {
      const formData = {
        name: editingOrganization.name || "",
        organizationTypeId:
          editingOrganization.type?.id ||
          editingOrganization.organizationType?.id ||
          editingOrganization.organizationTypeId,
        cityId:
          editingOrganization.city?.id ||
          editingOrganization.cityId,
        address: editingOrganization.address || "",
        summary: editingOrganization.summary || "",
        description: editingOrganization.description || "",
      };

      editForm.reset(formData);
    } else {
      editForm.reset({
        name: "",
        organizationTypeId: undefined,
        cityId: undefined,
        address: "",
        summary: "",
        description: "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingOrganization, organizationTypes, cities]);

  const handleCreate = (data: OrganizationFormData) => {
    // Убеждаемся, что organizationTypeId и cityId являются числами
    const createData: CreateOrganizationDto = {
      name: data.name,
      organizationTypeId: Number(data.organizationTypeId),
      cityId: Number(data.cityId),
      address: data.address || undefined,
      summary: data.summary || undefined,
      description: data.description || undefined,
    };
    
    // Валидация перед отправкой
    if (!createData.organizationTypeId || isNaN(createData.organizationTypeId)) {
      toast({
        title: "Ошибка",
        description: "Необходимо выбрать тип организации",
        variant: "destructive",
      });
      return;
    }
    
    if (!createData.cityId || isNaN(createData.cityId)) {
      toast({
        title: "Ошибка",
        description: "Необходимо выбрать город",
        variant: "destructive",
      });
      return;
    }
    
    createMutation.mutate(createData);
  };

  const handleEdit = async (data: OrganizationFormData) => {
    if (editingOrganization) {
      setIsUpdating(true);
      try {
        // Убеждаемся, что organizationTypeId и cityId являются числами
        const updateData = {
          name: data.name,
          organizationTypeId: Number(data.organizationTypeId),
          cityId: Number(data.cityId),
          address: data.address || undefined,
          summary: data.summary || undefined,
          description: data.description || undefined,
        };
        
        // Валидация перед отправкой
        if (!updateData.organizationTypeId || isNaN(updateData.organizationTypeId)) {
          toast({
            title: "Ошибка",
            description: "Необходимо выбрать тип организации",
            variant: "destructive",
          });
          setIsUpdating(false);
          return;
        }
        
        if (!updateData.cityId || isNaN(updateData.cityId)) {
          toast({
            title: "Ошибка",
            description: "Необходимо выбрать город",
            variant: "destructive",
          });
          setIsUpdating(false);
          return;
        }

        await patch<Organization>(
          `/organizations/${editingOrganization.id}`,
          updateData
        );
        queryClient.invalidateQueries({ queryKey: ["organizations"] });
        setEditingOrganization(null);
        editForm.reset();
        toast({
          title: "Успешно",
          description: "Организация успешно обновлена",
        });
      } catch (error: unknown) {
        const apiError = error as { message?: string };

        toast({
          title: "Ошибка",
          description: apiError.message || "Не удалось обновить организацию",
          variant: "destructive",
        });
      } finally {
        setIsUpdating(false);
      }
    }
  };

  const handleDelete = async (organization: Organization) => {
    if (confirm(`Удалить организацию "${organization.name}"?`)) {
      try {
        await del<void>(`/organizations/${organization.id}`);
        queryClient.invalidateQueries({ queryKey: ["organizations"] });
        toast({
          title: "Успешно",
          description: "Организация успешно удалена",
        });
      } catch (error: unknown) {
        const apiError = error as { message?: string };
        toast({
          title: "Ошибка",
          description: apiError.message || "Не удалось удалить организацию",
          variant: "destructive",
        });
      }
    }
  };

  const handleEditClick = (organization: Organization) => {
    setEditingOrganization(organization);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-light">Организации</h2>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Добавить организацию
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Создать организацию</DialogTitle>
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
                    name="organizationTypeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Тип организации</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            const numValue = Number(value);
                            if (!isNaN(numValue) && numValue > 0) {
                              field.onChange(numValue);
                            }
                          }}
                          value={field.value && field.value > 0 ? field.value.toString() : undefined}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Выберите тип организации" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {isLoadingTypes ? (
                              <div className="py-6 text-center text-sm text-muted-foreground">
                                Загрузка...
                              </div>
                            ) : organizationTypesError ? (
                              <div className="py-6 text-center text-sm text-destructive">
                                Ошибка загрузки типов организаций
                              </div>
                            ) : organizationTypes.length === 0 ? (
                              <div className="py-6 text-center text-sm text-muted-foreground">
                                Нет доступных типов
                              </div>
                            ) : (
                              organizationTypes.map((type) => (
                                <SelectItem
                                  key={type.id}
                                  value={type.id.toString()}
                                >
                                  {type.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="cityId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Город</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            const numValue = Number(value);
                            if (!isNaN(numValue) && numValue > 0) {
                              field.onChange(numValue);
                            }
                          }}
                          value={field.value && field.value > 0 ? field.value.toString() : undefined}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Выберите город" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {cities.map((city) => (
                              <SelectItem
                                key={city.id}
                                value={city.id.toString()}
                              >
                                {city.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Адрес</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="summary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Краткое описание</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
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
                    <Button type="submit" disabled={createMutation.isPending}>
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
              placeholder="Поиск по названию или адресу..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>
          <Select
            value={filterTypeId?.toString() || "all"}
            onValueChange={(value) =>
              setFilterTypeId(value === "all" ? null : Number(value))
            }
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Все типы" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все типы организаций</SelectItem>
              {organizationTypes.map((type) => (
                <SelectItem key={type.id} value={type.id.toString()}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filterCityId?.toString() || "all"}
            onValueChange={(value) =>
              setFilterCityId(value === "all" ? null : Number(value))
            }
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Все города" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все города</SelectItem>
              {cities.map((city) => (
                <SelectItem key={city.id} value={city.id.toString()}>
                  {city.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(searchQuery || filterTypeId !== null || filterCityId !== null) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setFilterTypeId(null);
                setFilterCityId(null);
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
                <TableHead>Тип организации</TableHead>
                <TableHead>Город</TableHead>
                <TableHead>Адрес</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrganizations.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground"
                  >
                    {organizations.length === 0
                      ? "Нет организаций"
                      : "Не найдено организаций по заданным фильтрам"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrganizations.map((organization) => (
                  <TableRow key={organization.id}>
                    <TableCell>{organization.id}</TableCell>
                    <TableCell>{organization.name || "-"}</TableCell>
                    <TableCell>
                      {organization.type?.name ||
                        organization.organizationType?.name ||
                        (organization.organizationTypeId &&
                          organizationTypes.find(
                            (t) => t.id === organization.organizationTypeId
                          )?.name) ||
                        "-"}
                    </TableCell>
                    <TableCell>
                      {organization.city?.name ||
                        (organization.cityId &&
                          cities.find((c) => c.id === organization.cityId)
                            ?.name) ||
                        "-"}
                    </TableCell>
                    <TableCell>{organization.address || "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClick(organization)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(organization)}
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
        <Dialog
          open={!!editingOrganization}
          onOpenChange={(open: boolean) =>
            !open && setEditingOrganization(null)
          }
        >
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Редактировать организацию</DialogTitle>
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
                  name="organizationTypeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Тип организации</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          const numValue = Number(value);
                          if (!isNaN(numValue) && numValue > 0) {
                            field.onChange(numValue);
                          }
                        }}
                        value={field.value && field.value > 0 ? field.value.toString() : undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите тип организации" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isLoadingTypes ? (
                            <div className="py-6 text-center text-sm text-muted-foreground">
                              Загрузка...
                            </div>
                          ) : organizationTypesError ? (
                            <div className="py-6 text-center text-sm text-destructive">
                              Ошибка загрузки типов организаций
                            </div>
                          ) : organizationTypes.length === 0 ? (
                            <div className="py-6 text-center text-sm text-muted-foreground">
                              Нет доступных типов
                            </div>
                          ) : (
                            organizationTypes.map((type) => (
                              <SelectItem
                                key={type.id}
                                value={type.id.toString()}
                              >
                                {type.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="cityId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Город</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          const numValue = Number(value);
                          if (!isNaN(numValue) && numValue > 0) {
                            field.onChange(numValue);
                          }
                        }}
                        value={field.value && field.value > 0 ? field.value.toString() : undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите город" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {cities.map((city) => (
                            <SelectItem
                              key={city.id}
                              value={city.id.toString()}
                            >
                              {city.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Адрес</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="summary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Краткое описание</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
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
                    onClick={() => setEditingOrganization(null)}
                  >
                    Отмена
                  </Button>
                  <Button type="submit" disabled={isUpdating}>
                    {isUpdating ? "Сохранение..." : "Сохранить"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

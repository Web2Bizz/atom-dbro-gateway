/**
 * Типы для работы с API
 */

export interface ApiError {
  status: number
  message: string
  errors?: Record<string, string[]>
}

export interface ApiResponse<T> {
  data: T
  message?: string
}

export type RequestConfig = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  headers?: Record<string, string>
  body?: unknown
  signal?: AbortSignal
}

// ==================== Регионы ====================

export interface Region {
  id: number
  name: string
  createdAt?: string
  updatedAt?: string
}

export interface CreateRegionDto {
  name: string
}

export interface UpdateRegionDto {
  name?: string
}

// ==================== Города ====================

export interface City {
  id: number
  name: string
  regionId: number
  region?: Region
  createdAt?: string
  updatedAt?: string
}

export interface CreateCityDto {
  name: string
  regionId: number
}

export interface UpdateCityDto {
  name?: string
  regionId?: number
}

// ==================== Пользователи ====================

export interface User {
  id: number
  firstName: string
  lastName: string
  middleName?: string
  email: string
  role?: string
  experience?: number
  avatarUrls?: Record<number, string>
  createdAt?: string
  updatedAt?: string
}

export interface CreateUserDto {
  firstName: string
  lastName: string
  middleName?: string
  email: string
  password: string
}

export interface UpdateUserDto {
  firstName?: string
  lastName?: string
  middleName?: string
  email?: string
  password?: string
}

// ==================== Виды помощи ====================

export interface HelpType {
  id: number
  name: string
  description?: string
  createdAt?: string
  updatedAt?: string
}

export interface CreateHelpTypeDto {
  name: string
  description?: string
}

export interface UpdateHelpTypeDto {
  name?: string
  description?: string
}

// ==================== Организации ====================

export interface OrganizationType {
  id: number
  name: string
  createdAt?: string
  updatedAt?: string
}

export interface ContactDto {
  name: string
  value: string
}

export interface Organization {
  id: number
  name: string
  organizationTypeId?: number
  organizationType?: {
    id: number
    name: string
  }
  type?: {
    id: number
    name: string
  }
  cityId?: number
  city?: City
  latitude?: number
  longitude?: number
  summary?: string
  mission?: string
  description?: string
  goals?: string[]
  needs?: string[]
  address?: string
  contacts?: ContactDto[]
  gallery?: string[]
  createdAt?: string
  updatedAt?: string
  helpTypes?: {
    id: number
    name: string
  }[]
}

export interface CreateOrganizationDto {
  name: string
  organizationTypeId: number
  cityId: number
  latitude?: number
  longitude?: number
  summary?: string
  mission?: string
  description?: string
  goals?: string[]
  needs?: string[]
  address?: string
  contacts?: ContactDto[]
  gallery?: string[]
}

export interface UpdateOrganizationDto {
  name?: string
  organizationTypeId?: number
  cityId?: number
  latitude?: number
  longitude?: number
  summary?: string
  mission?: string
  description?: string
  goals?: string[]
  needs?: string[]
  address?: string
  contacts?: ContactDto[]
  gallery?: string[]
}

// ==================== Квесты ====================

export interface StepDto {
  title: string
  description?: string
  status: string
  progress: number
  requirement?: Record<string, unknown>
  deadline?: string
}

export interface Quest {
  id: number
  title: string
  description?: string
  status: 'active' | 'completed' | 'archived'
  experienceReward: number
  achievementId?: number
  achievement?: Achievement
  cityId?: number
  city?: City
  coverImage?: string
  gallery?: string[]
  steps?: StepDto[]
  helpTypes?: HelpType[]
  createdAt?: string
  updatedAt?: string
}

export interface CreateQuestDto {
  title: string
  description?: string
  status?: 'active' | 'completed' | 'archived'
  experienceReward: number
  achievement?: {
    title: string
    description?: string
    icon?: string
  }
  cityId?: number
  coverImage?: string
  gallery?: string[]
  steps?: StepDto[]
  helpTypeIds?: number[]
}

export interface UpdateQuestDto {
  title?: string
  description?: string
  status?: 'active' | 'completed' | 'archived'
  experienceReward?: number
  achievementId?: number
  cityId?: number
  coverImage?: string
  gallery?: string[]
  steps?: string[]
  helpTypeIds?: number[]
}

// ==================== Достижения ====================

export interface Achievement {
  id: number
  title: string
  description?: string
  icon?: string
  rarity: 'common' | 'epic' | 'rare' | 'legendary' | 'private'
  createdAt?: string
  updatedAt?: string
}

export interface CreateAchievementDto {
  title: string
  description?: string
  icon?: string
  rarity: 'common' | 'epic' | 'rare' | 'legendary' | 'private'
}

export interface UpdateAchievementDto {
  title?: string
  description?: string
  icon?: string
  rarity?: 'common' | 'epic' | 'rare' | 'legendary' | 'private'
}

// ==================== Аутентификация ====================

export interface LoginDto {
  email: string
  password: string
}

export interface RegisterDto {
  firstName: string
  lastName: string
  middleName?: string
  email: string
  password: string
  confirmPassword: string
}

export interface AuthResponse {
  access_token?: string
  token?: string
  user?: User
}

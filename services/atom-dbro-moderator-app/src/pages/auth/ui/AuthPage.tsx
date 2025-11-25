import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useNavigate } from 'react-router-dom'
import { useApiMutation } from '@shared/lib/hooks'
import { useSession } from '@app/providers'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@shared/ui/form'
import { Input } from '@shared/ui/input'
import { Button } from '@shared/ui/button'

const authSchema = z.object({
  email: z
    .string()
    .min(1, 'Email обязателен')
    .email('Некорректный email'),
  password: z
    .string()
    .min(1, 'Пароль обязателен')
    .min(6, 'Минимум 6 символов'),
})

type AuthFormData = z.infer<typeof authSchema>

export const AuthPage = () => {
  const navigate = useNavigate()
  const { setSession } = useSession()
  
  const form = useForm<AuthFormData>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const mutation = useApiMutation<{ access_token: string; token?: string; user?: unknown }, AuthFormData>({
    endpoint: '/auth/login',
    method: 'POST',
    onSuccess: (data) => {
      console.log('[AuthPage] Login success, received data:', data)
      // API возвращает токен в поле access_token или token
      const token = data.access_token || data.token
      if (!token) {
        console.error('[AuthPage] No token in response data!', data)
        return
      }
      // Сохраняем сессию
      const sessionData = {
        token,
        user: data.user as { id: string; email: string } | undefined,
      }
      console.log('[AuthPage] Setting session:', { hasToken: !!sessionData.token, hasUser: !!sessionData.user })
      setSession(sessionData)
      // Небольшая задержка перед редиректом, чтобы сессия успела сохраниться
      setTimeout(() => {
        navigate('/dashboard')
      }, 100)
    },
    onError: (error) => {
      console.error('Auth error:', error)
    },
  })

  const onSubmit = (data: AuthFormData) => {
    mutation.mutate(data)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-light tracking-tight text-foreground">
            Вход
          </h1>
          <p className="text-sm text-muted-foreground">
            Войдите в свой аккаунт
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="sr-only">Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="sr-only">Пароль</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Пароль"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            {mutation.isError && (
              <div className="text-xs text-destructive text-center">
                {mutation.error?.message || 'Ошибка авторизации'}
              </div>
            )}

            <Button
              type="submit"
              disabled={form.formState.isSubmitting || mutation.isPending}
              className="w-full"
            >
              {form.formState.isSubmitting || mutation.isPending
                ? 'Вход...'
                : 'Войти'}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  )
}

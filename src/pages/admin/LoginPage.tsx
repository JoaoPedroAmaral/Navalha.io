import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { Scissors } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/stores/authStore'
import { login } from '@/api/auth'
import { toast } from '@/hooks/useToast'

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const navigate = useNavigate()
  const setTokens = useAuthStore((s) => s.setTokens)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  async function onSubmit(data: LoginForm) {
    try {
      const tokens = await login(data.email, data.password)
      setTokens(tokens.accessToken, tokens.refreshToken)
      navigate('/admin/dashboard')
    } catch {
      toast({
        variant: 'destructive',
        title: 'Erro ao entrar',
        description: 'E-mail ou senha incorretos.',
      })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-sidebar to-gray-800 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center mb-5 shadow-lg shadow-gold/10">
            <Scissors className="w-8 h-8 text-gold" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Navalha.io</h1>
          <p className="text-sm text-white/50 mt-1.5">Sistema de gestão para barbearias</p>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-7 shadow-2xl">
          <p className="text-white/70 text-sm font-medium mb-5">Acesse sua conta</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-white/80 text-sm">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                autoComplete="email"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-gold focus:ring-gold/30"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-xs text-red-400">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-white/80 text-sm">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-gold focus:ring-gold/30"
                {...register('password')}
              />
              {errors.password && (
                <p className="text-xs text-red-400">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full mt-2 bg-gold text-white hover:bg-gold/90 font-semibold h-11 text-sm shadow-lg shadow-gold/20"
              loading={isSubmitting}
            >
              Entrar
            </Button>
          </form>
        </div>

        <p className="text-center text-white/30 text-xs mt-6">
          © {new Date().getFullYear()} Navalha.io. Todos os direitos reservados.
        </p>
      </div>
    </div>
  )
}

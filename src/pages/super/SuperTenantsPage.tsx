import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Building2, Copy, Check, ToggleLeft, ToggleRight } from 'lucide-react'
import { createTenant, setSubscription } from '@/api/super'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/hooks/useToast'

const tenantSchema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  slug: z
    .string()
    .min(2, 'Slug obrigatório')
    .regex(/^[a-z0-9-]+$/, 'Apenas letras minúsculas, números e hífens'),
  ownerEmail: z.string().email('E-mail inválido'),
})
type TenantForm = z.infer<typeof tenantSchema>

export default function SuperTenantsPage() {
  const [tempPassword, setTempPassword] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [subscriptionTenantId, setSubscriptionTenantId] = useState('')
  const [subscriptionLoading, setSubscriptionLoading] = useState<'activate' | 'deactivate' | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TenantForm>({ resolver: zodResolver(tenantSchema) })

  async function onSubmit(data: TenantForm) {
    try {
      const result = await createTenant(data)
      setTempPassword(result.temporaryPassword)
      reset()
      toast({ variant: 'success', title: 'Barbearia criada com sucesso' })
    } catch {
      toast({ variant: 'destructive', title: 'Erro ao criar barbearia' })
    }
  }

  async function handleSetSubscription(active: boolean) {
    const id = subscriptionTenantId.trim()
    if (!id) {
      toast({ variant: 'destructive', title: 'Informe o ID do tenant' })
      return
    }
    setSubscriptionLoading(active ? 'activate' : 'deactivate')
    try {
      await setSubscription(id, active)
      toast({
        variant: 'success',
        title: active ? 'Assinatura ativada' : 'Assinatura desativada',
      })
      setSubscriptionTenantId('')
    } catch {
      toast({ variant: 'destructive', title: 'Erro ao atualizar assinatura' })
    } finally {
      setSubscriptionLoading(null)
    }
  }

  function copyPassword() {
    if (!tempPassword) return
    void navigator.clipboard.writeText(tempPassword)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-sidebar flex items-center justify-center">
            <Building2 className="w-5 h-5 text-gold" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Super Admin</h1>
            <p className="text-sm text-gray-500">Cadastrar nova barbearia</p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white rounded-xl border shadow-sm p-6 space-y-4"
        >
          <div className="space-y-1.5">
            <Label>Nome da barbearia</Label>
            <Input placeholder="Barbearia do João" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Slug (URL)</Label>
            <div className="flex items-center gap-1.5">
              <span className="text-sm text-gray-400 whitespace-nowrap">barberapp.com/</span>
              <Input placeholder="barbearia-joao" {...register('slug')} />
            </div>
            {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>E-mail do proprietário</Label>
            <Input type="email" placeholder="dono@barbearia.com" {...register('ownerEmail')} />
            {errors.ownerEmail && (
              <p className="text-xs text-destructive">{errors.ownerEmail.message}</p>
            )}
          </div>

          <Button type="submit" variant="gold" className="w-full" loading={isSubmitting}>
            Criar barbearia
          </Button>
        </form>

        <Separator className="my-6" />

        {/* Subscription control */}
        <div className="bg-white rounded-xl border shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <ToggleRight className="w-4 h-4 text-gold" />
            <h2 className="font-semibold text-gray-900 text-sm">Controle de assinatura</h2>
          </div>
          <p className="text-xs text-gray-500">
            Ativa ou desativa manualmente a assinatura de um tenant pelo ID.
          </p>

          <div className="space-y-1.5">
            <Label>ID do tenant</Label>
            <Input
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              value={subscriptionTenantId}
              onChange={(e) => setSubscriptionTenantId(e.target.value)}
              className="font-mono text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="border-green-200 text-green-700 hover:bg-green-50"
              loading={subscriptionLoading === 'activate'}
              disabled={subscriptionLoading !== null}
              onClick={() => handleSetSubscription(true)}
            >
              <ToggleRight className="w-4 h-4" />
              Ativar
            </Button>
            <Button
              variant="outline"
              className="border-red-200 text-red-700 hover:bg-red-50"
              loading={subscriptionLoading === 'deactivate'}
              disabled={subscriptionLoading !== null}
              onClick={() => handleSetSubscription(false)}
            >
              <ToggleLeft className="w-4 h-4" />
              Desativar
            </Button>
          </div>
        </div>
      </div>

      {/* Password modal */}
      <Dialog open={!!tempPassword} onOpenChange={() => setTempPassword(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Barbearia criada!</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              A barbearia foi cadastrada com sucesso. Compartilhe a senha temporária abaixo com o
              proprietário:
            </p>
            <div className="bg-gray-50 rounded-lg border p-4 flex items-center justify-between gap-3">
              <code className="text-sm font-mono text-gray-900 break-all">{tempPassword}</code>
              <button
                onClick={copyPassword}
                className="shrink-0 p-1.5 rounded hover:bg-gray-200 transition-colors"
                title="Copiar senha"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-500" />
                )}
              </button>
            </div>
            <p className="text-xs text-gray-400">
              O proprietário deverá alterar esta senha no primeiro acesso.
            </p>
            <Button
              variant="gold"
              className="w-full"
              onClick={() => setTempPassword(null)}
            >
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

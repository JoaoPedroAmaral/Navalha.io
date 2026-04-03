import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import { getServices, createService, updateService, deleteService } from '@/api/admin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { toast } from '@/hooks/useToast'
import { formatCurrency } from '@/lib/utils'
import type { Service } from '@/types'

const serviceSchema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  durationMinutes: z.number().min(5, 'Duração mínima de 5 minutos'),
  price: z.number().min(0, 'Preço inválido'),
})
type ServiceForm = z.infer<typeof serviceSchema>

export default function ServicesPage() {
  const qc = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editService, setEditService] = useState<Service | null>(null)

  const { data: services = [], isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: getServices,
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ServiceForm>({ resolver: zodResolver(serviceSchema) })

  function openCreate() {
    setEditService(null)
    reset({ name: '', durationMinutes: 30, price: 0 })
    setDialogOpen(true)
  }

  function openEdit(svc: Service) {
    setEditService(svc)
    reset({ name: svc.name, durationMinutes: svc.durationMinutes, price: svc.price })
    setDialogOpen(true)
  }

  const saveMutation = useMutation({
    mutationFn: (data: ServiceForm) => {
      if (editService) return updateService(editService.id, data)
      return createService(data)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['services'] })
      toast({ variant: 'success', title: editService ? 'Serviço atualizado' : 'Serviço criado' })
      setDialogOpen(false)
    },
    onError: () => toast({ variant: 'destructive', title: 'Erro ao salvar serviço' }),
  })

  const toggleMutation = useMutation({
    mutationFn: (svc: Service) => updateService(svc.id, { active: !svc.active }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['services'] })
    },
    onError: () => toast({ variant: 'destructive', title: 'Erro ao alterar status' }),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteService,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['services'] })
      toast({ variant: 'success', title: 'Serviço removido' })
    },
    onError: () => toast({ variant: 'destructive', title: 'Erro ao remover serviço' }),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Serviços</h1>
        <Button variant="gold" onClick={openCreate}>
          <Plus className="w-4 h-4" />
          Novo serviço
        </Button>
      </div>

      <div className="bg-white rounded-xl border">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Carregando...</div>
        ) : services.length === 0 ? (
          <div className="p-8 text-center text-gray-400">Nenhum serviço cadastrado</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Nome</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600 hidden sm:table-cell">Duração</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Preço</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-right px-5 py-3 font-medium text-gray-600">Ações</th>
                </tr>
              </thead>
              <tbody>
                {services.map((svc) => (
                  <tr key={svc.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-900">{svc.name}</td>
                    <td className="px-5 py-3 text-gray-600 hidden sm:table-cell">
                      {svc.durationMinutes} min
                    </td>
                    <td className="px-5 py-3 text-gray-600">{formatCurrency(svc.price)}</td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => toggleMutation.mutate(svc)}
                        className="flex items-center gap-1.5 text-sm"
                      >
                        {svc.active ? (
                          <>
                            <ToggleRight className="w-5 h-5 text-green-500" />
                            <span className="text-green-600">Ativo</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-5 h-5 text-gray-400" />
                            <span className="text-gray-400">Inativo</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(svc)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remover serviço</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja remover <strong>{svc.name}</strong>?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => deleteMutation.mutate(svc.id)}
                              >
                                Remover
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editService ? 'Editar serviço' : 'Novo serviço'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit((d: ServiceForm) => saveMutation.mutate(d))} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nome</Label>
              <Input placeholder="Ex: Corte de cabelo" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Duração (min)</Label>
                <Input type="number" placeholder="30" {...register('durationMinutes', { valueAsNumber: true })} />
                {errors.durationMinutes && (
                  <p className="text-xs text-destructive">{errors.durationMinutes.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Preço (R$)</Label>
                <Input type="number" step="0.01" placeholder="0,00" {...register('price', { valueAsNumber: true })} />
                {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" variant="gold" loading={isSubmitting}>
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

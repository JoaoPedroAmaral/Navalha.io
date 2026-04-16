import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Scissors } from 'lucide-react'
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

  const { data: services = [], isLoading } = useQuery<Service[]>({
    queryKey: ['services'],
    queryFn: ({ signal }) => getServices(signal),
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
    mutationFn: ({ data, isEdit }: { data: ServiceForm; isEdit: boolean; serviceId?: string }) => {
      if (isEdit && editService) return updateService(editService.id, data)
      return createService(data)
    },
    onSuccess: (_, variables) => {
      void qc.invalidateQueries({ queryKey: ['services'] })
      toast({ variant: 'success', title: variables.isEdit ? 'Serviço atualizado' : 'Serviço criado' })
      setDialogOpen(false)
    },
    onError: () => toast({ variant: 'destructive', title: 'Erro ao salvar serviço' }),
  })

  const toggleMutation = useMutation({
    mutationFn: (svc: Service) =>
      updateService(svc.id, {
        name: svc.name,
        durationMinutes: svc.durationMinutes,
        price: svc.price,
        active: !svc.active,
      }),
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
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Serviços</h1>
        <Button variant="gold" onClick={openCreate} className="shrink-0">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Novo serviço</span>
          <span className="sm:hidden">Novo</span>
        </Button>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="divide-y">
            {[1, 2, 3].map((i) => (
              <div key={i} className="px-4 py-3 flex items-center gap-4 animate-pulse sm:px-5">
                <div className="flex-1 space-y-2">
                  <div className="w-32 sm:w-40 h-4 bg-gray-200 rounded" />
                  <div className="w-20 sm:w-24 h-3 bg-gray-100 rounded" />
                </div>
                <div className="w-14 sm:w-16 h-6 bg-gray-200 rounded-full" />
              </div>
            ))}
          </div>
        ) : services.length === 0 ? (
          <div className="p-8 sm:p-12 text-center">
            <Scissors className="w-8 h-8 sm:w-10 sm:h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">Nenhum serviço cadastrado</p>
            <p className="text-gray-300 text-sm mt-1">Adicione seu primeiro serviço</p>
          </div>
        ) : (
          <div className="table-scroll-mobile">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50/80">
                  <th className="text-left px-3 py-2.5 sm:px-5 sm:py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Nome</th>
                  <th className="text-left px-3 py-2.5 sm:px-5 sm:py-3 font-medium text-gray-500 text-xs uppercase tracking-wide hidden sm:table-cell">Duração</th>
                  <th className="text-left px-3 py-2.5 sm:px-5 sm:py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Preço</th>
                  <th className="text-left px-3 py-2.5 sm:px-5 sm:py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Status</th>
                  <th className="text-right px-3 py-2.5 sm:px-5 sm:py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Ações</th>
                </tr>
              </thead>
              <tbody>
                {services.map((svc) => (
                  <tr key={svc.id} className="border-b last:border-0 md:hover:bg-gray-50/60 transition-colors">
                    <td className="px-3 py-2.5 sm:px-5 sm:py-3.5 font-semibold text-gray-900 text-sm" data-label="Nome">{svc.name}</td>
                    <td className="px-3 py-2.5 sm:px-5 sm:py-3.5 text-gray-500 hidden sm:table-cell text-sm" data-label="Duração">
                      {svc.durationMinutes} min
                    </td>
                    <td className="px-3 py-2.5 sm:px-5 sm:py-3.5 font-semibold text-gray-800 text-sm" data-label="Preço">{formatCurrency(svc.price)}</td>
                    <td className="px-3 py-2.5 sm:px-5 sm:py-3.5" data-label="Status">
                      <button
                        onClick={() => toggleMutation.mutate(svc)}
                        className="flex items-center gap-1.5 text-sm hover:opacity-80 transition-opacity"
                        title={svc.active ? 'Clique para desativar' : 'Clique para ativar'}
                      >
                        {svc.active ? (
                          <>
                            <ToggleRight className="w-5 h-5 text-emerald-500 shrink-0" />
                            <span className="text-emerald-600 font-medium">Ativo</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-5 h-5 text-gray-400 shrink-0" />
                            <span className="text-gray-400">Inativo</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-3 py-2.5 sm:px-5 sm:py-3.5" data-label="Ações">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(svc)} title="Editar">
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
          <form onSubmit={handleSubmit((d: ServiceForm) => saveMutation.mutate({ data: d, isEdit: !!editService }))} className="space-y-4">
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

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { getBarbers, createBarber, updateBarber, deleteBarber, getServices } from '@/api/admin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { PhoneInput } from '@/components/ui/phone-input'
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
import { formatPhone } from '@/lib/utils'
import type { Barber } from '@/types'

const barberSchema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  phone: z.string().min(8, 'Telefone obrigatório'),
})
type BarberForm = z.infer<typeof barberSchema>

export default function BarbersPage() {
  const qc = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editBarber, setEditBarber] = useState<Barber | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const { data: barbers = [], isLoading } = useQuery({
    queryKey: ['barbers'],
    queryFn: getBarbers,
  })
  const { data: allServices = [] } = useQuery({
    queryKey: ['services'],
    queryFn: getServices,
  })

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BarberForm>({ resolver: zodResolver(barberSchema) })

  function openCreate() {
    setEditBarber(null)
    reset({ name: '', phone: '' })
    setDialogOpen(true)
  }

  function openEdit(barber: Barber) {
    setEditBarber(barber)
    reset({ name: barber.name, phone: barber.phone })
    setDialogOpen(true)
  }

  const saveMutation = useMutation({
    mutationFn: (data: BarberForm) => {
      if (editBarber) {
        return updateBarber(editBarber.id, {
          ...data,
          serviceIds: editBarber.services.map((s) => s.id),
        })
      }
      return createBarber(data)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['barbers'] })
      toast({ variant: 'success', title: editBarber ? 'Barbeiro atualizado' : 'Barbeiro criado' })
      setDialogOpen(false)
    },
    onError: () => toast({ variant: 'destructive', title: 'Erro ao salvar barbeiro' }),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteBarber,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['barbers'] })
      toast({ variant: 'success', title: 'Barbeiro removido' })
    },
    onError: () => toast({ variant: 'destructive', title: 'Erro ao remover barbeiro' }),
  })

  const serviceToggleMutation = useMutation({
    mutationFn: ({
      barberId,
      name,
      phone,
      serviceIds,
    }: {
      barberId: string
      name: string
      phone: string
      serviceIds: string[]
    }) => updateBarber(barberId, { name, phone, serviceIds }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['barbers'] })
    },
    onError: () => toast({ variant: 'destructive', title: 'Erro ao atualizar serviços' }),
  })

  function toggleService(barber: Barber, serviceId: string) {
    const currentIds = barber.services.map((s) => s.id)
    const newIds = currentIds.includes(serviceId)
      ? currentIds.filter((id) => id !== serviceId)
      : [...currentIds, serviceId]
    serviceToggleMutation.mutate({ barberId: barber.id, name: barber.name, phone: barber.phone, serviceIds: newIds })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Barbeiros</h1>
        <Button variant="gold" onClick={openCreate}>
          <Plus className="w-4 h-4" />
          Novo barbeiro
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border p-5 flex items-center gap-4 animate-pulse">
              <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="w-32 h-4 bg-gray-200 rounded" />
                <div className="w-24 h-3 bg-gray-100 rounded" />
              </div>
              <div className="w-16 h-6 bg-gray-200 rounded-full" />
            </div>
          ))}
        </div>
      ) : barbers.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <Plus className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-gray-500 font-medium">Nenhum barbeiro cadastrado</p>
          <p className="text-gray-400 text-sm mt-1">Adicione seu primeiro barbeiro</p>
        </div>
      ) : (
        <div className="space-y-3">
          {barbers.map((barber) => (
            <div key={barber.id} className="bg-white rounded-xl border shadow-sm">
              <div className="flex items-center gap-4 p-5">
                <div className="w-10 h-10 rounded-full bg-sidebar flex items-center justify-center text-gold font-bold text-sm shrink-0">
                  {barber.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">{barber.name}</p>
                  <p className="text-sm text-gray-500">{formatPhone(barber.phone)}</p>
                </div>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    barber.active
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {barber.active ? 'Ativo' : 'Inativo'}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      setExpandedId(expandedId === barber.id ? null : barber.id)
                    }
                    title="Ver serviços"
                  >
                    {expandedId === barber.id ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => openEdit(barber)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remover barbeiro</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja remover <strong>{barber.name}</strong>? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={() => deleteMutation.mutate(barber.id)}
                        >
                          Remover
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

              {/* Services expandable */}
              {expandedId === barber.id && (
                <div className="border-t px-5 py-4">
                  <p className="text-sm font-medium text-gray-700 mb-3">Serviços oferecidos</p>
                  {allServices.length === 0 ? (
                    <p className="text-sm text-gray-400">Nenhum serviço cadastrado</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {allServices.map((service) => {
                        const checked = barber.services.some((s) => s.id === service.id)
                        return (
                          <label
                            key={service.id}
                            className="flex items-center gap-2.5 cursor-pointer"
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={() => toggleService(barber, service.id)}
                            />
                            <span className="text-sm text-gray-700">{service.name}</span>
                          </label>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editBarber ? 'Editar barbeiro' : 'Novo barbeiro'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit((d) => saveMutation.mutate(d))} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nome</Label>
              <Input placeholder="Nome do barbeiro" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Telefone</Label>
              <Controller
                control={control}
                name="phone"
                render={({ field }) => (
                  <PhoneInput
                    placeholder="(11) 99999-9999"
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    name={field.name}
                  />
                )}
              />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
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

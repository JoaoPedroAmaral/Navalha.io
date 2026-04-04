import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Package } from 'lucide-react'
import { getProducts, createProduct, updateProduct, deleteProduct } from '@/api/admin'
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
import type { Product } from '@/types'

const productSchema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  price: z.number().min(0, 'Preço inválido'),
  description: z.string().optional(),
})
type ProductForm = z.infer<typeof productSchema>

export default function ProductsPage() {
  const qc = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: getProducts,
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductForm>({ resolver: zodResolver(productSchema) })

  function openCreate() {
    setEditProduct(null)
    reset({ name: '', price: 0, description: '' })
    setDialogOpen(true)
  }

  function openEdit(product: Product) {
    setEditProduct(product)
    reset({ name: product.name, price: product.price, description: product.description ?? '' })
    setDialogOpen(true)
  }

  const saveMutation = useMutation({
    mutationFn: ({ data, isEdit }: { data: ProductForm; isEdit: boolean }) => {
      const payload = {
        name: data.name,
        price: data.price,
        description: data.description || undefined,
      }
      if (isEdit && editProduct) return updateProduct(editProduct.id, payload)
      return createProduct(payload)
    },
    onSuccess: (_, variables) => {
      void qc.invalidateQueries({ queryKey: ['products'] })
      toast({ variant: 'success', title: variables.isEdit ? 'Produto atualizado' : 'Produto criado' })
      setDialogOpen(false)
    },
    onError: () => toast({ variant: 'destructive', title: 'Erro ao salvar produto' }),
  })

  const toggleMutation = useMutation({
    mutationFn: (product: Product) =>
      updateProduct(product.id, { active: !product.active }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['products'] })
    },
    onError: () => toast({ variant: 'destructive', title: 'Erro ao alterar status' }),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['products'] })
      toast({ variant: 'success', title: 'Produto removido' })
    },
    onError: () => toast({ variant: 'destructive', title: 'Erro ao remover produto' }),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Produtos</h1>
        <Button variant="gold" onClick={openCreate} className="shrink-0">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Novo produto</span>
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
        ) : products.length === 0 ? (
          <div className="p-8 sm:p-12 text-center">
            <Package className="w-8 h-8 sm:w-10 sm:h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">Nenhum produto cadastrado</p>
            <p className="text-gray-300 text-sm mt-1">Adicione seu primeiro produto</p>
          </div>
        ) : (
          <div className="table-scroll-mobile">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50/80">
                  <th className="text-left px-3 py-2.5 sm:px-5 sm:py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Nome</th>
                  <th className="text-left px-3 py-2.5 sm:px-5 sm:py-3 font-medium text-gray-500 text-xs uppercase tracking-wide hidden sm:table-cell">Descrição</th>
                  <th className="text-left px-3 py-2.5 sm:px-5 sm:py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Preço</th>
                  <th className="text-left px-3 py-2.5 sm:px-5 sm:py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Status</th>
                  <th className="text-right px-3 py-2.5 sm:px-5 sm:py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Ações</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b last:border-0 md:hover:bg-gray-50/60 transition-colors">
                    <td className="px-3 py-2.5 sm:px-5 sm:py-3.5 font-semibold text-gray-900 text-sm">{product.name}</td>
                    <td className="px-3 py-2.5 sm:px-5 sm:py-3.5 text-gray-500 hidden sm:table-cell text-sm max-w-xs truncate">
                      {product.description || <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-3 py-2.5 sm:px-5 sm:py-3.5 font-semibold text-gray-800 text-sm">{formatCurrency(product.price)}</td>
                    <td className="px-3 py-2.5 sm:px-5 sm:py-3.5">
                      <button
                        onClick={() => toggleMutation.mutate(product)}
                        className="flex items-center gap-1.5 text-sm hover:opacity-80 transition-opacity"
                        title={product.active ? 'Clique para desativar' : 'Clique para ativar'}
                      >
                        {product.active ? (
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
                    <td className="px-3 py-2.5 sm:px-5 sm:py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(product)} title="Editar">
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
                              <AlertDialogTitle>Remover produto</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja remover <strong>{product.name}</strong>?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => deleteMutation.mutate(product.id)}
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
            <DialogTitle>{editProduct ? 'Editar produto' : 'Novo produto'}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={handleSubmit((d) => saveMutation.mutate({ data: d, isEdit: !!editProduct }))}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label>Nome</Label>
              <Input placeholder="Ex: Pomada modeladora" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Descrição <span className="text-gray-400 font-normal">(opcional)</span></Label>
              <Input placeholder="Ex: 150g, fixação forte" {...register('description')} />
            </div>
            <div className="space-y-1.5">
              <Label>Preço (R$)</Label>
              <Input type="number" step="0.01" placeholder="0,00" {...register('price', { valueAsNumber: true })} />
              {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
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

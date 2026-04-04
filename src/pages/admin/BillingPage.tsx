import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { format, parseISO, differenceInDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CreditCard, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import { getBilling, createCheckout, cancelSubscription } from '@/api/admin'
import { Button } from '@/components/ui/button'
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

export default function BillingPage() {
  const [searchParams] = useSearchParams()
  const expired = searchParams.get('expired') === 'true'
  const qc = useQueryClient()

  const { data: billing, isLoading } = useQuery({
    queryKey: ['billing'],
    queryFn: getBilling,
  })

  const checkoutMutation = useMutation({
    mutationFn: createCheckout,
    onSuccess: ({ checkoutUrl }) => {
      window.location.href = checkoutUrl
    },
    onError: () => toast({ variant: 'destructive', title: 'Erro ao iniciar pagamento' }),
  })

  const cancelMutation = useMutation({
    mutationFn: cancelSubscription,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['billing'] })
      toast({ variant: 'success', title: 'Assinatura cancelada' })
    },
    onError: () => toast({ variant: 'destructive', title: 'Erro ao cancelar assinatura' }),
  })

  if (isLoading) {
    return <div className="text-center py-16 text-gray-400">Carregando...</div>
  }

  const trialDaysLeft =
    billing && !billing.subscriptionActive && billing.trialEndsAt
      ? differenceInDays(new Date(billing.trialEndsAt), new Date())
      : null

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">Faturamento</h1>

      {expired && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-800">Trial expirado</p>
            <p className="text-sm text-red-600">
              Seu período gratuito terminou. Assine agora para restaurar o acesso completo.
            </p>
          </div>
        </div>
      )}

      {/* Status card */}
      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-start gap-4">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
              billing?.subscriptionActive
                ? 'bg-green-100'
                : trialDaysLeft !== null && trialDaysLeft >= 0
                ? 'bg-yellow-100'
                : 'bg-red-100'
            }`}
          >
            {billing?.subscriptionActive ? (
              <CheckCircle className="w-6 h-6 text-green-600" />
            ) : trialDaysLeft !== null && trialDaysLeft >= 0 ? (
              <Clock className="w-6 h-6 text-yellow-600" />
            ) : (
              <AlertCircle className="w-6 h-6 text-red-600" />
            )}
          </div>
          <div className="flex-1">
            {billing?.subscriptionActive ? (
              <>
                <h2 className="text-lg font-semibold text-gray-900">Assinatura ativa</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Status Mercado Pago: {billing.mpStatus ?? 'N/A'}
                </p>
                {billing.trialEndsAt && (
                  <p className="text-sm text-gray-500">
                    Próxima renovação:{' '}
                    {format(parseISO(billing.trialEndsAt), "d 'de' MMMM 'de' yyyy", {
                      locale: ptBR,
                    })}
                  </p>
                )}
              </>
            ) : trialDaysLeft !== null && trialDaysLeft >= 0 ? (
              <>
                <h2 className="text-lg font-semibold text-gray-900">Período de trial</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {trialDaysLeft === 0
                    ? 'Seu trial termina hoje!'
                    : `${trialDaysLeft} dias restantes`}
                </p>
                {billing?.trialEndsAt && (
                  <p className="text-sm text-gray-400">
                    Expira em:{' '}
                    {format(parseISO(billing.trialEndsAt), "d 'de' MMMM 'de' yyyy", {
                      locale: ptBR,
                    })}
                  </p>
                )}
              </>
            ) : (
              <>
                <h2 className="text-lg font-semibold text-gray-900">Sem assinatura ativa</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Assine agora para ter acesso completo ao sistema.
                </p>
              </>
            )}
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          {!billing?.subscriptionActive && (
            <Button
              variant="gold"
              onClick={() => checkoutMutation.mutate()}
              loading={checkoutMutation.isPending}
              className="gap-2"
            >
              <CreditCard className="w-4 h-4" />
              {trialDaysLeft !== null && trialDaysLeft < 0 ? 'Renovar assinatura' : 'Assinar agora'}
            </Button>
          )}

          {billing?.subscriptionActive && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                  Cancelar assinatura
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancelar assinatura</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja cancelar sua assinatura? Você perderá acesso ao sistema
                    ao final do período atual.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Manter assinatura</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={() => cancelMutation.mutate()}
                  >
                    Confirmar cancelamento
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Payment history placeholder */}
      <div className="bg-white rounded-xl border">
        <div className="px-5 py-4 border-b">
          <h2 className="font-semibold text-gray-900">Histórico de pagamentos</h2>
        </div>
        <div className="p-8 text-center text-gray-400">
          Histórico disponível em breve
        </div>
      </div>
    </div>
  )
}

import * as React from 'react'
import type { ToastProps } from '@/components/ui/toast'

const TOAST_LIMIT = 3
const TOAST_REMOVE_DELAY = 4000

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
}

let toastCount = 0
function genId() {
  toastCount = (toastCount + 1) % Number.MAX_SAFE_INTEGER
  return toastCount.toString()
}

type State = {
  toasts: ToasterToast[]
}

const listeners: Array<(state: State) => void> = []
let memoryState: State = { toasts: [] }

function dispatch(action: { type: 'ADD' | 'REMOVE'; toast?: ToasterToast; toastId?: string }) {
  if (action.type === 'ADD' && action.toast) {
    memoryState = {
      toasts: [action.toast, ...memoryState.toasts].slice(0, TOAST_LIMIT),
    }
  } else if (action.type === 'REMOVE') {
    memoryState = {
      toasts: memoryState.toasts.filter((t) => t.id !== action.toastId),
    }
  }
  listeners.forEach((l) => l(memoryState))
}

export function toast(props: Omit<ToasterToast, 'id'>) {
  const id = genId()
  dispatch({ type: 'ADD', toast: { ...props, id } })
  setTimeout(() => dispatch({ type: 'REMOVE', toastId: id }), TOAST_REMOVE_DELAY)
  return id
}

export function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const idx = listeners.indexOf(setState)
      if (idx > -1) listeners.splice(idx, 1)
    }
  }, [])

  return {
    toasts: state.toasts,
    toast,
    dismiss: (toastId: string) => dispatch({ type: 'REMOVE', toastId }),
  }
}

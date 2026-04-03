import { api } from './axios'

export async function createTenant(payload: {
  name: string
  slug: string
  ownerEmail: string
}): Promise<{ temporaryPassword: string }> {
  const { data } = await api.post('/api/super/tenants', payload)
  return data
}

export async function setSubscription(tenantId: string, active: boolean): Promise<void> {
  await api.patch(`/api/super/tenants/${tenantId}/subscription`, { active })
}

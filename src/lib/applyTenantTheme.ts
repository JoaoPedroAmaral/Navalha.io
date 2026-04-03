const DEFAULT_PRIMARY = '#1a1f2e'
const DEFAULT_SECONDARY = '#b5882a'

export function applyTenantTheme(primaryColor?: string | null, secondaryColor?: string | null) {
  const root = document.documentElement
  root.style.setProperty('--tenant-primary', primaryColor || DEFAULT_PRIMARY)
  root.style.setProperty('--tenant-secondary', secondaryColor || DEFAULT_SECONDARY)
}

export function resetTenantTheme() {
  const root = document.documentElement
  root.style.removeProperty('--tenant-primary')
  root.style.removeProperty('--tenant-secondary')
}

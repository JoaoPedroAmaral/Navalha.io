const DEFAULT_PRIMARY = '#1a1f2e'
const DEFAULT_SECONDARY = '#b5882a'

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  let h = 0
  let s = 0

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }

  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)]
}

function hslToHex(h: number, s: number, l: number): string {
  const sl = s / 100
  const ll = l / 100
  const a = sl * Math.min(ll, 1 - ll)
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    const color = ll - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    return Math.round(255 * color).toString(16).padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

function deriveComplement(hex: string): string {
  try {
    const [h, s, l] = hexToHsl(hex)
    const complementH = (h + 150) % 360
    const complementS = Math.min(s + 10, 85)
    const complementL = l > 50 ? Math.max(l - 20, 25) : Math.min(l + 20, 75)
    return hslToHex(complementH, complementS, complementL)
  } catch {
    return DEFAULT_SECONDARY
  }
}

function deriveSurface(hex: string): string {
  try {
    const [h, s] = hexToHsl(hex)
    const surfaceL = 97
    const surfaceS = Math.min(s * 0.15, 12)
    return hslToHex(h, surfaceS, surfaceL)
  } catch {
    return '#f8f9fa'
  }
}

function deriveHoverColor(hex: string): string {
  try {
    const [h, s, l] = hexToHsl(hex)
    return hslToHex(h, s, Math.min(l + 8, 95))
  } catch {
    return hex
  }
}

function isValidHex(hex: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(hex)
}

export function applyTenantTheme(primaryColor?: string | null, secondaryColor?: string | null) {
  const root = document.documentElement

  const primary = primaryColor && isValidHex(primaryColor) ? primaryColor : DEFAULT_PRIMARY
  const secondary = secondaryColor && isValidHex(secondaryColor)
    ? secondaryColor
    : deriveComplement(primary)

  const [pH, pS, pL] = hexToHsl(primary)
  const [sH, sS, sL] = hexToHsl(secondary)

  root.style.setProperty('--tenant-primary', primary)
  root.style.setProperty('--tenant-secondary', secondary)

  root.style.setProperty('--tenant-primary-hsl', `${pH} ${pS}% ${pL}%`)
  root.style.setProperty('--tenant-secondary-hsl', `${sH} ${sS}% ${sL}%`)

  root.style.setProperty('--tenant-surface', deriveSurface(primary))
  root.style.setProperty('--tenant-primary-hover', deriveHoverColor(primary))

  const primaryMid = hslToHex(pH, pS, Math.max(pL - 8, 5))
  root.style.setProperty('--tenant-primary-deep', primaryMid)

  const softGlow = `hsl(${sH} ${sS}% ${sL}% / 0.18)`
  root.style.setProperty('--tenant-glow', softGlow)

  const shadowColor = `hsl(${pH} ${pS}% ${Math.max(pL - 10, 5)}% / 0.25)`
  root.style.setProperty('--tenant-shadow', shadowColor)

  const textOnPrimary = pL > 50 ? '#1a1a1a' : '#ffffff'
  root.style.setProperty('--tenant-text-on-primary', textOnPrimary)

  const textRgb = pL > 50 ? '26 26 26' : '255 255 255'
  root.style.setProperty('--tenant-text-on-primary-rgb', textRgb)

  const contentBg = pL > 50
    ? hslToHex(pH, Math.min(pS * 0.1, 8), 93)
    : hslToHex(pH, Math.min(pS * 0.12, 10), 94)
  root.style.setProperty('--tenant-content-bg', contentBg)

  const secondaryLight = hslToHex(sH, Math.max(sS - 20, 20), Math.min(sL + 35, 95))
  root.style.setProperty('--tenant-secondary-light', secondaryLight)
}

export function resetTenantTheme() {
  const root = document.documentElement
  const props = [
    '--tenant-primary',
    '--tenant-secondary',
    '--tenant-primary-hsl',
    '--tenant-secondary-hsl',
    '--tenant-surface',
    '--tenant-primary-hover',
    '--tenant-primary-deep',
    '--tenant-glow',
    '--tenant-shadow',
    '--tenant-text-on-primary',
    '--tenant-text-on-primary-rgb',
    '--tenant-content-bg',
    '--tenant-secondary-light',
  ]
  props.forEach((p) => root.style.removeProperty(p))
}

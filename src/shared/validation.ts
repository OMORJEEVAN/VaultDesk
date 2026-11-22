// ============================================================
// VaultDesk – Input Validation
// ============================================================

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

// ----------------------------------------------------------------
// Master password strength
// ----------------------------------------------------------------
export function validateMasterPassword(password: string): ValidationResult {
  const errors: string[] = []
  if (password.length < 12)        errors.push('Must be at least 12 characters.')
  if (!/[A-Z]/.test(password))     errors.push('Must contain at least one uppercase letter.')
  if (!/[a-z]/.test(password))     errors.push('Must contain at least one lowercase letter.')
  if (!/[0-9]/.test(password))     errors.push('Must contain at least one digit.')
  if (!/[^A-Za-z0-9]/.test(password)) errors.push('Must contain at least one special character.')
  return { valid: errors.length === 0, errors }
}

// ----------------------------------------------------------------
// Credential fields
// ----------------------------------------------------------------
export function validateCredential(cred: {
  platformName?: unknown
  email?: unknown
  username?: unknown
  password?: unknown
  websiteUrl?: unknown
}): ValidationResult {
  const errors: string[] = []

  if (!cred.platformName || typeof cred.platformName !== 'string' || cred.platformName.trim().length === 0)
    errors.push('Platform name is required.')
  if (typeof cred.platformName === 'string' && cred.platformName.length > 200)
    errors.push('Platform name must be under 200 characters.')

  if (cred.email && typeof cred.email === 'string') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(cred.email))
      errors.push('Email address format is invalid.')
  }

  if (cred.websiteUrl && typeof cred.websiteUrl === 'string') {
    try {
      new URL(cred.websiteUrl)
    } catch {
      errors.push('Website URL format is invalid.')
    }
  }

  if (!cred.password || typeof cred.password !== 'string' || cred.password.length === 0)
    errors.push('Password is required.')

  return { valid: errors.length === 0, errors }
}

// ----------------------------------------------------------------
// Category name
// ----------------------------------------------------------------
export function validateCategoryName(name: string): ValidationResult {
  const errors: string[] = []
  if (!name || name.trim().length === 0) errors.push('Category name is required.')
  if (name.length > 100) errors.push('Category name must be under 100 characters.')
  return { valid: errors.length === 0, errors }
}

// ----------------------------------------------------------------
// IPC string sanitization (strip null bytes, limit length)
// ----------------------------------------------------------------
export function sanitizeString(input: unknown, maxLength = 10_000): string {
  if (typeof input !== 'string') return ''
  return input.replace(/\x00/g, '').slice(0, maxLength)
}

export function sanitizeNumber(input: unknown, min: number, max: number): number {
  const n = Number(input)
  if (!isFinite(n)) return min
  return Math.max(min, Math.min(max, Math.floor(n)))
}

export function sanitizeBoolean(input: unknown): boolean {
  return input === true || input === 1 || input === 'true'
}

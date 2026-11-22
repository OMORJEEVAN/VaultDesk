// ============================================================
// VaultDesk – Shared TypeScript Types
// Used by both main process and renderer (via IPC contracts)
// ============================================================

// ----------------------------------------------------------------
// Vault state
// ----------------------------------------------------------------
export type VaultStatus = 'uninitialized' | 'locked' | 'unlocked'

// ----------------------------------------------------------------
// Master-password / KDF setup
// ----------------------------------------------------------------
export interface KdfParameters {
  memoryCost: number   // Argon2id memory in KiB
  timeCost: number     // Argon2id iterations
  parallelism: number  // Argon2id lanes
  hashLength: number   // Output bytes
}

export interface VaultSettings {
  id: number
  salt: string            // hex
  kdfAlgorithm: string
  kdfParameters: KdfParameters
  keyCheckCiphertext: string  // hex
  keyCheckNonce: string       // hex
  keyCheckAuthTag: string     // hex
  encryptionVersion: number
  createdAt: string
}

// ----------------------------------------------------------------
// Credentials (decrypted in memory, encrypted at rest)
// ----------------------------------------------------------------
export interface Credential {
  id: number
  platformName: string
  websiteUrl: string
  email: string
  username: string
  password: string
  category: string
  tags: string[]       // array stored as JSON inside encrypted blob
  notes: string
  isFavorite: boolean
  createdAt: string
  updatedAt: string
}

export type NewCredential = Omit<Credential, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateCredential = Partial<Omit<Credential, 'id' | 'createdAt'>> & { id: number }

// ----------------------------------------------------------------
// Encrypted credential row (what's actually in SQLite)
// ----------------------------------------------------------------
export interface EncryptedCredentialRow {
  id: number
  encrypted_data: Buffer
  nonce: Buffer
  authentication_tag: Buffer
  encryption_version: number
  is_favorite: number    // SQLite integer (0/1)
  created_at: string
  updated_at: string
}

// ----------------------------------------------------------------
// Category
// ----------------------------------------------------------------
export interface Category {
  id: number
  name: string
  createdAt: string
}

// ----------------------------------------------------------------
// IPC API surface (what preload exposes via contextBridge)
// ----------------------------------------------------------------
export interface VaultAPI {
  // Vault lifecycle
  getVaultStatus: () => Promise<VaultStatus>
  setupVault: (masterPassword: string) => Promise<{ success: boolean; error?: string }>
  unlockVault: (masterPassword: string) => Promise<{ success: boolean; error?: string }>
  lockVault: () => Promise<void>
  changeVaultLocation: (newPath: string) => Promise<{ success: boolean; error?: string }>

  // Credentials
  getCredentials: () => Promise<Credential[]>
  addCredential: (cred: NewCredential) => Promise<{ success: boolean; id?: number; error?: string }>
  updateCredential: (cred: UpdateCredential) => Promise<{ success: boolean; error?: string }>
  deleteCredential: (id: number) => Promise<{ success: boolean; error?: string }>
  toggleFavorite: (id: number, value: boolean) => Promise<{ success: boolean; error?: string }>

  // Categories
  getCategories: () => Promise<Category[]>
  addCategory: (name: string) => Promise<{ success: boolean; id?: number; error?: string }>
  deleteCategory: (id: number) => Promise<{ success: boolean; error?: string }>

  // Backup / restore
  exportBackup: (destPath: string) => Promise<{ success: boolean; error?: string }>
  importBackup: (srcPath: string, masterPassword: string) => Promise<{ success: boolean; error?: string }>

  // Settings
  getSettings: () => Promise<AppSettings>
  saveSettings: (settings: Partial<AppSettings>) => Promise<void>

  // File dialogs
  showSaveDialog: (options: Electron.SaveDialogOptions) => Promise<string | undefined>
  showOpenDialog: (options: Electron.OpenDialogOptions) => Promise<string[] | undefined>
  showDirectoryDialog: () => Promise<string | undefined>

  // Clipboard
  writeClipboard: (text: string) => Promise<void>

  // Events from main → renderer
  onLockVault: (cb: () => void) => () => void
  onActivityReset: (cb: () => void) => () => void

  // Password generator (CSPRNG runs in main process)
  generatePassword: (options: GeneratorOptions) => Promise<{ success: boolean; password?: string; error?: string }>
}

// ----------------------------------------------------------------
// App settings
// ----------------------------------------------------------------
export interface AppSettings {
  theme: 'dark' | 'light' | 'system'
  autoLockMinutes: number       // 0 = disabled
  clipboardClearSeconds: number // 0 = disabled
  vaultPath: string             // custom vault directory, '' = default
  language: string
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  autoLockMinutes: 15,
  clipboardClearSeconds: 30,
  vaultPath: '',
  language: 'en'
}

// ----------------------------------------------------------------
// Security / password strength
// ----------------------------------------------------------------
export type PasswordStrength = 'very-weak' | 'weak' | 'fair' | 'strong' | 'very-strong'

export interface PasswordAnalysis {
  strength: PasswordStrength
  score: number       // 0-100
  feedback: string[]
  entropy: number
}

export interface SecurityReport {
  total: number
  strong: number
  weak: number
  reused: number
  duplicateAccounts: number
  missingInfo: number
  reusedGroups: { password: string; ids: number[] }[]
}

// ----------------------------------------------------------------
// Generator options
// ----------------------------------------------------------------
export interface GeneratorOptions {
  length: number
  uppercase: boolean
  lowercase: boolean
  numbers: boolean
  symbols: boolean
  excludeAmbiguous: boolean
}

export const DEFAULT_GENERATOR_OPTIONS: GeneratorOptions = {
  length: 20,
  uppercase: true,
  lowercase: true,
  numbers: true,
  symbols: true,
  excludeAmbiguous: false
}

// ----------------------------------------------------------------
// Search
// ----------------------------------------------------------------
export interface SearchFilters {
  query: string
  category?: string
  favoritesOnly?: boolean
  sortBy: 'name' | 'created' | 'updated'
  sortDir: 'asc' | 'desc'
}

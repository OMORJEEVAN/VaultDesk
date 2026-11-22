// ============================================================
// VaultDesk – VaultService
// ============================================================
// Manages the in-memory encryption key and decrypted credential
// cache. All sensitive state lives here and is wiped on lock.
// ============================================================

import {
  encrypt, decrypt, buildCredentialAAD, buildKeyCheckAAD
} from '../security/encryption'
import {
  deriveKey, generateSalt, KDF_PARAMS, KDF_ALGORITHM, CURRENT_ENCRYPTION_VERSION
} from '../security/keyDerivation'
import { zeroAll } from '../security/secureMemory'
import {
  getVaultSettings, saveVaultSettings,
  getAllCredentialRows, insertCredential, updateCredentialBlob,
  updateFavoriteFlag, deleteCredentialById, getCredentialRowById
} from './database'
import type { Credential, NewCredential, UpdateCredential, SecurityReport, VaultStatus } from '../shared/types'
import { analyzePassword } from '../security/passwordGenerator'

// ----------------------------------------------------------------
// In-memory vault state (NEVER persisted)
// ----------------------------------------------------------------

let encryptionKey: Buffer | null = null
let cachedCredentials: Credential[] = []
let vaultStatus: VaultStatus = 'locked'

// ----------------------------------------------------------------
// Status
// ----------------------------------------------------------------

export function getVaultStatus(): VaultStatus {
  const settings = getVaultSettings()
  if (!settings) return 'uninitialized'
  if (!encryptionKey) return 'locked'
  return 'unlocked'
}

// ----------------------------------------------------------------
// Setup (first run)
// ----------------------------------------------------------------

export async function setupVault(masterPassword: string): Promise<void> {
  const salt       = generateSalt()
  const key        = await deriveKey(masterPassword, salt, KDF_PARAMS)
  const keyCheckAAD = buildKeyCheckAAD(CURRENT_ENCRYPTION_VERSION)

  // Encrypt a known verification string; we'll decrypt it on future unlocks
  const verificationText = 'VaultDesk-KeyCheck-OK'
  const { ciphertext, nonce, authTag } = encrypt(key, verificationText, keyCheckAAD)

  saveVaultSettings({
    salt,
    kdfAlgorithm: KDF_ALGORITHM,
    kdfParameters: JSON.stringify(KDF_PARAMS),
    keyCheckCiphertext: ciphertext,
    keyCheckNonce: nonce,
    keyCheckAuthTag: authTag,
    encryptionVersion: CURRENT_ENCRYPTION_VERSION
  })

  // Key stays in memory – vault is now unlocked
  encryptionKey = key
  cachedCredentials = []
  vaultStatus = 'unlocked'

  // Zero the salt (it's persisted in DB; key is what we need in memory)
  zeroAll(salt)
}

// ----------------------------------------------------------------
// Unlock
// ----------------------------------------------------------------

export async function unlockVault(masterPassword: string): Promise<boolean> {
  const settings = getVaultSettings()
  if (!settings) throw new Error('Vault not initialized.')

  const salt   = Buffer.from(settings.salt, 'hex')
  const params = settings.kdfParameters
  const key    = await deriveKey(masterPassword, salt, params)
  zeroAll(salt)

  // Verify key by decrypting the key-check record
  const aad = buildKeyCheckAAD(settings.encryptionVersion)
  try {
    const decrypted = decrypt(key, {
      ciphertext: Buffer.from(settings.keyCheckCiphertext, 'hex'),
      nonce:      Buffer.from(settings.keyCheckNonce, 'hex'),
      authTag:    Buffer.from(settings.keyCheckAuthTag, 'hex')
    }, aad)

    const text = decrypted.toString('utf8')
    if (text !== 'VaultDesk-KeyCheck-OK') {
      zeroAll(key)
      return false
    }
  } catch {
    zeroAll(key)
    return false
  }

  // Key is valid — load all credentials into memory
  encryptionKey = key
  cachedCredentials = loadAllCredentials()
  vaultStatus = 'unlocked'
  return true
}

// ----------------------------------------------------------------
// Lock
// ----------------------------------------------------------------

export function lockVault(): void {
  // Zero the key buffer before releasing reference
  if (encryptionKey) {
    zeroAll(encryptionKey)
    encryptionKey = null
  }
  // Clear cached decrypted credentials
  cachedCredentials = []
  vaultStatus = 'locked'
}

// ----------------------------------------------------------------
// Credential operations
// ----------------------------------------------------------------

function requireKey(): Buffer {
  if (!encryptionKey) throw new Error('Vault is locked.')
  return encryptionKey
}

function encryptCredential(cred: Omit<Credential, 'id' | 'createdAt' | 'updatedAt' | 'isFavorite'>, id: number): {
  encryptedData: Buffer; nonce: Buffer; authTag: Buffer
} {
  const key = requireKey()
  const aad = buildCredentialAAD(id, CURRENT_ENCRYPTION_VERSION)
  const plaintext = JSON.stringify({
    platformName: cred.platformName,
    websiteUrl:   cred.websiteUrl,
    email:        cred.email,
    username:     cred.username,
    password:     cred.password,
    category:     cred.category,
    tags:         cred.tags,
    notes:        cred.notes
  })
  const { ciphertext, nonce, authTag } = encrypt(key, plaintext, aad)
  return { encryptedData: ciphertext, nonce, authTag }
}

function decryptCredentialRow(row: {
  id: number
  encrypted_data: Buffer
  nonce: Buffer
  authentication_tag: Buffer
  encryption_version: number
  is_favorite: number
  created_at: string
  updated_at: string
}): Credential | null {
  const key = requireKey()
  const aad = buildCredentialAAD(row.id, row.encryption_version)
  try {
    const decryptedBuf = decrypt(key, {
      ciphertext: row.encrypted_data,
      nonce:      row.nonce,
      authTag:    row.authentication_tag
    }, aad)
    const data = JSON.parse(decryptedBuf.toString('utf8'))
    return {
      id:           row.id,
      platformName: data.platformName ?? '',
      websiteUrl:   data.websiteUrl ?? '',
      email:        data.email ?? '',
      username:     data.username ?? '',
      password:     data.password ?? '',
      category:     data.category ?? '',
      tags:         Array.isArray(data.tags) ? data.tags : [],
      notes:        data.notes ?? '',
      isFavorite:   row.is_favorite === 1,
      createdAt:    row.created_at,
      updatedAt:    row.updated_at
    }
  } catch (err) {
    console.error(`[VaultService] Failed to decrypt credential id=${row.id}: ${(err as Error).message}`)
    return null
  }
}

export function loadAllCredentials(): Credential[] {
  const rows = getAllCredentialRows()
  const result: Credential[] = []
  for (const row of rows) {
    const cred = decryptCredentialRow(row)
    if (cred) result.push(cred)
  }
  return result
}

export function getCredentials(): Credential[] {
  requireKey()
  return cachedCredentials
}

export function addCredential(cred: NewCredential): number {
  requireKey()

  // Temporarily insert to get the ID, then encrypt with AAD bound to that ID
  // We do a two-step: insert a placeholder, get ID, re-encrypt with real AAD, update
  const { encryptedData, nonce, authTag } = encryptCredential(cred, 0)
  const tempId = insertCredential({
    encryptedData, nonce, authTag,
    encryptionVersion: CURRENT_ENCRYPTION_VERSION,
    isFavorite: cred.isFavorite
  })

  // Now re-encrypt with the real ID as AAD
  const { encryptedData: ed2, nonce: n2, authTag: a2 } = encryptCredential(cred, tempId)
  updateCredentialBlob(tempId, {
    encryptedData: ed2, nonce: n2, authTag: a2, isFavorite: cred.isFavorite
  })

  const row = getCredentialRowById(tempId)!
  const decrypted = decryptCredentialRow(row)
  if (decrypted) cachedCredentials.unshift(decrypted)
  return tempId
}

export function updateCredential(update: UpdateCredential): void {
  requireKey()
  const existing = cachedCredentials.find(c => c.id === update.id)
  if (!existing) throw new Error(`Credential ${update.id} not found.`)

  const merged: Omit<Credential, 'id' | 'createdAt' | 'updatedAt'> = {
    platformName: update.platformName ?? existing.platformName,
    websiteUrl:   update.websiteUrl   ?? existing.websiteUrl,
    email:        update.email        ?? existing.email,
    username:     update.username     ?? existing.username,
    password:     update.password     ?? existing.password,
    category:     update.category     ?? existing.category,
    tags:         update.tags         ?? existing.tags,
    notes:        update.notes        ?? existing.notes,
    isFavorite:   update.isFavorite   ?? existing.isFavorite
  }

  const { encryptedData, nonce, authTag } = encryptCredential(merged, update.id)
  updateCredentialBlob(update.id, { encryptedData, nonce, authTag, isFavorite: merged.isFavorite })

  // Refresh cache
  const idx = cachedCredentials.findIndex(c => c.id === update.id)
  if (idx !== -1) {
    const row = getCredentialRowById(update.id)!
    const refreshed = decryptCredentialRow(row)
    if (refreshed) cachedCredentials[idx] = refreshed
  }
}

export function deleteCredential(id: number): void {
  requireKey()
  deleteCredentialById(id)
  cachedCredentials = cachedCredentials.filter(c => c.id !== id)
}

export function toggleFavorite(id: number, value: boolean): void {
  requireKey()
  updateFavoriteFlag(id, value)
  const cred = cachedCredentials.find(c => c.id === id)
  if (cred) cred.isFavorite = value
}

// ----------------------------------------------------------------
// Security report (runs on decrypted in-memory cache)
// ----------------------------------------------------------------

export function buildSecurityReport(): SecurityReport {
  requireKey()
  const creds = cachedCredentials

  // Find reused passwords
  const passwordMap = new Map<string, number[]>()
  for (const c of creds) {
    if (!c.password) continue
    if (!passwordMap.has(c.password)) passwordMap.set(c.password, [])
    passwordMap.get(c.password)!.push(c.id)
  }
  const reusedGroups = [...passwordMap.entries()]
    .filter(([, ids]) => ids.length > 1)
    .map(([password, ids]) => ({ password, ids }))

  const reusedIds = new Set(reusedGroups.flatMap(g => g.ids))

  let strong = 0
  let weak   = 0
  let missing = 0
  for (const c of creds) {
    const { strength } = analyzePassword(c.password)
    if (strength === 'strong' || strength === 'very-strong') strong++
    else weak++
    if (!c.email && !c.username) missing++
  }

  // Duplicate accounts: same platform + email combo
  const seen = new Set<string>()
  let dupes = 0
  for (const c of creds) {
    const key = `${c.platformName.toLowerCase()}|${c.email.toLowerCase()}`
    if (seen.has(key)) dupes++
    else seen.add(key)
  }

  return {
    total: creds.length,
    strong,
    weak,
    reused: reusedIds.size,
    duplicateAccounts: dupes,
    missingInfo: missing,
    reusedGroups
  }
}

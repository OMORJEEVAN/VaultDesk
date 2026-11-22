// ============================================================
// VaultDesk – AES-256-GCM Encryption/Decryption
// ============================================================
// Every credential field is encrypted before SQLite storage.
// A unique 12-byte nonce is generated per record.
// Authentication tag (16 bytes) is verified on every decrypt.
// Additional authenticated data (AAD) binds ciphertext to its
// record ID and schema version to prevent record-swap attacks.
// ============================================================

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM        = 'aes-256-gcm'
const NONCE_LENGTH     = 12  // 96-bit nonce (GCM standard)
const AUTH_TAG_LENGTH  = 16  // 128-bit tag
const KEY_LENGTH       = 32  // 256-bit key

export interface EncryptedPayload {
  ciphertext: Buffer
  nonce: Buffer
  authTag: Buffer
}

/**
 * Encrypt plaintext with AES-256-GCM.
 *
 * @param key         32-byte encryption key (from Argon2id)
 * @param plaintext   Data to encrypt (Buffer or string)
 * @param aad         Additional authenticated data (not encrypted, but authenticated)
 * @returns           { ciphertext, nonce, authTag }
 */
export function encrypt(
  key: Buffer,
  plaintext: Buffer | string,
  aad?: Buffer
): EncryptedPayload {
  if (key.length !== KEY_LENGTH) {
    throw new Error(`AES-256-GCM requires a 32-byte key (got ${key.length})`)
  }

  const nonce  = randomBytes(NONCE_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, nonce, { authTagLength: AUTH_TAG_LENGTH })

  if (aad) {
    cipher.setAAD(aad)
  }

  const data       = typeof plaintext === 'string' ? Buffer.from(plaintext, 'utf8') : plaintext
  const ciphertext = Buffer.concat([cipher.update(data), cipher.final()])
  const authTag    = cipher.getAuthTag()

  return { ciphertext, nonce, authTag }
}

/**
 * Decrypt AES-256-GCM ciphertext.
 * Throws if the authentication tag is invalid (tampered/corrupted data).
 *
 * @param key         32-byte encryption key
 * @param payload     { ciphertext, nonce, authTag }
 * @param aad         Must match the AAD used during encryption
 * @returns           Decrypted Buffer
 * @throws            Error if authentication tag verification fails
 */
export function decrypt(
  key: Buffer,
  payload: EncryptedPayload,
  aad?: Buffer
): Buffer {
  if (key.length !== KEY_LENGTH) {
    throw new Error(`AES-256-GCM requires a 32-byte key (got ${key.length})`)
  }

  const decipher = createDecipheriv(ALGORITHM, key, payload.nonce, { authTagLength: AUTH_TAG_LENGTH })
  decipher.setAuthTag(payload.authTag)

  if (aad) {
    decipher.setAAD(aad)
  }

  try {
    const plaintext = Buffer.concat([decipher.update(payload.ciphertext), decipher.final()])
    return plaintext
  } catch {
    // Do not leak details about why verification failed
    throw new Error('Decryption failed: authentication tag verification error. Record may be tampered or corrupted.')
  }
}

/**
 * Build the Additional Authenticated Data (AAD) for a credential record.
 * Binds ciphertext to its database ID and encryption schema version.
 */
export function buildCredentialAAD(recordId: number, encryptionVersion: number): Buffer {
  const aad = `vaultdesk:credential:${recordId}:v${encryptionVersion}`
  return Buffer.from(aad, 'utf8')
}

/**
 * Build AAD for the vault key-verification record.
 */
export function buildKeyCheckAAD(encryptionVersion: number): Buffer {
  const aad = `vaultdesk:keycheck:v${encryptionVersion}`
  return Buffer.from(aad, 'utf8')
}

/**
 * Generate a random nonce (exposed for testing purposes).
 */
export function generateNonce(): Buffer {
  return randomBytes(NONCE_LENGTH)
}

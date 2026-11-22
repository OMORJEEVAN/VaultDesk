// ============================================================
// VaultDesk – Key Derivation (Argon2id)
// ============================================================
// Uses the 'argon2' npm package (bindings to the C reference impl).
// NEVER implements Argon2 manually.
// ============================================================

import argon2 from 'argon2'
import { randomBytes } from 'crypto'
import type { KdfParameters } from '../shared/types'

// Production-grade Argon2id parameters.
// OWASP 2023 recommendation: m=65536, t=3, p=4
export const KDF_PARAMS: KdfParameters = {
  memoryCost: 65_536,  // 64 MiB
  timeCost: 3,
  parallelism: 4,
  hashLength: 32       // 256-bit output
}

export const KDF_ALGORITHM = 'argon2id'
export const SALT_LENGTH   = 32  // bytes
export const CURRENT_ENCRYPTION_VERSION = 1

/**
 * Generate a cryptographically secure random salt.
 */
export function generateSalt(): Buffer {
  return randomBytes(SALT_LENGTH)
}

/**
 * Derive a 256-bit encryption key from a master password using Argon2id.
 *
 * @param masterPassword  The user's master password (plaintext)
 * @param salt            The 32-byte random salt
 * @param params          KDF parameters (defaults to KDF_PARAMS)
 * @returns               32-byte Buffer (never log this)
 */
export async function deriveKey(
  masterPassword: string,
  salt: Buffer,
  params: KdfParameters = KDF_PARAMS
): Promise<Buffer> {
  const hash = await argon2.hash(masterPassword, {
    type: argon2.argon2id,
    salt,
    memoryCost: params.memoryCost,
    timeCost: params.timeCost,
    parallelism: params.parallelism,
    hashLength: params.hashLength,
    raw: true  // return raw bytes, not encoded string
  })
  return hash
}

/**
 * Verify a master password by re-deriving the key and comparing
 * it against an expected derived key buffer.
 * Uses a timing-safe comparison.
 */
export async function verifyDerivedKey(
  masterPassword: string,
  salt: Buffer,
  expectedKey: Buffer,
  params: KdfParameters = KDF_PARAMS
): Promise<boolean> {
  try {
    const derived = await deriveKey(masterPassword, salt, params)
    if (derived.length !== expectedKey.length) return false
    // Timing-safe comparison
    let diff = 0
    for (let i = 0; i < derived.length; i++) {
      diff |= derived[i] ^ expectedKey[i]
    }
    return diff === 0
  } catch {
    return false
  }
}

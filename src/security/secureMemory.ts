// ============================================================
// VaultDesk – Secure Memory Utilities
// ============================================================
//
// IMPORTANT LIMITATIONS (read before using):
//
// JavaScript / V8 does not provide true secure memory management.
// The following limitations apply:
//
// 1. V8 may copy Buffer/TypedArray contents to new memory locations
//    during garbage collection (copying GC). The original memory may
//    remain readable until overwritten by the OS or GC.
//
// 2. String primitives in V8 are immutable and interned. Any
//    sensitive data briefly held as a string (e.g. masterPassword
//    as a function parameter) CANNOT be reliably zeroed.
//    Prefer Buffer for sensitive data wherever possible.
//
// 3. await / Promise chains may cause sensitive values to exist
//    on the heap across GC pause points.
//
// 4. Memory dumps, swap files, and OS-level inspection can still
//    reveal sensitive data at the process level.
//
// What zeroing DOES achieve:
// - Narrows the window during which a sensitive value exists in
//   the buffer's current memory region.
// - Reduces risk from application-level memory read bugs.
// - Demonstrates intent and care in the implementation.
//
// For a fully secure password manager, the encryption/KDF work
// ideally runs in a native addon with mlockall() / VirtualLock().
// ============================================================

/**
 * Overwrite a Buffer's contents with zeros.
 * Best-effort: V8 may have already moved the data.
 */
export function zeroBuffer(buf: Buffer | null | undefined): void {
  if (buf && Buffer.isBuffer(buf)) {
    buf.fill(0)
  }
}

/**
 * Overwrite a Uint8Array with zeros.
 */
export function zeroTypedArray(arr: Uint8Array | null | undefined): void {
  if (arr) {
    arr.fill(0)
  }
}

/**
 * Zero multiple buffers at once (convenience helper).
 */
export function zeroAll(...bufs: (Buffer | Uint8Array | null | undefined)[]): void {
  for (const buf of bufs) {
    if (!buf) continue
    if (Buffer.isBuffer(buf)) zeroBuffer(buf as Buffer)
    else zeroTypedArray(buf as Uint8Array)
  }
}

/**
 * Timing-safe string comparison (uses Buffer.from internally).
 * Prevents timing oracle attacks when comparing secrets.
 */
export function timingSafeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a, 'utf8')
  const bBuf = Buffer.from(b, 'utf8')
  if (aBuf.length !== bBuf.length) return false
  let diff = 0
  for (let i = 0; i < aBuf.length; i++) {
    diff |= aBuf[i] ^ bBuf[i]
  }
  return diff === 0
}

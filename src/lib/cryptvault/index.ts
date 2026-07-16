/**
 * CRYPTVAULT — Isolated encryption/decryption operations.
 *
 * Architecture Law §1.1: All documents encrypted client-side before any byte
 *   leaves the device. Decryption only at authorized recipients.
 * Architecture Law §1.3: This module has NO import path into chat, logging,
 *   analytics, prompt-construction, or error-reporting code.
 *
 * Uses NIP-44 for encryption (via nostr-tools).
 * Uses SubtleCrypto for file-level AES-GCM encryption.
 */

/**
 * Encrypt a file using AES-256-GCM with a random key.
 * Returns the encrypted data and the key needed to decrypt.
 *
 * The key should be encrypted with NIP-44 before being stored
 * alongside the ciphertext reference.
 */
export async function encryptFile(
  data: ArrayBuffer
): Promise<{ ciphertext: ArrayBuffer; key: ArrayBuffer; iv: ArrayBuffer }> {
  // Generate a random 256-bit AES key
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt']
  );

  // Generate a random 96-bit IV
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Encrypt
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );

  // Export the raw key
  const rawKey = await crypto.subtle.exportKey('raw', key);

  return { ciphertext, key: rawKey, iv: iv.buffer };
}

/**
 * Decrypt a file encrypted with encryptFile.
 */
export async function decryptFile(
  ciphertext: ArrayBuffer,
  rawKey: ArrayBuffer,
  iv: ArrayBuffer
): Promise<ArrayBuffer> {
  const key = await crypto.subtle.importKey(
    'raw',
    rawKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );

  return crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );
}

/**
 * Hash a file using SHA-256. Used for integrity verification
 * and the hash chain receipt protocol.
 *
 * Returns hex-encoded hash string.
 */
export async function hashFile(data: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = new Uint8Array(hashBuffer);
  return Array.from(hashArray)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Encode binary data to base64 for storage in Nostr event tags.
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Decode base64 back to ArrayBuffer.
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

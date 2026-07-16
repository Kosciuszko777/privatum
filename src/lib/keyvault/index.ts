/**
 * KEYVAULT — Isolated key generation and management.
 *
 * Architecture Law §1.2: Keys are generated client-side.
 * Architecture Law §1.3: This module has NO import path into chat, logging,
 *   analytics, prompt-construction, or error-reporting code.
 *
 * Uses crypto.getRandomValues() via nostr-tools generateSecretKey().
 * NEVER use Math.random or custom RNG in this module.
 */

import { generateSecretKey, getPublicKey } from 'nostr-tools';
import { bytesToHex, hexToBytes } from 'nostr-tools/utils';

export interface KeyPair {
  /** Hex-encoded secret key — NEVER log, transmit, or expose outside keyvault */
  secretKeyHex: string;
  /** Hex-encoded public key — safe to share */
  publicKeyHex: string;
}

/**
 * Generate a new Nostr keypair using crypto.getRandomValues().
 * The secret key MUST remain client-side. Never send it to any server.
 */
export function generateKeyPair(): KeyPair {
  const secretKey = generateSecretKey();
  const publicKey = getPublicKey(secretKey);
  return {
    secretKeyHex: bytesToHex(secretKey),
    publicKeyHex: publicKey,
  };
}

/**
 * Derive the public key from an existing secret key.
 */
export function derivePublicKey(secretKeyHex: string): string {
  const secretKey = hexToBytes(secretKeyHex);
  return getPublicKey(secretKey);
}

/**
 * Securely store a secret key in the browser.
 * Uses localStorage as the base — the key is already the secret for the identity.
 * Architecture Law §1.3 ensures this is only accessed from keyvault.
 */
export function storeSecretKey(keyId: string, secretKeyHex: string): void {
  const storageKey = `privatum:keyvault:${keyId}`;
  localStorage.setItem(storageKey, secretKeyHex);
}

/**
 * Retrieve a stored secret key.
 */
export function retrieveSecretKey(keyId: string): string | null {
  const storageKey = `privatum:keyvault:${keyId}`;
  return localStorage.getItem(storageKey);
}

/**
 * Remove a stored secret key securely.
 */
export function removeSecretKey(keyId: string): void {
  const storageKey = `privatum:keyvault:${keyId}`;
  localStorage.removeItem(storageKey);
}

/**
 * Check if a secret key exists in storage.
 */
export function hasSecretKey(keyId: string): boolean {
  return retrieveSecretKey(keyId) !== null;
}

/**
 * Generate an access code (4-6 digit PIN) for Secure Links.
 * Uses crypto.getRandomValues() — NEVER Math.random.
 */
export function generateAccessCode(length: number = 6): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => (b % 10).toString())
    .join('');
}

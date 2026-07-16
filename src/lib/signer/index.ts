/**
 * SIGNER ABSTRACTION — Pluggable signing methods per §4.
 *
 * Build the identity layer so signing methods are pluggable from day one:
 * browser signer, secure local storage, passkeys, hardware keys,
 * mobile signer, remote signer.
 *
 * Ordinary users never see a raw private key.
 */

/** Supported signer types. */
export type SignerType =
  | 'local'       // nsec in browser (localStorage)
  | 'extension'   // NIP-07 browser extension
  | 'bunker'      // NIP-46 remote signer
  | 'passkey'     // WebAuthn passkey (future)
  | 'hardware'    // Hardware key (future)
  | 'mobile';     // Mobile signer (future)

/** Metadata about the current signing method. */
export interface SignerInfo {
  type: SignerType;
  /** Human-readable label for the UI */
  label: string;
  /** Whether NIP-44 encryption is available */
  supportsNip44: boolean;
  /** Whether NIP-04 encryption is available (legacy) */
  supportsNip04: boolean;
  /** Whether the signer can be used for FROST multi-sig (future) */
  supportsFrost: boolean;
}

/**
 * Determine signer capabilities from the login type.
 * This is used throughout the app to gate features that require
 * specific signer capabilities (e.g., NIP-44 encryption for document transfer).
 */
export function getSignerInfo(loginType: string): SignerInfo {
  switch (loginType) {
    case 'nsec':
      return {
        type: 'local',
        label: 'Browser key',
        supportsNip44: true,
        supportsNip04: true,
        supportsFrost: false,
      };
    case 'extension':
      return {
        type: 'extension',
        label: 'Browser extension',
        supportsNip44: true, // Most modern extensions support NIP-44
        supportsNip04: true,
        supportsFrost: false,
      };
    case 'bunker':
      return {
        type: 'bunker',
        label: 'Remote signer',
        supportsNip44: true,
        supportsNip04: true,
        supportsFrost: true, // Bunker supports FROST in future
      };
    default:
      return {
        type: 'local',
        label: 'Unknown',
        supportsNip44: false,
        supportsNip04: false,
        supportsFrost: false,
      };
  }
}

/**
 * Professional profile metadata stored in kind 0's content JSON.
 * These are Privatum-specific extensions to the standard NIP-01 metadata.
 */
export interface PrivatumProfile {
  /** The user's chosen handle (e.g., "anna-meier") */
  privatum_handle?: string;
  /** Professional title (e.g., "Rechtsanwältin / Attorney at Law") */
  privatum_title?: string;
  /** Jurisdiction (e.g., "Zürich, Schweiz") */
  privatum_jurisdiction?: string;
  /** Verification tier: 'self-declared' | 'domain-verified' | 'register-verified' */
  privatum_verification_tier?: VerificationTier;
  /** Domain used for domain verification */
  privatum_verified_domain?: string;
  /** Source of register verification (e.g., "Zürcher Anwaltsverband") */
  privatum_verification_source?: string;
  /** ISO date of last verification */
  privatum_verification_date?: string;
  /** Default retention policy */
  privatum_retention?: string;
}

export type VerificationTier = 'self-declared' | 'domain-verified' | 'register-verified';

/**
 * Parse Privatum-specific fields from a kind 0 metadata JSON.
 * Returns undefined for missing fields (never throws).
 */
export function parsePrivatumProfile(metadata: Record<string, unknown>): PrivatumProfile {
  return {
    privatum_handle: typeof metadata.privatum_handle === 'string' ? metadata.privatum_handle : undefined,
    privatum_title: typeof metadata.privatum_title === 'string' ? metadata.privatum_title : undefined,
    privatum_jurisdiction: typeof metadata.privatum_jurisdiction === 'string' ? metadata.privatum_jurisdiction : undefined,
    privatum_verification_tier: isVerificationTier(metadata.privatum_verification_tier) ? metadata.privatum_verification_tier : undefined,
    privatum_verified_domain: typeof metadata.privatum_verified_domain === 'string' ? metadata.privatum_verified_domain : undefined,
    privatum_verification_source: typeof metadata.privatum_verification_source === 'string' ? metadata.privatum_verification_source : undefined,
    privatum_verification_date: typeof metadata.privatum_verification_date === 'string' ? metadata.privatum_verification_date : undefined,
    privatum_retention: typeof metadata.privatum_retention === 'string' ? metadata.privatum_retention : undefined,
  };
}

function isVerificationTier(value: unknown): value is VerificationTier {
  return value === 'self-declared' || value === 'domain-verified' || value === 'register-verified';
}

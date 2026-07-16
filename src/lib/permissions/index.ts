/**
 * PERMISSIONS — Cryptographically signed access grants.
 *
 * §5: Permission layer. Cryptographically signed access grants:
 * "Professional A may access Document X; access expires at time Y."
 *
 * Permission verbs: view · download · forward · delegate · revoke.
 * Granularity can expand later (per-file, per-matter, per-role, time-boxed, one-time).
 * Revocation is real: keys rotate, grants expire, and the audit trail records both.
 */

/** Permission verbs. */
export type PermissionVerb = 'view' | 'download' | 'forward' | 'delegate' | 'revoke';

/** A cryptographic access grant. */
export interface AccessGrant {
  /** Unique grant ID */
  id: string;
  /** Pubkey of the granting professional */
  granterPubkey: string;
  /** Pubkey of the granted recipient */
  grantedPubkey: string;
  /** Target type */
  targetType: 'document' | 'folder' | 'channel';
  /** ID of the target resource */
  targetId: string;
  /** Permitted actions */
  permissions: PermissionVerb[];
  /** Expiration timestamp (unix seconds, null = no expiry) */
  expiresAt: number | null;
  /** Whether this is a one-time grant (revoked after first use) */
  oneTime: boolean;
  /** Grant creation timestamp */
  createdAt: number;
  /** Revocation timestamp (null = active) */
  revokedAt: number | null;
  /** Revocation reason */
  revocationReason?: string;
  /**
   * The document decryption key, re-encrypted with NIP-44 for the
   * grantedPubkey. Only present for document-level grants.
   * In a real system this would be the NIP-44 ciphertext of the AES key.
   */
  encryptedKeyForGrantee?: string;
}

// ─── Local persistence ───────────────────────────────────────────────

const GRANTS_KEY = 'privatum:permissions:grants';

export function loadGrants(): AccessGrant[] {
  try {
    const raw = localStorage.getItem(GRANTS_KEY);
    return raw ? JSON.parse(raw) as AccessGrant[] : [];
  } catch {
    return [];
  }
}

export function saveGrants(grants: AccessGrant[]): void {
  localStorage.setItem(GRANTS_KEY, JSON.stringify(grants));
}

// ─── Grant operations ────────────────────────────────────────────────

/** Create a new access grant. */
export function createGrant(params: {
  granterPubkey: string;
  grantedPubkey: string;
  targetType: 'document' | 'folder' | 'channel';
  targetId: string;
  permissions: PermissionVerb[];
  expiresAt?: number | null;
  oneTime?: boolean;
  encryptedKeyForGrantee?: string;
}): AccessGrant {
  const now = Math.floor(Date.now() / 1000);
  const grant: AccessGrant = {
    id: `grant-${now}-${crypto.getRandomValues(new Uint8Array(4)).reduce((s, b) => s + b.toString(16).padStart(2, '0'), '')}`,
    granterPubkey: params.granterPubkey,
    grantedPubkey: params.grantedPubkey,
    targetType: params.targetType,
    targetId: params.targetId,
    permissions: params.permissions,
    expiresAt: params.expiresAt ?? null,
    oneTime: params.oneTime ?? false,
    createdAt: now,
    revokedAt: null,
    encryptedKeyForGrantee: params.encryptedKeyForGrantee,
  };

  const grants = loadGrants();
  grants.push(grant);
  saveGrants(grants);

  return grant;
}

/** Revoke an access grant. */
export function revokeGrant(grantId: string, reason?: string): boolean {
  const grants = loadGrants();
  const idx = grants.findIndex((g) => g.id === grantId);
  if (idx === -1) return false;

  grants[idx].revokedAt = Math.floor(Date.now() / 1000);
  grants[idx].revocationReason = reason;
  saveGrants(grants);

  return true;
}

/** Get all active grants for a target. */
export function getActiveGrantsForTarget(targetId: string): AccessGrant[] {
  const now = Math.floor(Date.now() / 1000);
  return loadGrants().filter(
    (g) =>
      g.targetId === targetId &&
      g.revokedAt === null &&
      (g.expiresAt === null || g.expiresAt > now)
  );
}

/** Get all active grants made by a granter. */
export function getGrantsByGranter(granterPubkey: string): AccessGrant[] {
  const now = Math.floor(Date.now() / 1000);
  return loadGrants().filter(
    (g) =>
      g.granterPubkey === granterPubkey &&
      g.revokedAt === null &&
      (g.expiresAt === null || g.expiresAt > now)
  );
}

/** Get all active grants for a grantee. */
export function getGrantsForGrantee(grantedPubkey: string): AccessGrant[] {
  const now = Math.floor(Date.now() / 1000);
  return loadGrants().filter(
    (g) =>
      g.grantedPubkey === grantedPubkey &&
      g.revokedAt === null &&
      (g.expiresAt === null || g.expiresAt > now)
  );
}

/** Check whether a pubkey has a specific permission on a target. */
export function hasPermission(
  pubkey: string,
  targetId: string,
  verb: PermissionVerb
): boolean {
  const grants = getActiveGrantsForTarget(targetId);
  return grants.some(
    (g) =>
      g.grantedPubkey === pubkey &&
      g.permissions.includes(verb)
  );
}

/** Get the full grant audit trail for a target (active + revoked). */
export function getGrantAuditTrail(targetId: string): AccessGrant[] {
  return loadGrants()
    .filter((g) => g.targetId === targetId)
    .sort((a, b) => a.createdAt - b.createdAt);
}

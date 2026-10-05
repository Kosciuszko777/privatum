/**
 * MESSAGE RETENTION — Phase VII (NIP-40).
 *
 * Lets the professional set how long sent messages live on relays. We attach
 * a NIP-40 `expiration` tag to the gift wrap so compliant relays drop the
 * event after the deadline, and we locally hide expired messages from the UI.
 *
 * NIP-40 is best-effort at the relay layer (relays MAY keep events past
 * expiry), so this is a data-minimization aid, not a security guarantee —
 * mirroring the honest framing used for Vault retention.
 */

export type MessageRetention =
  | 'never'   // no expiration tag
  | '24h'
  | '7d'
  | '30d'
  | '90d'
  | '1y';

const RETENTION_KEY = 'privatum:messages:retention';

const SECONDS: Record<Exclude<MessageRetention, 'never'>, number> = {
  '24h': 24 * 60 * 60,
  '7d': 7 * 24 * 60 * 60,
  '30d': 30 * 24 * 60 * 60,
  '90d': 90 * 24 * 60 * 60,
  '1y': 365 * 24 * 60 * 60,
};

/** All selectable retention options in display order. */
export const RETENTION_OPTIONS: MessageRetention[] = ['never', '24h', '7d', '30d', '90d', '1y'];

/** Load the user's default message-retention preference (defaults to 'never'). */
export function loadRetention(): MessageRetention {
  const raw = localStorage.getItem(RETENTION_KEY);
  if (raw && (RETENTION_OPTIONS as string[]).includes(raw)) {
    return raw as MessageRetention;
  }
  return 'never';
}

/** Persist the user's default message-retention preference. */
export function saveRetention(retention: MessageRetention): void {
  localStorage.setItem(RETENTION_KEY, retention);
}

/**
 * Compute the NIP-40 expiration timestamp (unix seconds) for a retention
 * policy, relative to `fromTimestamp`. Returns null for 'never'.
 *
 * Because gift wraps use a backdated `created_at` (NIP-59), the expiration is
 * always computed from *now*, never from the wrap's randomized timestamp.
 */
export function computeExpiration(
  retention: MessageRetention,
  fromTimestamp: number,
): number | null {
  if (retention === 'never') return null;
  return fromTimestamp + SECONDS[retention];
}

/** Build the NIP-40 expiration tag, or null if the policy is 'never'. */
export function expirationTag(
  retention: MessageRetention,
  fromTimestamp: number,
): string[] | null {
  const ts = computeExpiration(retention, fromTimestamp);
  return ts === null ? null : ['expiration', String(ts)];
}

/** True if a message with the given expiration (unix seconds) has expired. */
export function isExpired(expiresAt: number | undefined, now: number): boolean {
  return typeof expiresAt === 'number' && expiresAt <= now;
}

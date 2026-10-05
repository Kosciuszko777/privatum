/**
 * RELAY HINTS — Phase VI.
 *
 * NIP-17 delivery routing. A gift-wrapped message only reaches a recipient
 * if it is published to a relay the recipient actually reads. This module
 * resolves a recipient's preferred relays, in priority order:
 *
 *   1. NIP-17 DM relays   (kind 10050) — the canonical "send my DMs here".
 *   2. NIP-65 relay list  (kind 10002) — the recipient's write/read relays.
 *   3. NIP-05 relay hints — discovered during contact resolution (Phase V).
 *   4. App fallback relays — so delivery never silently no-ops.
 *
 * Resolved sets are cached briefly so we don't re-query the network on every
 * keystroke or send.
 */

import type { NPool, NostrEvent } from '@nostrify/nostrify';

/** NIP-17 DM relay list. */
const KIND_DM_RELAYS = 10050;
/** NIP-65 relay list metadata. */
const KIND_RELAY_LIST = 10002;

export interface RelayResolution {
  /** Relay URLs to publish the recipient's gift wrap to. */
  relays: string[];
  /** Where the set came from (best source found). */
  source: 'dm-relays' | 'nip65' | 'nip05' | 'fallback';
}

interface ResolveOptions {
  /** Relay hints already known for this pubkey (e.g. NIP-05 `relays`). */
  nip05Relays?: string[];
  /** App fallback relays (write relays from AppContext). */
  fallbackRelays: string[];
  /** Abort signal. */
  signal?: AbortSignal;
}

// ─── Normalisation + validation ──────────────────────────────────────

/** Normalise a relay URL (trailing slash, lowercase host) for dedupe. */
export function normalizeRelayUrl(url: string): string | null {
  try {
    const u = new URL(url.trim());
    if (u.protocol !== 'wss:' && u.protocol !== 'ws:') return null;
    u.hash = '';
    // Keep path (some relays use paths) but drop a bare trailing slash.
    let normalized = u.toString();
    if (normalized.endsWith('/') && u.pathname === '/') {
      normalized = normalized.slice(0, -1);
    }
    return normalized;
  } catch {
    return null;
  }
}

function dedupeRelays(urls: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const url of urls) {
    const normalized = normalizeRelayUrl(url);
    if (normalized && !seen.has(normalized)) {
      seen.add(normalized);
      out.push(normalized);
    }
  }
  return out;
}

// ─── Extract relays from events ──────────────────────────────────────

function relaysFromDmList(event: NostrEvent): string[] {
  return event.tags.filter(([n]) => n === 'relay').map(([, url]) => url).filter(Boolean);
}

/**
 * NIP-65: `["r", url]` or `["r", url, "read"|"write"]`. For DM delivery we
 * want relays the recipient *reads* from (no marker = both read & write).
 */
function readRelaysFromNip65(event: NostrEvent): string[] {
  const out: string[] = [];
  for (const tag of event.tags) {
    if (tag[0] !== 'r' || !tag[1]) continue;
    const marker = tag[2];
    if (!marker || marker === 'read') out.push(tag[1]);
  }
  return out;
}

// ─── Core resolution ─────────────────────────────────────────────────

const cache = new Map<string, { resolution: RelayResolution; expires: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Resolve the relays to publish a message to for a given recipient.
 * Always returns at least the fallback relays.
 */
export async function resolveRecipientRelays(
  nostr: Pick<NPool, 'query'>,
  pubkey: string,
  opts: ResolveOptions,
): Promise<RelayResolution> {
  const cached = cache.get(pubkey);
  if (cached && cached.expires > Date.now()) {
    return cached.resolution;
  }

  const fallback = dedupeRelays(opts.fallbackRelays);
  let resolution: RelayResolution = { relays: fallback, source: 'fallback' };

  try {
    const events = await nostr.query(
      [{ kinds: [KIND_DM_RELAYS, KIND_RELAY_LIST], authors: [pubkey], limit: 2 }],
      { signal: opts.signal ?? AbortSignal.timeout(4000) },
    );

    const dmList = events.find((e) => e.kind === KIND_DM_RELAYS);
    const nip65 = events.find((e) => e.kind === KIND_RELAY_LIST);

    if (dmList) {
      const relays = dedupeRelays(relaysFromDmList(dmList));
      if (relays.length) resolution = { relays, source: 'dm-relays' };
    } else if (nip65) {
      const relays = dedupeRelays(readRelaysFromNip65(nip65));
      if (relays.length) resolution = { relays, source: 'nip65' };
    }
  } catch {
    // Network failure — fall through to NIP-05 hints / fallback.
  }

  // NIP-05 hints are a weaker signal than published relay lists, but still
  // better than the generic fallback when nothing else was found.
  if (resolution.source === 'fallback' && opts.nip05Relays?.length) {
    const relays = dedupeRelays(opts.nip05Relays);
    if (relays.length) resolution = { relays, source: 'nip05' };
  }

  // Always union the fallback so a tiny/unreachable DM relay set never
  // completely strands a message. Keep the primary source label.
  const merged = dedupeRelays([...resolution.relays, ...fallback]);
  resolution = { relays: merged, source: resolution.source };

  cache.set(pubkey, { resolution, expires: Date.now() + CACHE_TTL_MS });
  return resolution;
}

/** Clear the resolution cache (e.g. on logout / panic-delete). */
export function clearRelayHintCache(): void {
  cache.clear();
}

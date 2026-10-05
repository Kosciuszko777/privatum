/**
 * DM RELAYS — Phase VII.
 *
 * The inbound side of NIP-17 delivery: a professional publishes a kind
 * 10050 "DM relays" event so that *other* people's clients know exactly
 * where to drop gift-wrapped messages for them. Without it, senders fall
 * back to NIP-65 / NIP-05 hints and delivery is less reliable.
 *
 * This module is pure helpers — building the tag set, parsing an event
 * back into URLs, and local persistence of the user's chosen DM relays.
 * Publishing is done by the hook via `useNostrPublish`.
 */

import type { NostrEvent } from '@nostrify/nostrify';
import { normalizeRelayUrl } from '@/lib/relayHints';

/** NIP-17 DM relay list. */
export const KIND_DM_RELAYS = 10050;

const DM_RELAYS_KEY = 'privatum:dmRelays';

interface StoredDmRelays {
  relays: string[];
  updatedAt: number;
}

/** Load the user's locally-cached DM relay URLs. */
export function loadDmRelays(): StoredDmRelays {
  try {
    const raw = localStorage.getItem(DM_RELAYS_KEY);
    if (!raw) return { relays: [], updatedAt: 0 };
    const parsed = JSON.parse(raw) as StoredDmRelays;
    return {
      relays: Array.isArray(parsed.relays) ? parsed.relays : [],
      updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : 0,
    };
  } catch {
    return { relays: [], updatedAt: 0 };
  }
}

/** Persist the user's DM relay URLs locally. */
export function saveDmRelays(relays: string[], updatedAt: number): void {
  localStorage.setItem(DM_RELAYS_KEY, JSON.stringify({ relays, updatedAt }));
}

/** Parse a kind-10050 event into a deduped list of relay URLs. */
export function parseDmRelays(event: NostrEvent): string[] {
  const urls = event.tags
    .filter(([n]) => n === 'relay')
    .map(([, url]) => url)
    .filter(Boolean);

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

/** Build the tag set for a kind-10050 DM relay list. */
export function buildDmRelayTags(relays: string[]): string[][] {
  const seen = new Set<string>();
  const tags: string[][] = [];
  for (const url of relays) {
    const normalized = normalizeRelayUrl(url);
    if (normalized && !seen.has(normalized)) {
      seen.add(normalized);
      tags.push(['relay', normalized]);
    }
  }
  return tags;
}

/** Normalize a free-text relay URL into a `wss://` URL, or null if invalid. */
export function toRelayUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  // Accept bare hostnames by prefixing the secure scheme.
  const candidate = /^wss?:\/\//i.test(trimmed) ? trimmed : `wss://${trimmed}`;
  return normalizeRelayUrl(candidate);
}

/** Clear the locally cached DM relays (panic-delete / logout). */
export function clearDmRelays(): void {
  localStorage.removeItem(DM_RELAYS_KEY);
}

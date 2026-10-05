/**
 * NIP-05 resolution — Phase V.
 *
 * Maps a DNS-based internet identifier (name@domain) to a Nostr pubkey by
 * fetching `https://<domain>/.well-known/nostr.json?name=<local-part>`.
 *
 * Per NIP-05, this is *identification* (and, for organizations, a form of
 * attestation), not blanket verification. Privatum uses it so professionals
 * and clients never have to paste raw public keys — they type an email-like
 * handle and we resolve + cross-check it.
 *
 * Browser CORS can block `.well-known/nostr.json`. When a direct fetch fails
 * we retry through the configured CORS proxy so resolution still works for
 * domains that haven't set `Access-Control-Allow-Origin: *`.
 */

const CORS_PROXY = 'https://proxy.shakespeare.diy/?url=';

/** A successfully resolved NIP-05 identifier. */
export interface Nip05Resolution {
  /** The full identifier as entered, normalized (e.g. "anna@meier-law.ch"). */
  identifier: string;
  /** Local part (before @). */
  name: string;
  /** Domain (after @). */
  domain: string;
  /** Resolved hex pubkey (lowercase). */
  pubkey: string;
  /** Optional relay hints for this pubkey, per NIP-05 `relays`. */
  relays: string[];
}

/** Shape of a `.well-known/nostr.json` document. */
interface WellKnownNostr {
  names?: Record<string, string>;
  relays?: Record<string, string[]>;
}

/** Validate the `<local-part>` charset allowed by NIP-05. */
const LOCAL_PART_RE = /^[a-z0-9\-_.]+$/i;
const DOMAIN_RE = /^[a-z0-9.-]+\.[a-z]{2,}$/i;

/** Parse and validate a NIP-05 identifier into its parts. */
export function parseNip05(input: string): { name: string; domain: string } | null {
  const trimmed = input.trim().toLowerCase();
  // Treat a bare "@domain" or "domain" root identifier as "_@domain".
  const normalized = trimmed.startsWith('@') ? `_${trimmed}` : trimmed;

  const at = normalized.indexOf('@');
  if (at === -1) {
    // Bare domain → root identifier.
    if (DOMAIN_RE.test(normalized)) return { name: '_', domain: normalized };
    return null;
  }

  const name = normalized.slice(0, at);
  const domain = normalized.slice(at + 1);
  if (!name || !LOCAL_PART_RE.test(name)) return null;
  if (!DOMAIN_RE.test(domain)) return null;
  return { name, domain };
}

/** Is this string a plausible NIP-05 identifier (has an @ or is a domain)? */
export function looksLikeNip05(input: string): boolean {
  return parseNip05(input) !== null;
}

/** Format a resolved identifier for display, collapsing root `_@domain`. */
export function formatNip05(identifier: string): string {
  const parsed = parseNip05(identifier);
  if (parsed?.name === '_') return parsed.domain;
  return identifier.trim().toLowerCase();
}

async function fetchWellKnown(domain: string, name: string): Promise<WellKnownNostr | null> {
  const target = `https://${domain}/.well-known/nostr.json?name=${encodeURIComponent(name)}`;

  // Try direct first (works when the server sends CORS headers), then proxy.
  const attempts = [target, `${CORS_PROXY}${encodeURIComponent(target)}`];

  for (const url of attempts) {
    try {
      const res = await fetch(url, {
        // NIP-05: fetchers MUST ignore redirects.
        redirect: 'error',
        signal: AbortSignal.timeout(8000),
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) continue;
      const json = (await res.json()) as WellKnownNostr;
      if (json && typeof json === 'object') return json;
    } catch {
      // Try the next attempt (proxy) on any network/CORS/redirect failure.
      continue;
    }
  }
  return null;
}

/**
 * Resolve a NIP-05 identifier to a pubkey + relay hints.
 * Returns null if the identifier is malformed or cannot be resolved.
 */
export async function resolveNip05(input: string): Promise<Nip05Resolution | null> {
  const parsed = parseNip05(input);
  if (!parsed) return null;

  const doc = await fetchWellKnown(parsed.domain, parsed.name);
  if (!doc?.names) return null;

  const pubkey = doc.names[parsed.name];
  if (!pubkey || !/^[0-9a-f]{64}$/i.test(pubkey)) return null;

  const normalizedPubkey = pubkey.toLowerCase();
  const relays = doc.relays?.[normalizedPubkey] ?? [];

  return {
    identifier: parsed.name === '_' ? parsed.domain : `${parsed.name}@${parsed.domain}`,
    name: parsed.name,
    domain: parsed.domain,
    pubkey: normalizedPubkey,
    relays: relays.filter((r) => typeof r === 'string' && r.startsWith('wss://')),
  };
}

/**
 * Confirm that a pubkey's kind-0 `nip05` field actually points back at the
 * given identifier (the reverse check NIP-05 recommends). Pass the `nip05`
 * value from the user's metadata; returns true when it resolves to `pubkey`.
 */
export async function verifyNip05ForPubkey(
  nip05: string | undefined,
  pubkey: string,
): Promise<boolean> {
  if (!nip05) return false;
  const resolution = await resolveNip05(nip05);
  return resolution?.pubkey === pubkey.toLowerCase();
}

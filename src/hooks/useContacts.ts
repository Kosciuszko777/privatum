/**
 * useContacts — Reactive trusted-contacts management (Phase V).
 *
 * Resolves a typed identifier (NIP-05, npub, or hex) into a verified
 * contact: looks up the pubkey, fetches the kind-0 profile, performs the
 * NIP-05 reverse-check, parses the Privatum verification tier, and saves
 * the result to the local registry. The pubkey is always the primary
 * reference (NIP-05 identifiers are only hints).
 */

import { useState, useCallback } from 'react';
import { useNostr } from '@nostrify/react';
import { NSchema as n, type NostrMetadata } from '@nostrify/nostrify';
import { nip19 } from 'nostr-tools';
import {
  loadContacts, upsertContact, removeContact as removeContactStore,
  type Contact,
} from '@/lib/contacts';
import { resolveNip05, parseNip05, looksLikeNip05 } from '@/lib/nip05';
import { parsePrivatumProfile, type VerificationTier } from '@/lib/signer';

/** Result of resolving a free-text identifier. */
export interface ResolveResult {
  pubkey: string;
  name: string;
  title?: string;
  picture?: string;
  nip05?: string;
  nip05Verified: boolean;
  verificationTier?: VerificationTier;
  relays: string[];
}

/** Parse an npub/nprofile/hex string into a hex pubkey, or null. */
function parseRawPubkey(input: string): { pubkey: string; relays: string[] } | null {
  const trimmed = input.trim();
  if (/^[0-9a-f]{64}$/i.test(trimmed)) {
    return { pubkey: trimmed.toLowerCase(), relays: [] };
  }
  try {
    const decoded = nip19.decode(trimmed);
    if (decoded.type === 'npub') return { pubkey: decoded.data, relays: [] };
    if (decoded.type === 'nprofile') {
      return { pubkey: decoded.data.pubkey, relays: decoded.data.relays ?? [] };
    }
  } catch {
    return null;
  }
  return null;
}

export function useContacts() {
  const { nostr } = useNostr();
  const [contacts, setContacts] = useState<Contact[]>(loadContacts);
  const [isResolving, setIsResolving] = useState(false);

  const refresh = useCallback(() => setContacts(loadContacts()), []);

  // ─── Fetch kind-0 metadata for a pubkey ─────────────────────────

  const fetchProfile = useCallback(
    async (pubkey: string): Promise<NostrMetadata | undefined> => {
      try {
        const [event] = await nostr.query(
          [{ kinds: [0], authors: [pubkey], limit: 1 }],
          { signal: AbortSignal.timeout(4000) },
        );
        if (!event) return undefined;
        return n.json().pipe(n.metadata()).parse(event.content);
      } catch {
        return undefined;
      }
    },
    [nostr],
  );

  // ─── Resolve a free-text identifier into a contact candidate ────

  const resolve = useCallback(
    async (input: string): Promise<ResolveResult | null> => {
      setIsResolving(true);
      try {
        let pubkey: string | undefined;
        let relays: string[] = [];
        let nip05Identifier: string | undefined;
        let nip05Verified = false;

        if (looksLikeNip05(input)) {
          const resolution = await resolveNip05(input);
          if (!resolution) return null;
          pubkey = resolution.pubkey;
          relays = resolution.relays;
          nip05Identifier = resolution.identifier;
          nip05Verified = true; // forward resolution matched
        } else {
          const raw = parseRawPubkey(input);
          if (!raw) return null;
          pubkey = raw.pubkey;
          relays = raw.relays;
        }

        if (!pubkey) return null;

        const metadata = await fetchProfile(pubkey);
        const profile = metadata
          ? parsePrivatumProfile(metadata as NostrMetadata & Record<string, unknown>)
          : undefined;

        // If we resolved via NIP-05, perform the reverse check: the kind-0
        // nip05 should point back to this identifier (defence-in-depth).
        if (nip05Identifier && metadata?.nip05) {
          const back = parseNip05(metadata.nip05);
          const forward = parseNip05(nip05Identifier);
          nip05Verified = !!back && !!forward
            && back.name === forward.name && back.domain === forward.domain;
        }

        // If the user pasted a key but the profile advertises a NIP-05,
        // verify it so we can display the identifier with confidence.
        if (!nip05Identifier && metadata?.nip05) {
          const resolution = await resolveNip05(metadata.nip05);
          if (resolution?.pubkey === pubkey) {
            nip05Identifier = resolution.identifier;
            nip05Verified = true;
            if (relays.length === 0) relays = resolution.relays;
          }
        }

        const name = metadata?.name
          || metadata?.display_name
          || profile?.privatum_handle
          || `${nip19.npubEncode(pubkey).slice(0, 12)}…`;

        return {
          pubkey,
          name,
          title: profile?.privatum_title || metadata?.about || undefined,
          picture: metadata?.picture,
          nip05: nip05Identifier,
          nip05Verified,
          verificationTier: profile?.privatum_verification_tier,
          relays,
        };
      } finally {
        setIsResolving(false);
      }
    },
    [fetchProfile],
  );

  // ─── Save / remove ──────────────────────────────────────────────

  const addContact = useCallback((result: ResolveResult) => {
    const updated = upsertContact({
      pubkey: result.pubkey,
      name: result.name,
      title: result.title,
      nip05: result.nip05,
      nip05Verified: result.nip05Verified,
      picture: result.picture,
      verificationTier: result.verificationTier,
      relays: result.relays,
    });
    setContacts(updated);
  }, []);

  const removeContact = useCallback((pubkey: string) => {
    setContacts(removeContactStore(pubkey));
  }, []);

  const getContact = useCallback(
    (pubkey: string) => contacts.find((c) => c.pubkey === pubkey),
    [contacts],
  );

  return {
    contacts,
    isResolving,
    resolve,
    addContact,
    removeContact,
    getContact,
    refresh,
  };
}

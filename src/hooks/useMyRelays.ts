/**
 * useMyRelays — Phase VII.
 *
 * Manages the professional's OWN inbound-delivery relays so that senders can
 * reliably reach them:
 *  - NIP-17 DM relays (kind 10050): where I want to receive gift-wrapped DMs.
 *  - NIP-65 relay list (kind 10002): my general read/write relays, managed via
 *    AppContext (the pool reads/writes from these) and re-published here.
 *
 * On login it loads any existing kind-10050 event from the network so the
 * list round-trips across devices.
 */

import { useState, useCallback, useEffect } from 'react';
import { useNostr } from '@nostrify/react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAppContext } from '@/hooks/useAppContext';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import {
  KIND_DM_RELAYS,
  loadDmRelays, saveDmRelays, parseDmRelays, buildDmRelayTags, toRelayUrl,
} from '@/lib/dmRelays';

export interface RelayEntry {
  url: string;
  read: boolean;
  write: boolean;
}

export function useMyRelays() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { config, updateConfig } = useAppContext();
  const { mutateAsync: publishEvent } = useNostrPublish();

  const [dmRelays, setDmRelays] = useState<string[]>(() => loadDmRelays().relays);
  const [dmUpdatedAt, setDmUpdatedAt] = useState<number>(() => loadDmRelays().updatedAt);
  const [isPublishing, setIsPublishing] = useState(false);

  // ─── Load the user's published kind-10050 on login ──────────────

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    (async () => {
      try {
        const [event] = await nostr.query(
          [{ kinds: [KIND_DM_RELAYS], authors: [user.pubkey], limit: 1 }],
          { signal: AbortSignal.timeout(5000) },
        );
        if (!event || cancelled) return;
        if (event.created_at > loadDmRelays().updatedAt) {
          const relays = parseDmRelays(event);
          if (relays.length) {
            saveDmRelays(relays, event.created_at);
            setDmRelays(relays);
            setDmUpdatedAt(event.created_at);
          }
        }
      } catch {
        // Offline / not found — keep whatever is cached locally.
      }
    })();

    return () => { cancelled = true; };
  }, [user, nostr]);

  // ─── NIP-65 relays (from AppContext) ────────────────────────────

  const nip65Relays: RelayEntry[] = config.relayMetadata.relays;

  const publishNip65 = useCallback(
    async (relays: RelayEntry[]) => {
      const now = Math.floor(Date.now() / 1000);
      updateConfig((current) => ({
        ...current,
        relayMetadata: { relays, updatedAt: now },
      }));

      if (!user) return;
      const tags = relays
        .map((r) => {
          if (r.read && r.write) return ['r', r.url];
          if (r.read) return ['r', r.url, 'read'];
          if (r.write) return ['r', r.url, 'write'];
          return null;
        })
        .filter((t): t is string[] => t !== null);
      await publishEvent({ kind: 10002, content: '', tags });
    },
    [user, updateConfig, publishEvent],
  );

  const addNip65Relay = useCallback(
    async (input: string): Promise<boolean> => {
      const url = toRelayUrl(input);
      if (!url || nip65Relays.some((r) => r.url === url)) return false;
      await publishNip65([...nip65Relays, { url, read: true, write: true }]);
      return true;
    },
    [nip65Relays, publishNip65],
  );

  const removeNip65Relay = useCallback(
    async (url: string) => {
      if (nip65Relays.length <= 1) return;
      await publishNip65(nip65Relays.filter((r) => r.url !== url));
    },
    [nip65Relays, publishNip65],
  );

  const toggleNip65Flag = useCallback(
    async (url: string, flag: 'read' | 'write') => {
      await publishNip65(
        nip65Relays.map((r) => (r.url === url ? { ...r, [flag]: !r[flag] } : r)),
      );
    },
    [nip65Relays, publishNip65],
  );

  // ─── DM relays (kind 10050) ─────────────────────────────────────

  const persistDmRelays = useCallback((relays: string[]) => {
    const now = Math.floor(Date.now() / 1000);
    saveDmRelays(relays, now);
    setDmRelays(relays);
    setDmUpdatedAt(now);
  }, []);

  const addDmRelay = useCallback((input: string): boolean => {
    const url = toRelayUrl(input);
    if (!url || dmRelays.includes(url)) return false;
    persistDmRelays([...dmRelays, url]);
    return true;
  }, [dmRelays, persistDmRelays]);

  const removeDmRelay = useCallback((url: string) => {
    persistDmRelays(dmRelays.filter((r) => r !== url));
  }, [dmRelays, persistDmRelays]);

  const publishDmRelays = useCallback(async (): Promise<boolean> => {
    if (!user) return false;
    setIsPublishing(true);
    try {
      await publishEvent({
        kind: KIND_DM_RELAYS,
        content: '',
        tags: buildDmRelayTags(dmRelays),
      });
      return true;
    } finally {
      setIsPublishing(false);
    }
  }, [user, dmRelays, publishEvent]);

  return {
    // DM relays (kind 10050)
    dmRelays,
    dmUpdatedAt,
    addDmRelay,
    removeDmRelay,
    publishDmRelays,
    isPublishing,
    // NIP-65 relays (kind 10002)
    nip65Relays,
    addNip65Relay,
    removeNip65Relay,
    toggleNip65Flag,
  };
}

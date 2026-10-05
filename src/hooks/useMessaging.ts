/**
 * useMessaging — Reactive secure-messaging state (Phase IV).
 *
 * Loads the user's gift-wrapped NIP-17 messages from relays, decrypts
 * them with the user's signer, caches the plaintext locally, and exposes
 * send/read operations. Every sent and received message is recorded in the
 * integrity hash chain (metadata only — never content).
 */

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import {
  KIND_GIFT_WRAP,
  buildChatRumor,
  createGiftWraps,
  unwrapGiftWrap,
  rumorToMessage,
  loadConversations,
  cacheMessage,
  type Conversation,
  type SecureMessage,
  type MessageAttachment,
  type Nip44Signer,
} from '@/lib/messaging';
import { createChainEntry, storeChain, loadChain, getLatestHash } from '@/lib/hashchain';

const MESSAGES_CHANNEL = 'messages';

export function useMessaging() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const [conversations, setConversations] = useState<Conversation[]>(() =>
    user ? loadConversations(user.pubkey) : [],
  );
  const [isSending, setIsSending] = useState(false);
  const processedIds = useRef<Set<string>>(new Set());

  const refreshConversations = useCallback(() => {
    if (!user) return;
    setConversations(loadConversations(user.pubkey));
  }, [user]);

  // ─── Fetch + decrypt incoming gift wraps ────────────────────────

  const { data: _wraps, isLoading } = useQuery({
    queryKey: ['secure-messages', user?.pubkey],
    enabled: !!user?.pubkey && !!user?.signer?.nip44,
    refetchInterval: 20_000,
    queryFn: async (c) => {
      if (!user) return [];
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(8000)]);
      const events = await nostr.query(
        [{ kinds: [KIND_GIFT_WRAP], '#p': [user.pubkey], limit: 200 }],
        { signal },
      );

      for (const wrap of events) {
        if (processedIds.current.has(wrap.id)) continue;
        processedIds.current.add(wrap.id);

        const rumor = await unwrapGiftWrap(user.signer as unknown as Nip44Signer, wrap);
        if (!rumor) continue;

        const message = rumorToMessage(rumor, user.pubkey);
        const before = JSON.stringify(cacheKeyState());
        cacheMessage(message, user.pubkey);
        const after = JSON.stringify(cacheKeyState());

        // Record newly-seen received messages in the integrity chain.
        if (before !== after && message.direction === 'received') {
          await recordChainEntry(message);
        }
      }

      refreshConversations();
      return events;
    },
  });

  // Snapshot of cached ids to detect additions cheaply.
  function cacheKeyState(): string[] {
    if (!user) return [];
    return loadConversations(user.pubkey).flatMap((conv) => conv.messages.map((m) => m.id));
  }

  async function recordChainEntry(message: SecureMessage) {
    const chain = loadChain(MESSAGES_CHANNEL);
    const previousHash = getLatestHash(chain);
    const entry = await createChainEntry({
      documentHash: message.attachment?.hash || message.id,
      channelId: MESSAGES_CHANNEL,
      direction: message.direction === 'sent' ? 'outbound' : 'inbound',
      previousHash,
      filename: message.attachment?.filename,
      fileSize: message.attachment?.size,
    });
    chain.push(entry);
    storeChain(MESSAGES_CHANNEL, chain);
  }

  // Keep conversations fresh when the user changes.
  useEffect(() => {
    refreshConversations();
    processedIds.current = new Set();
  }, [refreshConversations]);

  // ─── Send a message ─────────────────────────────────────────────

  const sendMessage = useCallback(
    async (params: {
      recipientPubkey: string;
      content: string;
      attachment?: MessageAttachment;
    }): Promise<boolean> => {
      if (!user) throw new Error('Not logged in');
      const signer = user.signer as unknown as Nip44Signer;
      if (!signer.nip44) {
        throw new Error('Your signer does not support NIP-44 encryption.');
      }

      setIsSending(true);
      try {
        const rumor = await buildChatRumor({
          senderPubkey: user.pubkey,
          recipientPubkey: params.recipientPubkey,
          content: params.content,
          attachment: params.attachment,
        });

        const { toRecipient, toSelf } = await createGiftWraps({
          signer,
          recipientPubkey: params.recipientPubkey,
          rumor,
        });

        // Publish both wraps to the relay pool.
        await Promise.all([
          nostr.event(toRecipient, { signal: AbortSignal.timeout(10_000) }),
          nostr.event(toSelf, { signal: AbortSignal.timeout(10_000) }),
        ]);

        // Optimistically cache the sent message + record integrity entry.
        const message = rumorToMessage(rumor, user.pubkey);
        cacheMessage(message, user.pubkey);
        processedIds.current.add(toSelf.id);
        processedIds.current.add(toRecipient.id);
        await recordChainEntry(message);
        refreshConversations();

        return true;
      } finally {
        setIsSending(false);
      }
    },
    // recordChainEntry & refreshConversations are stable within render scope
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, nostr],
  );

  // ─── Derived helpers ────────────────────────────────────────────

  const getConversation = useCallback(
    (peerPubkey: string): Conversation | undefined =>
      conversations.find((c) => c.peerPubkey === peerPubkey),
    [conversations],
  );

  const totalUnreadPeers = useMemo(() => conversations.length, [conversations]);

  const canMessage = !!user?.signer?.nip44;

  return {
    conversations,
    isLoading,
    isSending,
    canMessage,
    sendMessage,
    getConversation,
    refreshConversations,
    totalUnreadPeers,
  };
}

/**
 * useMessaging — Reactive secure-messaging state (Phase IV + VI).
 *
 * Loads the user's gift-wrapped NIP-17 messages from relays, decrypts them
 * with the user's signer, caches the plaintext locally, and exposes
 * send/read operations.
 *
 * Phase VI additions:
 *  - Targeted delivery: each recipient's gift wrap is published to *their*
 *    preferred relays (NIP-17 kind 10050 → NIP-65 → NIP-05 hints →
 *    fallback), not just the sender's write relays. The self-copy goes to
 *    the user's own write relays.
 *  - Read receipts: incoming receipts mark sent messages `read`; viewing a
 *    conversation sends sealed receipts back for the peer's messages.
 *
 * Every sent and received message is recorded in the integrity hash chain
 * (metadata only — never content).
 */

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAppContext } from '@/hooks/useAppContext';
import {
  KIND_GIFT_WRAP,
  buildChatRumor,
  buildReceiptRumor,
  createGiftWraps,
  createRecipientGiftWrap,
  unwrapGiftWrap,
  rumorToMessage,
  isReceiptRumor,
  receiptMessageIds,
  loadConversations,
  cacheMessage,
  updateCachedMessage,
  applyReadReceipts,
  unacknowledgedReceivedIds,
  markReceiptsSent,
  type Conversation,
  type SecureMessage,
  type MessageAttachment,
  type Nip44Signer,
} from '@/lib/messaging';
import { resolveRecipientRelays } from '@/lib/relayHints';
import { getContact } from '@/lib/contacts';
import { createChainEntry, storeChain, loadChain, getLatestHash } from '@/lib/hashchain';

const MESSAGES_CHANNEL = 'messages';

export function useMessaging() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { config } = useAppContext();
  const [conversations, setConversations] = useState<Conversation[]>(() =>
    user ? loadConversations(user.pubkey) : [],
  );
  const [isSending, setIsSending] = useState(false);
  const processedIds = useRef<Set<string>>(new Set());

  const refreshConversations = useCallback(() => {
    if (!user) return;
    setConversations(loadConversations(user.pubkey));
  }, [user]);

  // Write relays from the user's NIP-65 config, used as fallback + self-copy.
  const writeRelays = useMemo(
    () => config.relayMetadata.relays.filter((r) => r.write).map((r) => r.url),
    [config.relayMetadata],
  );

  // ─── Fetch + decrypt incoming gift wraps ────────────────────────

  const { data: _wraps, isLoading } = useQuery({
    queryKey: ['secure-messages', user?.pubkey],
    enabled: !!user?.pubkey && !!user?.signer?.nip44,
    refetchInterval: 20_000,
    queryFn: async (c) => {
      if (!user) return [];
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(8000)]);
      const events = await nostr.query(
        [{ kinds: [KIND_GIFT_WRAP], '#p': [user.pubkey], limit: 300 }],
        { signal },
      );

      let receiptsToApply: string[] = [];

      for (const wrap of events) {
        if (processedIds.current.has(wrap.id)) continue;
        processedIds.current.add(wrap.id);

        const rumor = await unwrapGiftWrap(user.signer as unknown as Nip44Signer, wrap);
        if (!rumor) continue;

        // Read receipts: mark the acknowledged sent messages as read.
        if (isReceiptRumor(rumor)) {
          receiptsToApply = receiptsToApply.concat(receiptMessageIds(rumor));
          continue;
        }

        const message = rumorToMessage(rumor, user.pubkey);
        const before = JSON.stringify(cacheKeyState());
        cacheMessage(message, user.pubkey);
        const after = JSON.stringify(cacheKeyState());

        // Record newly-seen received messages in the integrity chain.
        if (before !== after && message.direction === 'received') {
          await recordChainEntry(message);
        }
      }

      if (receiptsToApply.length) {
        applyReadReceipts(receiptsToApply);
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

  // ─── Resolve recipient relays + publish a wrap there ─────────────

  const publishToRecipient = useCallback(
    async (recipientPubkey: string, wrap: Parameters<typeof nostr.event>[0]) => {
      const contact = getContact(recipientPubkey);
      const resolution = await resolveRecipientRelays(nostr, recipientPubkey, {
        nip05Relays: contact?.relays,
        fallbackRelays: writeRelays,
      });

      let accepted = 0;
      if (resolution.relays.length > 0) {
        const group = nostr.group(resolution.relays);
        try {
          await group.event(wrap, { signal: AbortSignal.timeout(10_000) });
          accepted = resolution.relays.length;
        } catch {
          // Fall back to the default pool if the targeted group failed.
          try {
            await nostr.event(wrap, { signal: AbortSignal.timeout(10_000) });
            accepted = Math.max(writeRelays.length, 1);
          } catch {
            accepted = 0;
          }
        }
      } else {
        await nostr.event(wrap, { signal: AbortSignal.timeout(10_000) });
        accepted = Math.max(writeRelays.length, 1);
      }

      return { accepted, source: resolution.source };
    },
    [nostr, writeRelays],
  );

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

        // Cache optimistically as "sending" so the UI shows status at once.
        const message: SecureMessage = {
          ...rumorToMessage(rumor, user.pubkey),
          deliveryStatus: 'sending',
        };
        cacheMessage(message, user.pubkey);
        processedIds.current.add(toSelf.id);
        processedIds.current.add(toRecipient.id);
        refreshConversations();

        // Deliver: recipient wrap → their relays; self-copy → our relays.
        const [recipientResult] = await Promise.all([
          publishToRecipient(params.recipientPubkey, toRecipient),
          nostr.event(toSelf, { signal: AbortSignal.timeout(10_000) }).catch(() => undefined),
        ]);

        updateCachedMessage(rumor.id, {
          deliveryStatus: recipientResult.accepted > 0 ? 'sent' : 'failed',
          relayCount: recipientResult.accepted,
          relaySource: recipientResult.source,
        });
        await recordChainEntry(message);
        refreshConversations();

        return recipientResult.accepted > 0;
      } finally {
        setIsSending(false);
      }
    },
    // recordChainEntry & refreshConversations are stable within render scope
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, nostr, publishToRecipient],
  );

  // ─── Send read receipts for a peer's unacknowledged messages ─────

  const sendReadReceipts = useCallback(
    async (peerPubkey: string): Promise<void> => {
      if (!user) return;
      const signer = user.signer as unknown as Nip44Signer;
      if (!signer.nip44) return;

      const ids = unacknowledgedReceivedIds(peerPubkey);
      if (ids.length === 0) return;

      try {
        const rumor = await buildReceiptRumor({
          senderPubkey: user.pubkey,
          recipientPubkey: peerPubkey,
          messageIds: ids,
        });
        const wrap = await createRecipientGiftWrap({
          signer,
          recipientPubkey: peerPubkey,
          rumor,
        });
        processedIds.current.add(wrap.id);
        await publishToRecipient(peerPubkey, wrap);
        markReceiptsSent(ids);
      } catch {
        // Receipts are best-effort; a failure just means we retry later.
      }
    },
    [user, publishToRecipient],
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
    sendReadReceipts,
    getConversation,
    refreshConversations,
    totalUnreadPeers,
  };
}

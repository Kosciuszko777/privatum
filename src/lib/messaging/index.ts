/**
 * SECURE MESSAGING — Phase IV.
 *
 * §6: A private, end-to-end encrypted channel for professionals to
 * correspond with clients and colleagues. Built on the NIP-17 private
 * direct message pattern, sealed (NIP-59 kind 13) and gift-wrapped
 * (NIP-59 kind 1059) so that neither Privatum nor relays can read
 * message content, metadata, or even reliably correlate participants.
 *
 * - Rumor:      kind 14 (unsigned chat message)
 * - Seal:       kind 13 (NIP-44 encrypted rumor, signed by sender)
 * - Gift wrap:  kind 1059 (NIP-44 encrypted seal, signed by an
 *               ephemeral key, p-tagged to the recipient)
 *
 * The plaintext conversation is cached locally (localStorage) after
 * decryption so the UI is instant and works offline. The cache holds
 * only what the logged-in professional already decrypted on this device.
 */

import { finalizeEvent, generateSecretKey, getPublicKey } from 'nostr-tools';
import type { NostrEvent } from '@nostrify/nostrify';

/** NIP-17 chat message rumor kind. */
export const KIND_CHAT = 14;
/** NIP-59 seal kind. */
export const KIND_SEAL = 13;
/** NIP-59 gift wrap kind. */
export const KIND_GIFT_WRAP = 1059;

/**
 * Delivery status of a sent message (Phase VI).
 * - `sending`:   publish in-flight.
 * - `sent`:      accepted by at least one of the recipient's relays.
 * - `failed`:    no relay accepted the gift wrap.
 * - `read`:      recipient returned a read receipt.
 * Received messages carry no delivery status.
 */
export type DeliveryStatus = 'sending' | 'sent' | 'failed' | 'read';

/** A single decrypted message in a conversation. */
export interface SecureMessage {
  /** Rumor id (deterministic hash of the unsigned rumor). */
  id: string;
  /** Author pubkey (hex). */
  pubkey: string;
  /** Plaintext message body. */
  content: string;
  /** Unix seconds the message was authored. */
  createdAt: number;
  /** Pubkeys this message was addressed to (hex). */
  recipients: string[];
  /** Optional reference to an encrypted vault document. */
  attachment?: MessageAttachment;
  /** Delivery direction relative to the logged-in user. */
  direction: 'sent' | 'received';
  /** Delivery status (sent messages only). */
  deliveryStatus?: DeliveryStatus;
  /** How many relays accepted the gift wrap (sent messages). */
  relayCount?: number;
  /** Relay source label for the recipient (sent messages). */
  relaySource?: string;
  /** True once this received message has had a read receipt sent back. */
  receiptSent?: boolean;
  /** NIP-40 expiration (unix seconds); message is hidden/dropped after this. */
  expiresAt?: number;
}

/** A reference to an encrypted document shared inside a message. */
export interface MessageAttachment {
  /** Display filename (never the content). */
  filename: string;
  /** Size in bytes. */
  size: number;
  /** SHA-256 hash of the plaintext for integrity. */
  hash: string;
  /** Vault document id this attachment points to (local reference). */
  documentId?: string;
}

/** A conversation thread with a single peer. */
export interface Conversation {
  /** Peer pubkey (hex). */
  peerPubkey: string;
  /** Decrypted messages, oldest first. */
  messages: SecureMessage[];
  /** Unix seconds of the most recent message. */
  lastActivity: number;
}

// ─── Minimal signer interface (subset of NIP-07) ─────────────────────

export interface Nip44Signer {
  getPublicKey(): Promise<string>;
  nip44?: {
    encrypt(pubkey: string, plaintext: string): Promise<string>;
    decrypt(pubkey: string, ciphertext: string): Promise<string>;
  };
}

// ─── Rumor construction ──────────────────────────────────────────────

/** An unsigned NIP-17 chat rumor (no `sig`). */
export interface ChatRumor {
  id: string;
  pubkey: string;
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
}

/**
 * Deterministically hash an unsigned event to produce its id,
 * matching the Nostr event id algorithm (NIP-01).
 */
async function computeRumorId(evt: Omit<ChatRumor, 'id'>): Promise<string> {
  const serialized = JSON.stringify([
    0,
    evt.pubkey,
    evt.created_at,
    evt.kind,
    evt.tags,
    evt.content,
  ]);
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(serialized));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Build the unsigned kind-14 chat rumor. */
export async function buildChatRumor(params: {
  senderPubkey: string;
  recipientPubkey: string;
  content: string;
  attachment?: MessageAttachment;
  createdAt?: number;
}): Promise<ChatRumor> {
  const created_at = params.createdAt ?? Math.floor(Date.now() / 1000);
  const tags: string[][] = [['p', params.recipientPubkey]];

  if (params.attachment) {
    // NIP-17 does not define attachments; Privatum carries an encrypted
    // document reference as a custom tag. The document itself lives in the
    // Vault — this only points at it, never the content.
    tags.push([
      'privatum-attachment',
      params.attachment.filename,
      String(params.attachment.size),
      params.attachment.hash,
      params.attachment.documentId ?? '',
    ]);
  }

  const base: Omit<ChatRumor, 'id'> = {
    pubkey: params.senderPubkey,
    created_at,
    kind: KIND_CHAT,
    tags,
    content: params.content,
  };

  const id = await computeRumorId(base);
  return { ...base, id };
}

// ─── Read receipts (Phase VI) ────────────────────────────────────────
//
// A read receipt is a kind-14 rumor with empty content and a
// `privatum-receipt` tag referencing the message id(s) being acknowledged.
// It travels through the exact same seal + gift-wrap pipeline, so receipts
// enjoy the same metadata privacy as ordinary messages.

/** Build an unsigned read-receipt rumor acknowledging one or more messages. */
export async function buildReceiptRumor(params: {
  senderPubkey: string;
  recipientPubkey: string;
  messageIds: string[];
  createdAt?: number;
}): Promise<ChatRumor> {
  const created_at = params.createdAt ?? Math.floor(Date.now() / 1000);
  const tags: string[][] = [['p', params.recipientPubkey]];
  for (const id of params.messageIds) {
    tags.push(['privatum-receipt', id]);
  }

  const base: Omit<ChatRumor, 'id'> = {
    pubkey: params.senderPubkey,
    created_at,
    kind: KIND_CHAT,
    tags,
    content: '',
  };

  const id = await computeRumorId(base);
  return { ...base, id };
}

/** Extract the acknowledged message ids from a rumor, or [] if not a receipt. */
export function receiptMessageIds(rumor: ChatRumor): string[] {
  return rumor.tags.filter(([n]) => n === 'privatum-receipt').map(([, v]) => v).filter(Boolean);
}

/** Is this rumor a read receipt (carries at least one receipt tag)? */
export function isReceiptRumor(rumor: ChatRumor): boolean {
  return rumor.tags.some(([n]) => n === 'privatum-receipt');
}

// ─── Gift wrapping (NIP-59) ──────────────────────────────────────────

/** Random timestamp up to two days in the past, to blur metadata (NIP-59). */
function randomizedTimestamp(): number {
  const now = Math.floor(Date.now() / 1000);
  const twoDays = 2 * 24 * 60 * 60;
  return now - Math.floor(Math.random() * twoDays);
}

/**
 * Seal a rumor (kind 13) encrypted to the recipient and signed by the sender.
 */
async function sealRumor(
  signer: Nip44Signer,
  rumor: ChatRumor,
  recipientPubkey: string,
): Promise<NostrEvent> {
  if (!signer.nip44) {
    throw new Error('Signer does not support NIP-44 encryption');
  }
  const senderPubkey = await signer.getPublicKey();
  const encrypted = await signer.nip44.encrypt(recipientPubkey, JSON.stringify(rumor));

  // The seal must be signed by the real sender. We rely on the app signer
  // via a thin shim: we need a signed event, so we ask the signer to sign.
  // Signers expose signEvent per NIP-07; cast through a compatible shape.
  const sealTemplate = {
    pubkey: senderPubkey,
    created_at: randomizedTimestamp(),
    kind: KIND_SEAL,
    tags: [] as string[][],
    content: encrypted,
  };

  return signEventWithSigner(signer, sealTemplate);
}

/**
 * Wrap a seal in a gift wrap (kind 1059), encrypted to the recipient and
 * signed by a one-time ephemeral key so the sender is hidden at the relay.
 */
async function wrapSeal(
  seal: NostrEvent,
  recipientPubkey: string,
  expirationTag?: string[] | null,
): Promise<NostrEvent> {
  const ephemeralSk = generateSecretKey();
  const ephemeralPk = getPublicKey(ephemeralSk);

  // NIP-44 encrypt the seal to the recipient using the ephemeral key.
  const conversationKey = await deriveNip44Key(ephemeralSk, recipientPubkey);
  const encrypted = await nip44EncryptRaw(conversationKey, JSON.stringify(seal));

  const tags: string[][] = [['p', recipientPubkey]];
  // NIP-40: a relay-visible expiration so compliant relays drop the wrap
  // after the deadline. Only the recipient `p` tag and this are exposed.
  if (expirationTag) tags.push(expirationTag);

  const wrapTemplate = {
    pubkey: ephemeralPk,
    created_at: randomizedTimestamp(),
    kind: KIND_GIFT_WRAP,
    tags,
    content: encrypted,
  };

  return finalizeEvent(wrapTemplate, ephemeralSk) as unknown as NostrEvent;
}

/**
 * Produce the two gift wraps needed for a NIP-17 DM: one addressed to the
 * recipient, one addressed to the sender (so the sender keeps a copy they
 * can decrypt from any device).
 */
export async function createGiftWraps(params: {
  signer: Nip44Signer;
  recipientPubkey: string;
  rumor: ChatRumor;
  /** Optional NIP-40 expiration tag applied to both wraps. */
  expirationTag?: string[] | null;
}): Promise<{ toRecipient: NostrEvent; toSelf: NostrEvent }> {
  const senderPubkey = await params.signer.getPublicKey();

  const sealForRecipient = await sealRumor(params.signer, params.rumor, params.recipientPubkey);
  const toRecipient = await wrapSeal(sealForRecipient, params.recipientPubkey, params.expirationTag);

  const sealForSelf = await sealRumor(params.signer, params.rumor, senderPubkey);
  const toSelf = await wrapSeal(sealForSelf, senderPubkey, params.expirationTag);

  return { toRecipient, toSelf };
}

/**
 * Produce a single gift wrap addressed only to the recipient. Used for read
 * receipts, which don't need a self-copy (we already know we read them).
 */
export async function createRecipientGiftWrap(params: {
  signer: Nip44Signer;
  recipientPubkey: string;
  rumor: ChatRumor;
}): Promise<NostrEvent> {
  const seal = await sealRumor(params.signer, params.rumor, params.recipientPubkey);
  return wrapSeal(seal, params.recipientPubkey);
}

// ─── Unwrapping (NIP-59) ─────────────────────────────────────────────

/**
 * Unwrap a gift wrap addressed to the logged-in user, returning the inner
 * chat rumor, or null if it cannot be decrypted / is not a chat message.
 */
export async function unwrapGiftWrap(
  signer: Nip44Signer,
  giftWrap: NostrEvent,
): Promise<ChatRumor | null> {
  if (!signer.nip44) return null;
  if (giftWrap.kind !== KIND_GIFT_WRAP) return null;

  try {
    // Decrypt the outer wrap using the wrap author (ephemeral pubkey).
    const sealJson = await signer.nip44.decrypt(giftWrap.pubkey, giftWrap.content);
    const seal = JSON.parse(sealJson) as NostrEvent;
    if (seal.kind !== KIND_SEAL) return null;

    // Decrypt the seal using the seal author (real sender).
    const rumorJson = await signer.nip44.decrypt(seal.pubkey, seal.content);
    const rumor = JSON.parse(rumorJson) as ChatRumor;
    if (rumor.kind !== KIND_CHAT) return null;

    // The seal's signer is the authoritative sender; trust it over the rumor.
    rumor.pubkey = seal.pubkey;
    return rumor;
  } catch {
    return null;
  }
}

/** Read the NIP-40 expiration (unix seconds) from a gift wrap, or undefined. */
export function giftWrapExpiration(event: NostrEvent): number | undefined {
  const tag = event.tags.find(([n]) => n === 'expiration');
  const value = tag?.[1];
  const num = value ? Number(value) : NaN;
  return Number.isFinite(num) ? num : undefined;
}

/** Convert an unwrapped rumor into a SecureMessage for the given viewer. */
export function rumorToMessage(
  rumor: ChatRumor,
  viewerPubkey: string,
  expiresAt?: number,
): SecureMessage {
  const recipients = rumor.tags.filter(([n]) => n === 'p').map(([, v]) => v);
  const attachmentTag = rumor.tags.find(([n]) => n === 'privatum-attachment');

  let attachment: MessageAttachment | undefined;
  if (attachmentTag) {
    const [, filename, size, hash, documentId] = attachmentTag;
    attachment = {
      filename: filename ?? '',
      size: Number(size) || 0,
      hash: hash ?? '',
      documentId: documentId || undefined,
    };
  }

  return {
    id: rumor.id,
    pubkey: rumor.pubkey,
    content: rumor.content,
    createdAt: rumor.created_at,
    recipients,
    attachment,
    direction: rumor.pubkey === viewerPubkey ? 'sent' : 'received',
    expiresAt,
  };
}

// ─── Local conversation cache ────────────────────────────────────────

const CONVERSATIONS_KEY = 'privatum:messages:conversations';

type ConversationStore = Record<string, SecureMessage[]>;

function loadStore(): ConversationStore {
  try {
    const raw = localStorage.getItem(CONVERSATIONS_KEY);
    return raw ? (JSON.parse(raw) as ConversationStore) : {};
  } catch {
    return {};
  }
}

function saveStore(store: ConversationStore): void {
  localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(store));
}

/** The "other party" of a message relative to the viewer. */
function peerOf(message: SecureMessage, viewerPubkey: string): string {
  if (message.direction === 'sent') {
    return message.recipients.find((r) => r !== viewerPubkey) ?? message.recipients[0] ?? viewerPubkey;
  }
  return message.pubkey;
}

/** Load all cached conversations for the viewer, newest activity first. */
export function loadConversations(viewerPubkey: string): Conversation[] {
  const store = loadStore();
  const now = Math.floor(Date.now() / 1000);
  const list: Conversation[] = Object.entries(store).map(([peerPubkey, messages]) => {
    // NIP-40: hide messages past their expiration (data minimization).
    const live = messages.filter((m) => !(typeof m.expiresAt === 'number' && m.expiresAt <= now));
    const sorted = live.sort((a, b) => a.createdAt - b.createdAt);
    return {
      peerPubkey,
      messages: sorted,
      lastActivity: sorted.length ? sorted[sorted.length - 1].createdAt : 0,
    };
  }).filter((conv) => conv.messages.length > 0);
  // viewerPubkey reserved for future multi-account partitioning
  void viewerPubkey;
  return list.sort((a, b) => b.lastActivity - a.lastActivity);
}

/** Purge expired messages from the persisted store. Returns true if changed. */
export function purgeExpiredMessages(): boolean {
  const store = loadStore();
  const now = Math.floor(Date.now() / 1000);
  let changed = false;
  for (const peer of Object.keys(store)) {
    const before = store[peer].length;
    store[peer] = store[peer].filter(
      (m) => !(typeof m.expiresAt === 'number' && m.expiresAt <= now),
    );
    if (store[peer].length !== before) changed = true;
    if (store[peer].length === 0) delete store[peer];
  }
  if (changed) saveStore(store);
  return changed;
}

/**
 * Persist a decrypted message into the local cache, de-duplicating by id.
 * Returns the updated conversation store snapshot.
 */
export function cacheMessage(message: SecureMessage, viewerPubkey: string): ConversationStore {
  const store = loadStore();
  const peer = peerOf(message, viewerPubkey);
  const existing = store[peer] ?? [];
  if (existing.some((m) => m.id === message.id)) {
    return store;
  }
  store[peer] = [...existing, message];
  saveStore(store);
  return store;
}

/**
 * Patch a cached message in place (by id, across all conversations).
 * Used to update delivery status, relay reach, and receipt flags.
 */
export function updateCachedMessage(
  messageId: string,
  patch: Partial<SecureMessage>,
): void {
  const store = loadStore();
  let changed = false;
  for (const peer of Object.keys(store)) {
    store[peer] = store[peer].map((m) => {
      if (m.id !== messageId) return m;
      changed = true;
      return { ...m, ...patch };
    });
  }
  if (changed) saveStore(store);
}

/**
 * Apply a batch of read receipts: any *sent* message whose id is in
 * `messageIds` is marked `read`. Returns true if anything changed.
 */
export function applyReadReceipts(messageIds: string[]): boolean {
  if (messageIds.length === 0) return false;
  const ids = new Set(messageIds);
  const store = loadStore();
  let changed = false;
  for (const peer of Object.keys(store)) {
    store[peer] = store[peer].map((m) => {
      if (m.direction === 'sent' && ids.has(m.id) && m.deliveryStatus !== 'read') {
        changed = true;
        return { ...m, deliveryStatus: 'read' as DeliveryStatus };
      }
      return m;
    });
  }
  if (changed) saveStore(store);
  return changed;
}

/**
 * Received messages in a conversation that have not yet had a read receipt
 * sent. Returns their rumor ids (which the sender can match to its own
 * sent-message ids).
 */
export function unacknowledgedReceivedIds(peerPubkey: string): string[] {
  const store = loadStore();
  const messages = store[peerPubkey] ?? [];
  return messages
    .filter((m) => m.direction === 'received' && !m.receiptSent)
    .map((m) => m.id);
}

/** Mark received messages as having had a read receipt sent. */
export function markReceiptsSent(messageIds: string[]): void {
  const ids = new Set(messageIds);
  const store = loadStore();
  let changed = false;
  for (const peer of Object.keys(store)) {
    store[peer] = store[peer].map((m) => {
      if (m.direction === 'received' && ids.has(m.id) && !m.receiptSent) {
        changed = true;
        return { ...m, receiptSent: true };
      }
      return m;
    });
  }
  if (changed) saveStore(store);
}

/** Remove all cached conversations (used by panic-delete). */
export function clearConversations(): void {
  localStorage.removeItem(CONVERSATIONS_KEY);
}

// ─── Low-level NIP-44 helpers for the ephemeral gift-wrap key ─────────
//
// The app signer handles NIP-44 for the *user's* identity, but the gift
// wrap is signed by a one-time ephemeral key the signer knows nothing
// about. We therefore use nostr-tools' NIP-44 primitives directly for the
// wrap layer only. The inner seal still uses the user's signer.

async function importNip44() {
  const { nip44 } = await import('nostr-tools');
  return nip44;
}

async function deriveNip44Key(secretKey: Uint8Array, peerPubkey: string): Promise<Uint8Array> {
  const nip44 = await importNip44();
  return nip44.getConversationKey(secretKey, peerPubkey);
}

async function nip44EncryptRaw(conversationKey: Uint8Array, plaintext: string): Promise<string> {
  const nip44 = await importNip44();
  return nip44.encrypt(plaintext, conversationKey);
}

// ─── Signer signing shim ─────────────────────────────────────────────
//
// NUser signers expose `signEvent` per NIP-07. We type it narrowly here to
// avoid leaking `any` into callers while keeping the lib signer-agnostic.

interface SignCapableSigner extends Nip44Signer {
  signEvent?(event: {
    created_at: number;
    kind: number;
    tags: string[][];
    content: string;
  }): Promise<NostrEvent>;
}

async function signEventWithSigner(
  signer: Nip44Signer,
  template: { pubkey: string; created_at: number; kind: number; tags: string[][]; content: string },
): Promise<NostrEvent> {
  const s = signer as SignCapableSigner;
  if (typeof s.signEvent !== 'function') {
    throw new Error('Signer cannot sign events');
  }
  return s.signEvent({
    created_at: template.created_at,
    kind: template.kind,
    tags: template.tags,
    content: template.content,
  });
}

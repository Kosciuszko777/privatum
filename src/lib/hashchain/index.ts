/**
 * HASH CHAIN — Append-only integrity receipt protocol.
 *
 * §3.5: Every document is hashed client-side (SHA-256) on send.
 * Hash, timestamp, channel id, and direction are recorded in a signed,
 * append-only chain, each entry referencing the previous entry's hash.
 *
 * Proof layer never sees content: auditability without readability.
 */

export interface ChainEntry {
  /** SHA-256 hash of the document */
  documentHash: string;
  /** Unix timestamp in seconds */
  timestamp: number;
  /** Channel identifier */
  channelId: string;
  /** Direction: 'inbound' (client → professional) or 'outbound' (professional → client) */
  direction: 'inbound' | 'outbound';
  /** Hash of the previous chain entry (empty string for genesis) */
  previousHash: string;
  /** SHA-256 hash of this entry (computed from all fields above) */
  entryHash: string;
  /** Optional: original filename (metadata only, never content) */
  filename?: string;
  /** Optional: file size in bytes */
  fileSize?: number;
}

/**
 * Compute the hash of a chain entry from its constituent parts.
 * The hash covers: documentHash + timestamp + channelId + direction + previousHash
 */
export async function computeEntryHash(
  documentHash: string,
  timestamp: number,
  channelId: string,
  direction: 'inbound' | 'outbound',
  previousHash: string
): Promise<string> {
  const payload = `${documentHash}:${timestamp}:${channelId}:${direction}:${previousHash}`;
  const encoded = new TextEncoder().encode(payload);
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
  const hashArray = new Uint8Array(hashBuffer);
  return Array.from(hashArray)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Create a new chain entry.
 */
export async function createChainEntry(params: {
  documentHash: string;
  channelId: string;
  direction: 'inbound' | 'outbound';
  previousHash: string;
  filename?: string;
  fileSize?: number;
}): Promise<ChainEntry> {
  const timestamp = Math.floor(Date.now() / 1000);
  const entryHash = await computeEntryHash(
    params.documentHash,
    timestamp,
    params.channelId,
    params.direction,
    params.previousHash
  );

  return {
    documentHash: params.documentHash,
    timestamp,
    channelId: params.channelId,
    direction: params.direction,
    previousHash: params.previousHash,
    entryHash,
    filename: params.filename,
    fileSize: params.fileSize,
  };
}

/**
 * Verify the integrity of a chain by checking that each entry's hash
 * is correctly computed and references the previous entry.
 */
export async function verifyChain(entries: ChainEntry[]): Promise<{
  valid: boolean;
  invalidAt?: number;
}> {
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];

    // Genesis entry should have empty previousHash
    if (i === 0 && entry.previousHash !== '') {
      return { valid: false, invalidAt: 0 };
    }

    // Non-genesis entries must reference the previous entry's hash
    if (i > 0 && entry.previousHash !== entries[i - 1].entryHash) {
      return { valid: false, invalidAt: i };
    }

    // Verify the entry's own hash
    const expectedHash = await computeEntryHash(
      entry.documentHash,
      entry.timestamp,
      entry.channelId,
      entry.direction,
      entry.previousHash
    );

    if (entry.entryHash !== expectedHash) {
      return { valid: false, invalidAt: i };
    }
  }

  return { valid: true };
}

/**
 * Persist chain entries to local storage for a given channel.
 */
export function storeChain(channelId: string, entries: ChainEntry[]): void {
  localStorage.setItem(
    `privatum:chain:${channelId}`,
    JSON.stringify(entries)
  );
}

/**
 * Load chain entries from local storage.
 */
export function loadChain(channelId: string): ChainEntry[] {
  const raw = localStorage.getItem(`privatum:chain:${channelId}`);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as ChainEntry[];
  } catch {
    return [];
  }
}

/**
 * Get the latest entry hash in the chain (for linking).
 * Returns empty string if chain is empty (genesis).
 */
export function getLatestHash(entries: ChainEntry[]): string {
  if (entries.length === 0) return '';
  return entries[entries.length - 1].entryHash;
}

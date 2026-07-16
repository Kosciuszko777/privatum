/**
 * useAuditChain — Reactive hash chain state management.
 *
 * Wraps the hashchain lib with React state for real-time
 * audit trail display, chain verification, and event recording.
 */

import { useState, useCallback, useMemo } from 'react';
import {
  createChainEntry, verifyChain, storeChain, loadChain, getLatestHash,
  type ChainEntry,
} from '@/lib/hashchain';

/** The default channel used for vault operations. */
const VAULT_CHANNEL = 'vault';

/** All channels that have chain data. */
function getAllChannelIds(): string[] {
  const ids: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('privatum:chain:')) {
      ids.push(key.replace('privatum:chain:', ''));
    }
  }
  return ids.length > 0 ? ids : [VAULT_CHANNEL];
}

export function useAuditChain() {
  const [channelIds] = useState(getAllChannelIds);
  const [entries, setEntries] = useState<ChainEntry[]>(() => {
    // Load all chains merged, sorted by timestamp
    const all: ChainEntry[] = [];
    for (const id of getAllChannelIds()) {
      all.push(...loadChain(id));
    }
    return all.sort((a, b) => a.timestamp - b.timestamp);
  });

  const [verificationResult, setVerificationResult] = useState<{
    status: 'idle' | 'verifying' | 'valid' | 'invalid';
    invalidAt?: number;
  }>({ status: 'idle' });

  // ─── Channels ───────────────────────────────────────────────────

  const channels = useMemo(() => channelIds, [channelIds]);

  // ─── Filtered view ──────────────────────────────────────────────

  const getEntriesForChannel = useCallback((channelId: string) => {
    return entries.filter((e) => e.channelId === channelId);
  }, [entries]);

  // ─── Record a new chain entry ───────────────────────────────────

  const recordEvent = useCallback(async (params: {
    documentHash: string;
    channelId?: string;
    direction: 'inbound' | 'outbound';
    filename?: string;
    fileSize?: number;
  }) => {
    const channelId = params.channelId || VAULT_CHANNEL;
    const chainEntries = loadChain(channelId);
    const previousHash = getLatestHash(chainEntries);

    const entry = await createChainEntry({
      documentHash: params.documentHash,
      channelId,
      direction: params.direction,
      previousHash,
      filename: params.filename,
      fileSize: params.fileSize,
    });

    chainEntries.push(entry);
    storeChain(channelId, chainEntries);

    // Update reactive state
    setEntries((prev) => [...prev, entry].sort((a, b) => a.timestamp - b.timestamp));

    return entry;
  }, []);

  // ─── Verify a channel's chain integrity ─────────────────────────

  const verify = useCallback(async (channelId?: string) => {
    setVerificationResult({ status: 'verifying' });

    const channelToVerify = channelId || VAULT_CHANNEL;
    const chainEntries = loadChain(channelToVerify);

    if (chainEntries.length === 0) {
      setVerificationResult({ status: 'valid' });
      return true;
    }

    const result = await verifyChain(chainEntries);

    setVerificationResult(
      result.valid
        ? { status: 'valid' }
        : { status: 'invalid', invalidAt: result.invalidAt }
    );

    return result.valid;
  }, []);

  // ─── Stats ──────────────────────────────────────────────────────

  const stats = useMemo(() => ({
    totalEntries: entries.length,
    channels: channels.length,
    latestEntry: entries.length > 0 ? entries[entries.length - 1] : null,
    inboundCount: entries.filter((e) => e.direction === 'inbound').length,
    outboundCount: entries.filter((e) => e.direction === 'outbound').length,
  }), [entries, channels]);

  return {
    entries,
    channels,
    stats,
    verificationResult,
    getEntriesForChannel,
    recordEvent,
    verify,
  };
}

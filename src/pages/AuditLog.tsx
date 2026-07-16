/**
 * AUDIT LOG — §3.5 Hash chain viewer with integrity verification.
 *
 * Displays the append-only hash chain, each entry linking to the previous.
 * Users can verify the full chain integrity with one click.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSeoMeta } from '@unhead/react';
import {
  ArrowLeft, Shield, ShieldCheck, ShieldAlert, ChevronDown, ChevronRight,
  Copy, Check, Loader2, FileText, ArrowDownLeft, ArrowUpRight,
  Hash, Link as LinkChain, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLocale } from '@/hooks/useLocale';
import { useAuditChain } from '@/hooks/useAuditChain';
import { toast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';
import type { ChainEntry } from '@/lib/hashchain';

const AuditLog = () => {
  const { strings } = useLocale();
  const chain = useAuditChain();
  const [selectedChannel, setSelectedChannel] = useState<string>('all');
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);

  useSeoMeta({ title: `PRIVATUM — ${strings.audit.title}` });

  const displayEntries = selectedChannel === 'all'
    ? chain.entries
    : chain.getEntriesForChannel(selectedChannel);

  // Show newest first
  const sortedEntries = [...displayEntries].reverse();

  const formatTimestamp = (ts: number) => {
    const d = new Date(ts * 1000);
    return d.toLocaleString('de-CH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes >= 1000000) return `${(bytes / 1000000).toFixed(1)} MB`;
    return `${(bytes / 1000).toFixed(0)} KB`;
  };

  const truncateHash = (hash: string) => {
    if (hash.length <= 16) return hash;
    return `${hash.slice(0, 8)}…${hash.slice(-8)}`;
  };

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    toast({ title: strings.common.copied });
  };

  const handleVerify = async () => {
    await chain.verify(selectedChannel === 'all' ? undefined : selectedChannel);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-lg">
        <div className="container flex items-center h-16 gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/dashboard">
              <ArrowLeft className="size-4 mr-1" />
              Dashboard
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <Shield className="size-5 text-primary" />
            <h1 className="font-sans font-semibold text-foreground">
              {strings.audit.title}
            </h1>
          </div>
          <div className="ml-auto">
            <Button
              size="sm"
              variant={chain.verificationResult.status === 'valid' ? 'outline' : 'default'}
              onClick={handleVerify}
              disabled={chain.verificationResult.status === 'verifying'}
            >
              {chain.verificationResult.status === 'verifying' && (
                <Loader2 className="size-4 mr-1 animate-spin" />
              )}
              {chain.verificationResult.status === 'valid' && (
                <ShieldCheck className="size-4 mr-1 text-green-600" />
              )}
              {chain.verificationResult.status === 'invalid' && (
                <ShieldAlert className="size-4 mr-1 text-destructive" />
              )}
              {chain.verificationResult.status === 'idle' && (
                <Shield className="size-4 mr-1" />
              )}
              {chain.verificationResult.status === 'verifying'
                ? strings.audit.verifying
                : chain.verificationResult.status === 'valid'
                  ? strings.audit.verified
                  : strings.audit.verifyChain}
            </Button>
          </div>
        </div>
      </header>

      <main className="container max-w-4xl py-8 space-y-6">
        {/* Stats + verification banner */}
        {chain.verificationResult.status === 'valid' && (
          <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800/30 rounded-xl p-4 flex items-center gap-3 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300">
            <ShieldCheck className="size-5 text-green-600 shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-800 dark:text-green-200">{strings.audit.chainValid}</p>
              <p className="text-xs text-green-600 dark:text-green-400">
                {chain.stats.totalEntries} {strings.audit.entries} · {chain.stats.channels} {strings.audit.channel}(s)
              </p>
            </div>
          </div>
        )}

        {chain.verificationResult.status === 'invalid' && (
          <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4 flex items-center gap-3 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300">
            <ShieldAlert className="size-5 text-destructive shrink-0" />
            <div>
              <p className="text-sm font-medium text-destructive">{strings.audit.chainInvalid} #{chain.verificationResult.invalidAt}</p>
            </div>
          </div>
        )}

        {/* Filter bar */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Hash className="size-4" />
            <span className="font-medium text-foreground">{displayEntries.length}</span> {strings.audit.entries}
          </div>
          <div className="ml-auto">
            <Select value={selectedChannel} onValueChange={setSelectedChannel}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{strings.audit.allChannels}</SelectItem>
                {chain.channels.map((ch) => (
                  <SelectItem key={ch} value={ch}>{ch}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Chain entries */}
        {sortedEntries.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <LinkChain className="size-8 text-muted-foreground mx-auto mb-3" />
              <p className="font-medium text-foreground mb-1">{strings.audit.noEntries}</p>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                {strings.audit.noEntriesDesc}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-px">
            {sortedEntries.map((entry, idx) => (
              <ChainEntryRow
                key={entry.entryHash}
                entry={entry}
                index={displayEntries.length - 1 - idx}
                isGenesis={entry.previousHash === ''}
                expanded={expandedEntry === entry.entryHash}
                onToggle={() => setExpandedEntry(
                  expandedEntry === entry.entryHash ? null : entry.entryHash
                )}
                onCopyHash={copyHash}
                formatTimestamp={formatTimestamp}
                formatSize={formatSize}
                truncateHash={truncateHash}
                strings={strings}
              />
            ))}
          </div>
        )}

        {/* Architecture explanation */}
        <Card className="border-border bg-secondary/20">
          <CardHeader>
            <CardTitle className="font-sans text-sm flex items-center gap-2">
              <LinkChain className="size-4" />
              {strings.audit.subtitle}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
              <span className="px-2 py-1 bg-secondary rounded">entry[n].hash</span>
              <span>=</span>
              <span className="px-2 py-1 bg-secondary rounded">SHA-256(docHash + ts + channel + dir + entry[n-1].hash)</span>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

// ─── Individual chain entry row ──────────────────────────────────

interface ChainEntryRowProps {
  entry: ChainEntry;
  index: number;
  isGenesis: boolean;
  expanded: boolean;
  onToggle: () => void;
  onCopyHash: (hash: string) => void;
  formatTimestamp: (ts: number) => string;
  formatSize: (bytes?: number) => string;
  truncateHash: (hash: string) => string;
  strings: ReturnType<typeof import('@/hooks/useLocale').useLocale>['strings'];
}

function ChainEntryRow({
  entry, index, isGenesis, expanded, onToggle, onCopyHash,
  formatTimestamp, formatSize, truncateHash, strings,
}: ChainEntryRowProps) {
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const handleCopy = (hash: string) => {
    onCopyHash(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 1500);
  };

  return (
    <div className={cn(
      'border border-border rounded-lg transition-all duration-200',
      expanded ? 'bg-card shadow-sm' : 'bg-card/50 hover:bg-card'
    )}>
      {/* Summary row */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 text-left"
      >
        {/* Index + chain link indicator */}
        <div className="flex flex-col items-center gap-0.5 shrink-0 w-8">
          <span className="text-[10px] font-mono text-muted-foreground">#{index}</span>
          {!isGenesis && <div className="w-px h-3 bg-border" />}
          {isGenesis && (
            <Badge variant="outline" className="text-[8px] px-1">{strings.audit.genesis}</Badge>
          )}
        </div>

        {/* Direction icon */}
        <div className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
          entry.direction === 'inbound' ? 'bg-primary/10' : 'bg-brass/10'
        )}>
          {entry.direction === 'inbound'
            ? <ArrowDownLeft className="size-4 text-primary" />
            : <ArrowUpRight className="size-4 text-brass" />}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {entry.filename && (
              <span className="text-sm font-medium text-foreground truncate">{entry.filename}</span>
            )}
            {!entry.filename && (
              <span className="text-sm font-medium text-foreground font-mono">{truncateHash(entry.documentHash)}</span>
            )}
            <Badge variant="outline" className="text-[10px] shrink-0">
              {entry.direction === 'inbound' ? strings.audit.inbound : strings.audit.outbound}
            </Badge>
          </div>
          <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
            <Clock className="size-3" />
            <span>{formatTimestamp(entry.timestamp)}</span>
            {entry.fileSize && (
              <>
                <span>·</span>
                <span>{formatSize(entry.fileSize)}</span>
              </>
            )}
            <span>·</span>
            <span className="font-mono">{truncateHash(entry.entryHash)}</span>
          </div>
        </div>

        {/* Expand arrow */}
        {expanded
          ? <ChevronDown className="size-4 text-muted-foreground shrink-0" />
          : <ChevronRight className="size-4 text-muted-foreground shrink-0" />}
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-border motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200">
          <div className="grid gap-3 mt-3 text-xs">
            <HashRow
              label={strings.audit.entryHash}
              hash={entry.entryHash}
              onCopy={() => handleCopy(entry.entryHash)}
              copied={copiedHash === entry.entryHash}
            />
            <HashRow
              label={strings.audit.documentHash}
              hash={entry.documentHash}
              onCopy={() => handleCopy(entry.documentHash)}
              copied={copiedHash === entry.documentHash}
            />
            <HashRow
              label={strings.audit.previousHash}
              hash={entry.previousHash || `(${strings.audit.genesis})`}
              onCopy={entry.previousHash ? () => handleCopy(entry.previousHash) : undefined}
              copied={copiedHash === entry.previousHash}
            />
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="font-medium text-foreground w-28 shrink-0">{strings.audit.channel}</span>
              <span className="font-mono">{entry.channelId}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="font-medium text-foreground w-28 shrink-0">{strings.audit.timestamp}</span>
              <span className="font-mono">{entry.timestamp}</span>
              <span className="text-muted-foreground">({formatTimestamp(entry.timestamp)})</span>
            </div>
            {entry.filename && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="font-medium text-foreground w-28 shrink-0">{strings.audit.filename}</span>
                <FileText className="size-3" />
                <span>{entry.filename}</span>
                {entry.fileSize && <span>({formatSize(entry.fileSize)})</span>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Hash display row ────────────────────────────────────────────

function HashRow({ label, hash, onCopy, copied }: {
  label: string;
  hash: string;
  onCopy?: () => void;
  copied: boolean;
}) {
  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <span className="font-medium text-foreground w-28 shrink-0">{label}</span>
      <code className="font-mono text-[11px] bg-secondary px-2 py-0.5 rounded truncate flex-1 min-w-0">
        {hash}
      </code>
      {onCopy && (
        <Button variant="ghost" size="icon-xs" onClick={onCopy} className="shrink-0">
          {copied ? <Check className="size-3 text-green-600" /> : <Copy className="size-3" />}
        </Button>
      )}
    </div>
  );
}

export default AuditLog;

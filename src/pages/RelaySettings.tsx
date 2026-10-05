/**
 * RELAY SETTINGS — Phase VII.
 *
 * Lets the professional publish their inbound-delivery relays so senders
 * can reliably reach them:
 *  - NIP-17 DM relays (kind 10050)
 *  - NIP-65 general relays (kind 10002)
 * …plus a default NIP-40 message-retention policy for outgoing messages.
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSeoMeta } from '@unhead/react';
import {
  ArrowLeft, Radio, Wifi, Plus, X, Send, Loader2, Clock,
  ShieldCheck, Info, Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useLocale } from '@/hooks/useLocale';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useMyRelays } from '@/hooks/useMyRelays';
import { toast } from '@/hooks/useToast';
import {
  loadRetention, saveRetention, RETENTION_OPTIONS, type MessageRetention,
} from '@/lib/messageRetention';
import { cn } from '@/lib/utils';

type LocaleStrings = ReturnType<typeof useLocale>['strings'];

function renderRelayUrl(url: string): string {
  try {
    const u = new URL(url);
    return u.pathname === '/' ? u.host : u.host + u.pathname;
  } catch {
    return url;
  }
}

const RelaySettings = () => {
  const { strings } = useLocale();
  const { user } = useCurrentUser();
  const navigate = useNavigate();
  const relays = useMyRelays();

  const [newDm, setNewDm] = useState('');
  const [newNip65, setNewNip65] = useState('');
  const [retention, setRetention] = useState<MessageRetention>(loadRetention);

  useSeoMeta({
    title: `PRIVATUM — ${strings.relays.title}`,
    description: strings.relays.subtitle,
  });

  const retentionLabel = (r: MessageRetention): string => {
    switch (r) {
      case 'never': return strings.messages.retentionNever;
      case '24h': return strings.messages.retention24h;
      case '7d': return strings.messages.retention7d;
      case '30d': return strings.messages.retention30d;
      case '90d': return strings.messages.retention90d;
      case '1y': return strings.messages.retention1y;
    }
  };

  const handleAddDm = () => {
    if (!newDm.trim()) return;
    if (relays.addDmRelay(newDm)) {
      setNewDm('');
    } else {
      toast({ title: strings.relays.invalidRelay, variant: 'destructive' });
    }
  };

  const handleAddNip65 = async () => {
    if (!newNip65.trim()) return;
    const ok = await relays.addNip65Relay(newNip65);
    if (ok) {
      setNewNip65('');
    } else {
      toast({ title: strings.relays.invalidRelay, variant: 'destructive' });
    }
  };

  const handlePublishDm = async () => {
    try {
      const ok = await relays.publishDmRelays();
      toast({
        title: ok ? strings.relays.published : strings.relays.loginRequired,
        variant: ok ? undefined : 'destructive',
      });
    } catch {
      toast({ title: strings.relays.publishFailed, variant: 'destructive' });
    }
  };

  const handleRetentionChange = (value: string) => {
    const r = value as MessageRetention;
    setRetention(r);
    saveRetention(r);
    toast({ title: strings.relays.saved });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-lg">
        <div className="container flex items-center h-16 gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/security">
              <ArrowLeft className="size-4 mr-1" />
              {strings.dashboard.securityCenter}
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <Radio className="size-5 text-primary" />
            <h1 className="font-sans font-semibold text-foreground">{strings.relays.title}</h1>
          </div>
        </div>
      </header>

      <main className="container max-w-3xl py-8 space-y-6">
        <p className="text-sm text-muted-foreground max-w-2xl">{strings.relays.subtitle}</p>

        {!user && (
          <div className="bg-brass/5 border border-brass/20 rounded-lg p-3 flex items-center gap-3">
            <Info className="size-4 text-brass shrink-0" />
            <p className="text-sm text-foreground">{strings.relays.loginRequired}</p>
          </div>
        )}

        {/* DM relays (kind 10050) */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="font-sans text-base flex items-center gap-2">
              <Radio className="size-4 text-primary" />
              {strings.relays.dmRelaysTitle}
            </CardTitle>
            <CardDescription>{strings.relays.dmRelaysDesc}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {relays.dmRelays.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border py-6 text-center text-sm text-muted-foreground">
                {strings.relays.noDmRelays}
              </div>
            ) : (
              <div className="space-y-2">
                {relays.dmRelays.map((url) => (
                  <div key={url} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-secondary/20">
                    <Radio className="size-4 text-primary shrink-0" />
                    <span className="font-mono text-sm flex-1 truncate" title={url}>
                      {renderRelayUrl(url)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => relays.removeDmRelay(url)}
                      className="size-6 text-muted-foreground hover:text-destructive shrink-0"
                      aria-label={strings.relays.remove}
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Input
                value={newDm}
                onChange={(e) => setNewDm(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddDm(); }}
                placeholder={strings.relays.relayPlaceholder}
                className="font-mono text-sm"
              />
              <Button variant="outline" onClick={handleAddDm} disabled={!newDm.trim()} className="shrink-0">
                <Plus className="size-4 sm:mr-1" />
                <span className="hidden sm:inline">{strings.relays.addRelay}</span>
              </Button>
            </div>

            <div className="flex items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {relays.dmUpdatedAt > 0 ? (
                  <Badge variant="outline" className="gap-1 text-[10px]">
                    <ShieldCheck className="size-3 text-green-600" />
                    {strings.relays.lastPublished}: {new Date(relays.dmUpdatedAt * 1000).toLocaleDateString('de-CH')}
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-[10px]">{strings.relays.notPublished}</Badge>
                )}
              </div>
              <Button
                size="sm"
                onClick={handlePublishDm}
                disabled={relays.isPublishing || relays.dmRelays.length === 0 || !user}
              >
                {relays.isPublishing
                  ? <Loader2 className="size-4 mr-1 animate-spin" />
                  : <Send className="size-4 mr-1" />}
                {relays.isPublishing ? strings.relays.publishing : strings.relays.publish}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* NIP-65 general relays */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="font-sans text-base flex items-center gap-2">
              <Wifi className="size-4 text-primary" />
              {strings.relays.nip65Title}
            </CardTitle>
            <CardDescription>{strings.relays.nip65Desc}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {relays.nip65Relays.map((relay) => (
                <div key={relay.url} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-secondary/20">
                  <Wifi className="size-4 text-muted-foreground shrink-0" />
                  <span className="font-mono text-sm flex-1 truncate" title={relay.url}>
                    {renderRelayUrl(relay.url)}
                  </span>
                  <div className="flex items-center gap-3 shrink-0">
                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                      {strings.relays.read}
                      <Switch
                        checked={relay.read}
                        onCheckedChange={() => relays.toggleNip65Flag(relay.url, 'read')}
                        className="data-[state=checked]:bg-green-600 scale-75"
                      />
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                      {strings.relays.write}
                      <Switch
                        checked={relay.write}
                        onCheckedChange={() => relays.toggleNip65Flag(relay.url, 'write')}
                        className="data-[state=checked]:bg-blue-600 scale-75"
                      />
                    </label>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => relays.removeNip65Relay(relay.url)}
                      disabled={relays.nip65Relays.length <= 1}
                      className="size-6 text-muted-foreground hover:text-destructive"
                      aria-label={strings.relays.remove}
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Input
                value={newNip65}
                onChange={(e) => setNewNip65(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddNip65(); }}
                placeholder={strings.relays.relayPlaceholder}
                className="font-mono text-sm"
              />
              <Button variant="outline" onClick={handleAddNip65} disabled={!newNip65.trim()} className="shrink-0">
                <Plus className="size-4 sm:mr-1" />
                <span className="hidden sm:inline">{strings.relays.addRelay}</span>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Check className="size-3 text-green-600" />
              {strings.relays.saved} — {strings.relays.nip65Desc.split('.')[0]}.
            </p>
          </CardContent>
        </Card>

        {/* Message retention (NIP-40) */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="font-sans text-base flex items-center gap-2">
              <Clock className="size-4 text-primary" />
              {strings.relays.retentionTitle}
            </CardTitle>
            <CardDescription>{strings.relays.retentionDesc}</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={retention} onValueChange={handleRetentionChange}>
              <SelectTrigger className="w-full sm:w-72">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RETENTION_OPTIONS.map((r) => (
                  <SelectItem key={r} value={r}>{retentionLabel(r)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <div className="flex justify-center pt-2">
          <Button variant="ghost" size="sm" onClick={() => navigate('/messages')} className={cn('text-muted-foreground')}>
            <ArrowLeft className="size-4 mr-1" />
            {strings.dashboard.messages}
          </Button>
        </div>
      </main>
    </div>
  );
};

export default RelaySettings;

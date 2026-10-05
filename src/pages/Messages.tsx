/**
 * SECURE MESSAGES — Phase IV + VI.
 *
 * End-to-end encrypted correspondence between a professional and their
 * contacts, built on the NIP-17 sealed-DM pattern (gift-wrapped via
 * NIP-59). A two-pane interface: conversations on the left, the active
 * thread on the right. New conversations are started from a recipient's
 * public key (npub or hex). Encrypted Vault documents can be referenced
 * as attachments without exposing their contents.
 *
 * Phase VI: sent messages show delivery/read status and the relay route
 * used; viewing a thread sends encrypted read receipts back to the peer.
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useSeoMeta } from '@unhead/react';
import { nip19 } from 'nostr-tools';
import {
  ArrowLeft, MessageSquareLock, Plus, Send, Loader2, ShieldCheck,
  Paperclip, Lock, Menu, FileText, X, ChevronRight, UserPlus,
  Check, CheckCheck, AlertCircle, Radio, Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLocale } from '@/hooks/useLocale';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAuthor } from '@/hooks/useAuthor';
import { useMessaging } from '@/hooks/useMessaging';
import { useVault } from '@/hooks/useVault';
import { useContacts } from '@/hooks/useContacts';
import { toast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';
import type { Conversation, MessageAttachment, SecureMessage } from '@/lib/messaging';
import {
  loadRetention, saveRetention, RETENTION_OPTIONS, type MessageRetention,
} from '@/lib/messageRetention';

type LocaleStrings = ReturnType<typeof useLocale>['strings'];

/** Normalize an npub/hex input into a 64-char hex pubkey, or null. */
function parsePubkey(input: string): string | null {
  const trimmed = input.trim();
  if (/^[0-9a-f]{64}$/i.test(trimmed)) return trimmed.toLowerCase();
  try {
    const decoded = nip19.decode(trimmed);
    if (decoded.type === 'npub') return decoded.data;
    if (decoded.type === 'nprofile') return decoded.data.pubkey;
  } catch {
    return null;
  }
  return null;
}

function initialsFromName(name: string): string {
  return name.split(/\s+/).map((n) => n.charAt(0)).join('').slice(0, 2).toUpperCase();
}

const Messages = () => {
  const { strings } = useLocale();
  const { user } = useCurrentUser();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const messaging = useMessaging();
  const [activePeer, setActivePeer] = useState<string | null>(null);
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useSeoMeta({
    title: `PRIVATUM — ${strings.messages.title}`,
    description: strings.messages.subtitle,
  });

  // Deep-link: /messages?to=<hex pubkey> opens that conversation.
  useEffect(() => {
    const to = searchParams.get('to');
    if (to && /^[0-9a-f]{64}$/i.test(to)) {
      setActivePeer(to.toLowerCase());
      setSidebarOpen(false);
      searchParams.delete('to');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Redirect if not logged in.
  useEffect(() => {
    if (!user) {
      const timer = setTimeout(() => {
        if (!user) navigate('/');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [user, navigate]);

  const activeConversation = activePeer
    ? messaging.getConversation(activePeer)
    : undefined;

  const handleStartConversation = (pubkey: string) => {
    setActivePeer(pubkey);
    setNewDialogOpen(false);
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-lg shrink-0">
        <div className="container flex items-center h-16 gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/dashboard">
              <ArrowLeft className="size-4 mr-1" />
              Dashboard
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <MessageSquareLock className="size-5 text-primary" />
            <h1 className="font-sans font-semibold text-foreground">
              {strings.messages.title}
            </h1>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Badge variant="outline" className="hidden sm:inline-flex gap-1 text-[10px]">
              <ShieldCheck className="size-3 text-green-600" />
              {strings.messages.sealed}
            </Badge>
            <Button
              size="sm"
              onClick={() => setNewDialogOpen(true)}
              disabled={!messaging.canMessage}
            >
              <Plus className="size-4 mr-1" />
              <span className="hidden sm:inline">{strings.messages.newMessage}</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Not-supported banner */}
      {user && !messaging.canMessage && (
        <div className="container py-3">
          <div className="bg-brass/5 border border-brass/20 rounded-lg p-3 flex items-center gap-3">
            <Lock className="size-4 text-brass shrink-0" />
            <p className="text-sm text-foreground">{strings.messages.noNip44}</p>
          </div>
        </div>
      )}

      {/* Two-pane layout */}
      <div className="flex-1 min-h-0 container flex gap-0 py-0 overflow-hidden">
        {/* Conversation list */}
        <aside
          className={cn(
            'w-full md:w-80 shrink-0 border-r border-border flex flex-col',
            activePeer && !sidebarOpen ? 'hidden md:flex' : 'flex',
          )}
        >
          <div className="h-14 border-b border-border flex items-center px-4 gap-2">
            <h2 className="font-sans font-medium text-sm text-foreground">
              {strings.messages.conversations}
            </h2>
            {messaging.isLoading && (
              <Loader2 className="size-3.5 animate-spin text-muted-foreground ml-auto" />
            )}
          </div>

          <ScrollArea className="flex-1">
            {messaging.conversations.length === 0 ? (
              <div className="p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mx-auto mb-3">
                  <MessageSquareLock className="size-5 text-muted-foreground" />
                </div>
                <p className="font-medium text-sm text-foreground mb-1">
                  {strings.messages.noConversations}
                </p>
                <p className="text-xs text-muted-foreground max-w-[14rem] mx-auto">
                  {strings.messages.noConversationsDesc}
                </p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {messaging.conversations.map((conv) => (
                  <ConversationListItem
                    key={conv.peerPubkey}
                    conversation={conv}
                    active={conv.peerPubkey === activePeer}
                    onSelect={() => {
                      setActivePeer(conv.peerPubkey);
                      setSidebarOpen(false);
                    }}
                    strings={strings}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </aside>

        {/* Thread view */}
        <section
          className={cn(
            'flex-1 min-w-0 flex flex-col',
            activePeer && !sidebarOpen ? 'flex' : 'hidden md:flex',
          )}
        >
          {activePeer ? (
            <ThreadView
              peerPubkey={activePeer}
              conversation={activeConversation}
              onBack={() => { setActivePeer(null); setSidebarOpen(true); }}
              strings={strings}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center max-w-sm">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <MessageSquareLock className="size-7 text-primary" />
                </div>
                <h3 className="font-serif font-semibold text-lg text-foreground mb-1">
                  {strings.messages.selectConversation}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {strings.messages.selectConversationDesc}
                </p>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* New conversation dialog */}
      <NewConversationDialog
        open={newDialogOpen}
        onOpenChange={setNewDialogOpen}
        onStart={handleStartConversation}
        strings={strings}
      />
    </div>
  );
};

// ─── Conversation list item ──────────────────────────────────────────

function ConversationListItem({
  conversation, active, onSelect, strings,
}: {
  conversation: Conversation;
  active: boolean;
  onSelect: () => void;
  strings: LocaleStrings;
}) {
  const author = useAuthor(conversation.peerPubkey);
  const metadata = author.data?.metadata;
  const name = metadata?.name || metadata?.display_name
    || `${nip19.npubEncode(conversation.peerPubkey).slice(0, 12)}…`;
  const lastMessage = conversation.messages[conversation.messages.length - 1];

  return (
    <button
      onClick={onSelect}
      className={cn(
        'w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors',
        active ? 'bg-primary/10' : 'hover:bg-secondary/50',
      )}
    >
      <Avatar className="size-10 shrink-0">
        <AvatarImage src={metadata?.picture} alt={name} />
        <AvatarFallback className="bg-primary/10 text-primary font-serif font-bold text-xs">
          {initialsFromName(name)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-foreground truncate">{name}</span>
          {lastMessage && (
            <span className="text-[10px] text-muted-foreground ml-auto shrink-0">
              {relativeTime(lastMessage.createdAt, strings)}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">
          {lastMessage?.direction === 'sent' && `${strings.messages.you}: `}
          {lastMessage?.attachment && !lastMessage.content
            ? `📎 ${lastMessage.attachment.filename}`
            : lastMessage?.content || strings.messages.sealed}
        </p>
      </div>
    </button>
  );
}

// ─── Thread view ─────────────────────────────────────────────────────

function ThreadView({
  peerPubkey, conversation, onBack, strings,
}: {
  peerPubkey: string;
  conversation: Conversation | undefined;
  onBack: () => void;
  strings: LocaleStrings;
}) {
  const { user } = useCurrentUser();
  const messaging = useMessaging();
  const vault = useVault();
  const author = useAuthor(peerPubkey);
  const metadata = author.data?.metadata;
  const name = metadata?.name || metadata?.display_name
    || `${nip19.npubEncode(peerPubkey).slice(0, 14)}…`;

  const [draft, setDraft] = useState('');
  const [attachment, setAttachment] = useState<MessageAttachment | null>(null);
  const [attachOpen, setAttachOpen] = useState(false);
  const [retention, setRetention] = useState<MessageRetention>(loadRetention);
  const scrollRef = useRef<HTMLDivElement>(null);

  const messages = useMemo(() => conversation?.messages ?? [], [conversation]);

  // Most recent sent message's relay route, for the header indicator.
  const lastSentRoute = useMemo(() => {
    const lastSent = [...messages].reverse().find(
      (m) => m.direction === 'sent' && m.relaySource,
    );
    if (!lastSent?.relaySource) return null;
    const label = (() => {
      switch (lastSent.relaySource) {
        case 'dm-relays': return strings.messages.routeDmRelays;
        case 'nip65': return strings.messages.routeNip65;
        case 'nip05': return strings.messages.routeNip05;
        default: return strings.messages.routeFallback;
      }
    })();
    return { label, count: lastSent.relayCount };
  }, [messages, strings]);

  // Auto-scroll to newest message.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  // Phase VI: viewing a thread sends encrypted read receipts back to the
  // peer for any of their messages we haven't yet acknowledged.
  const unacked = messages.filter((m) => m.direction === 'received' && !m.receiptSent).length;
  const { sendReadReceipts, refreshConversations } = messaging;
  useEffect(() => {
    if (unacked === 0) return;
    let cancelled = false;
    (async () => {
      await sendReadReceipts(peerPubkey);
      if (!cancelled) refreshConversations();
    })();
    return () => { cancelled = true; };
  }, [peerPubkey, unacked, sendReadReceipts, refreshConversations]);

  const handleSend = async () => {
    const content = draft.trim();
    if (!content && !attachment) return;
    try {
      await messaging.sendMessage({
        recipientPubkey: peerPubkey,
        content,
        attachment: attachment ?? undefined,
        retention,
      });
      setDraft('');
      setAttachment(null);
      toast({ title: strings.messages.messageSent });
    } catch (err) {
      toast({
        title: strings.messages.messageFailed,
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Thread header */}
      <div className="h-14 border-b border-border flex items-center px-4 gap-3 shrink-0">
        <button className="md:hidden p-1 -ml-1" onClick={onBack} aria-label="Back">
          <Menu className="size-5" />
        </button>
        <Avatar className="size-8 shrink-0">
          <AvatarImage src={metadata?.picture} alt={name} />
          <AvatarFallback className="bg-primary/10 text-primary font-serif font-bold text-[10px]">
            {initialsFromName(name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="font-medium text-sm text-foreground truncate leading-tight">{name}</p>
          <p className="text-[10px] text-muted-foreground font-mono truncate">
            {nip19.npubEncode(peerPubkey).slice(0, 20)}…
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 shrink-0">
          {lastSentRoute && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="gap-1 text-[10px] hidden sm:inline-flex">
                  <Radio className="size-3 text-primary" />
                  {lastSentRoute.label}
                </Badge>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <p className="text-xs">
                  {strings.messages.routedVia} {lastSentRoute.label}
                  {lastSentRoute.count !== undefined && (
                    <> · {strings.messages.deliveredTo.replace('{n}', String(lastSentRoute.count))}</>
                  )}
                </p>
              </TooltipContent>
            </Tooltip>
          )}
          <Badge variant="outline" className="gap-1 text-[10px]">
            <ShieldCheck className="size-3 text-green-600" />
            {strings.messages.deliveredSealed}
          </Badge>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messaging.isLoading && messages.length === 0 && (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            {strings.messages.loadingMessages}
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              'flex motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200',
              msg.direction === 'sent' ? 'justify-end' : 'justify-start',
            )}
          >
            <div
              className={cn(
                'max-w-[75%] rounded-2xl px-4 py-2.5',
                msg.direction === 'sent'
                  ? 'bg-primary text-primary-foreground rounded-br-sm'
                  : 'bg-secondary text-foreground rounded-bl-sm',
              )}
            >
              {msg.content && (
                <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
              )}
              {msg.attachment && (
                <div
                  className={cn(
                    'mt-2 flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs',
                    msg.direction === 'sent'
                      ? 'bg-primary-foreground/15'
                      : 'bg-background/60',
                  )}
                >
                  <FileText className="size-4 shrink-0" />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{msg.attachment.filename}</p>
                    <p className="opacity-70">{formatSize(msg.attachment.size)}</p>
                  </div>
                </div>
              )}
              <div
                className={cn(
                  'flex items-center gap-1 mt-1 text-[10px]',
                  msg.direction === 'sent'
                    ? 'text-primary-foreground/70 justify-end'
                    : 'text-muted-foreground',
                )}
              >
                <Lock className="size-2.5" />
                <span>{formatTime(msg.createdAt)}</span>
                {msg.direction === 'sent' && (
                  <DeliveryStatus message={msg} strings={strings} />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Composer */}
      <div className="border-t border-border p-3 shrink-0">
        {attachment && (
          <div className="mb-2 flex items-center gap-2 rounded-lg bg-secondary px-3 py-2 text-xs">
            <Paperclip className="size-3.5 text-muted-foreground" />
            <span className="truncate flex-1 text-foreground">{attachment.filename}</span>
            <button onClick={() => setAttachment(null)} aria-label="Remove attachment">
              <X className="size-3.5 text-muted-foreground hover:text-foreground" />
            </button>
          </div>
        )}
        <div className="flex items-end gap-2">
          <Button
            variant="outline"
            size="icon"
            className="shrink-0"
            onClick={() => setAttachOpen(true)}
            disabled={!messaging.canMessage}
            aria-label={strings.messages.attachFromVault}
          >
            <Paperclip className="size-4" />
          </Button>
          <RetentionControl
            value={retention}
            onChange={(r) => { setRetention(r); saveRetention(r); }}
            disabled={!messaging.canMessage}
            strings={strings}
          />
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={strings.messages.typeMessage}
            className="min-h-[2.5rem] max-h-32 resize-none"
            rows={1}
            disabled={!messaging.canMessage}
          />
          <Button
            size="icon"
            className="shrink-0"
            onClick={handleSend}
            disabled={messaging.isSending || (!draft.trim() && !attachment) || !messaging.canMessage}
            aria-label={strings.messages.send}
          >
            {messaging.isSending
              ? <Loader2 className="size-4 animate-spin" />
              : <Send className="size-4" />}
          </Button>
        </div>
        <p className="mt-1.5 text-[10px] text-muted-foreground flex items-center gap-1 flex-wrap">
          <Lock className="size-2.5" />
          {strings.messages.encryptedNote}
          {retention !== 'never' && (
            <>
              <span>·</span>
              <Clock className="size-2.5" />
              {strings.messages.retention}: {retentionLabel(retention, strings)}
            </>
          )}
        </p>
      </div>

      {/* Attach-from-vault dialog */}
      <AttachVaultDialog
        open={attachOpen}
        onOpenChange={setAttachOpen}
        documents={vault.displayDocuments}
        onSelect={(att) => { setAttachment(att); setAttachOpen(false); }}
        strings={strings}
      />
    </div>
  );
}

// ─── Message retention control (Phase VII) ──────────────────────────

function retentionLabel(r: MessageRetention, strings: LocaleStrings): string {
  switch (r) {
    case 'never': return strings.messages.retentionNever;
    case '24h': return strings.messages.retention24h;
    case '7d': return strings.messages.retention7d;
    case '30d': return strings.messages.retention30d;
    case '90d': return strings.messages.retention90d;
    case '1y': return strings.messages.retention1y;
  }
}

function RetentionControl({
  value, onChange, disabled, strings,
}: {
  value: MessageRetention;
  onChange: (r: MessageRetention) => void;
  disabled?: boolean;
  strings: LocaleStrings;
}) {
  const [open, setOpen] = useState(false);
  const active = value !== 'never';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={cn('shrink-0 relative', active && 'text-primary border-primary/40')}
          disabled={disabled}
          aria-label={strings.messages.retention}
        >
          <Clock className="size-4" />
          {active && (
            <span className="absolute -top-1 -right-1 size-2 rounded-full bg-primary" aria-hidden />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="start" side="top">
        <p className="px-2 py-1 text-xs font-medium text-foreground">{strings.messages.retention}</p>
        <p className="px-2 pb-2 text-[10px] text-muted-foreground">{strings.messages.retentionHint}</p>
        <div className="space-y-0.5">
          {RETENTION_OPTIONS.map((r) => (
            <button
              key={r}
              onClick={() => { onChange(r); setOpen(false); }}
              className={cn(
                'w-full flex items-center justify-between rounded-md px-2 py-1.5 text-sm text-left transition-colors',
                r === value ? 'bg-primary/10 text-primary' : 'hover:bg-secondary/60 text-foreground',
              )}
            >
              {retentionLabel(r, strings)}
              {r === value && <Check className="size-3.5" />}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ─── Delivery status indicator (Phase VI) ───────────────────────────

function DeliveryStatus({
  message, strings,
}: {
  message: SecureMessage;
  strings: LocaleStrings;
}) {
  const status = message.deliveryStatus ?? 'sent';

  const routeLabel = (() => {
    switch (message.relaySource) {
      case 'dm-relays': return strings.messages.routeDmRelays;
      case 'nip65': return strings.messages.routeNip65;
      case 'nip05': return strings.messages.routeNip05;
      default: return strings.messages.routeFallback;
    }
  })();

  const icon = (() => {
    switch (status) {
      case 'sending':
        return <Loader2 className="size-2.5 animate-spin" aria-hidden />;
      case 'failed':
        return <AlertCircle className="size-2.5 text-red-300" aria-hidden />;
      case 'read':
        return <CheckCheck className="size-3 text-sky-300" aria-hidden />;
      case 'sent':
      default:
        return <Check className="size-3" aria-hidden />;
    }
  })();

  const label = (() => {
    switch (status) {
      case 'sending': return strings.messages.statusSending;
      case 'failed': return strings.messages.statusFailed;
      case 'read': return strings.messages.statusRead;
      default: return strings.messages.statusSent;
    }
  })();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center" aria-label={label}>{icon}</span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <p className="text-xs font-medium">{label}</p>
        {(status === 'sent' || status === 'read') && message.relayCount !== undefined && (
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {strings.messages.deliveredTo.replace('{n}', String(message.relayCount))}
            {' · '}
            {strings.messages.routedVia} {routeLabel}
          </p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}

// ─── New conversation dialog ─────────────────────────────────────────

function NewConversationDialog({
  open, onOpenChange, onStart, strings,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onStart: (pubkey: string) => void;
  strings: LocaleStrings;
}) {
  const navigate = useNavigate();
  const { contacts } = useContacts();
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);

  const handleStart = () => {
    const pubkey = parsePubkey(value);
    if (!pubkey) {
      setError(true);
      return;
    }
    onStart(pubkey);
    setValue('');
    setError(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) { setValue(''); setError(false); } }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-serif">{strings.messages.newConversation}</DialogTitle>
          <DialogDescription>{strings.messages.encryptedNote}</DialogDescription>
        </DialogHeader>

        {/* Pick from saved contacts */}
        {contacts.length > 0 && (
          <div className="space-y-2">
            <Label>{strings.contacts.pickContact}</Label>
            <div className="max-h-52 overflow-y-auto -mx-1 px-1 space-y-1">
              {contacts.map((contact) => (
                <button
                  key={contact.pubkey}
                  onClick={() => onStart(contact.pubkey)}
                  className="w-full flex items-center gap-3 p-2 rounded-lg text-left hover:bg-secondary/60 transition-colors"
                >
                  <Avatar className="size-9 shrink-0">
                    <AvatarImage src={contact.picture} alt={contact.name} />
                    <AvatarFallback className="bg-primary/10 text-primary font-serif font-bold text-xs">
                      {initialsFromName(contact.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{contact.name}</p>
                    {contact.nip05 && (
                      <p className="text-xs text-primary font-mono truncate">{contact.nip05}</p>
                    )}
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="recipient-key">
            {contacts.length > 0 ? strings.contacts.orEnterKey : strings.messages.recipientKey}
          </Label>
          <Input
            id="recipient-key"
            value={value}
            onChange={(e) => { setValue(e.target.value); setError(false); }}
            onKeyDown={(e) => { if (e.key === 'Enter') handleStart(); }}
            placeholder={strings.messages.recipientKeyPlaceholder}
            aria-invalid={error}
            className="font-mono text-sm"
          />
          {error && (
            <p className="text-xs text-destructive">{strings.messages.invalidKey}</p>
          )}
        </div>

        <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-between">
          <Button
            variant="ghost"
            onClick={() => { onOpenChange(false); navigate('/directory'); }}
            className="text-muted-foreground"
          >
            <UserPlus className="size-4 mr-1" />
            {strings.contacts.addContact}
          </Button>
          <div className="flex gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {strings.common.cancel}
            </Button>
            <Button onClick={handleStart} disabled={!value.trim()}>
              {strings.messages.startConversation}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Attach from vault dialog ────────────────────────────────────────

function AttachVaultDialog({
  open, onOpenChange, documents, onSelect, strings,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  documents: ReturnType<typeof useVault>['displayDocuments'];
  onSelect: (attachment: MessageAttachment) => void;
  strings: LocaleStrings;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-serif">{strings.messages.attachFromVault}</DialogTitle>
          <DialogDescription>{strings.vault.allEncrypted}</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-72 -mx-2 px-2">
          {documents.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                {strings.vault.noDocuments}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-1">
              {documents.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => onSelect({
                    filename: doc.filename,
                    size: doc.size,
                    hash: '',
                    documentId: doc.id,
                  })}
                  className="w-full flex items-center gap-3 p-2.5 rounded-lg text-left hover:bg-secondary/60 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <FileText className="size-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{doc.filename}</p>
                    <p className="text-xs text-muted-foreground">{formatSize(doc.size)}</p>
                  </div>
                  <Lock className="size-3.5 text-muted-foreground shrink-0" />
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// ─── Formatting helpers ──────────────────────────────────────────────

function formatSize(bytes: number): string {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  if (bytes >= 1000) return `${(bytes / 1000).toFixed(0)} KB`;
  return `${bytes} B`;
}

function formatTime(ts: number): string {
  return new Date(ts * 1000).toLocaleTimeString('de-CH', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function relativeTime(ts: number, strings: LocaleStrings): string {
  const now = Date.now();
  const then = ts * 1000;
  const diffDays = Math.floor((now - then) / (24 * 60 * 60 * 1000));
  if (diffDays === 0) return formatTime(ts);
  if (diffDays === 1) return strings.messages.yesterday;
  return new Date(then).toLocaleDateString('de-CH', { day: 'numeric', month: 'short' });
}

export default Messages;

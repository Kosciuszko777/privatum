/**
 * AddContactDialog — Phase V.
 *
 * Resolve a free-text identifier (NIP-05 address, npub, or hex key) into a
 * verified contact, show a confirmation preview with the NIP-05 check
 * result, and save it to the trusted-contacts registry.
 */

import { useState } from 'react';
import { nip19 } from 'nostr-tools';
import {
  Loader2, ShieldCheck, ShieldAlert, Search, UserPlus, Info,
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { VerificationBadge } from '@/components/profile/VerificationBadge';
import { useContacts, type ResolveResult } from '@/hooks/useContacts';
import { useLocale } from '@/hooks/useLocale';
import { toast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';

interface AddContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the pubkey after a contact is saved. */
  onSaved?: (pubkey: string) => void;
  /** Pre-fill the input (e.g. from the directory). */
  initialValue?: string;
}

export function AddContactDialog({
  open, onOpenChange, onSaved, initialValue,
}: AddContactDialogProps) {
  const { strings } = useLocale();
  const contacts = useContacts();
  const [value, setValue] = useState(initialValue ?? '');
  const [result, setResult] = useState<ResolveResult | null>(null);
  const [notFound, setNotFound] = useState(false);

  const reset = () => {
    setValue(initialValue ?? '');
    setResult(null);
    setNotFound(false);
  };

  const handleResolve = async () => {
    if (!value.trim()) return;
    setResult(null);
    setNotFound(false);
    const resolved = await contacts.resolve(value);
    if (resolved) {
      setResult(resolved);
    } else {
      setNotFound(true);
    }
  };

  const handleSave = () => {
    if (!result) return;
    contacts.addContact(result);
    toast({ title: strings.contacts.saved });
    onSaved?.(result.pubkey);
    onOpenChange(false);
    reset();
  };

  const initials = (name: string) =>
    name.split(/\s+/).map((n) => n.charAt(0)).join('').slice(0, 2).toUpperCase();

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => { onOpenChange(o); if (!o) reset(); }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-serif">{strings.contacts.addContactTitle}</DialogTitle>
          <DialogDescription>{strings.contacts.addContactDesc}</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="contact-identifier">{strings.contacts.identifierLabel}</Label>
          <div className="flex gap-2">
            <Input
              id="contact-identifier"
              value={value}
              onChange={(e) => { setValue(e.target.value); setNotFound(false); }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleResolve(); }}
              placeholder={strings.contacts.identifierPlaceholder}
              className="font-mono text-sm"
              aria-invalid={notFound}
            />
            <Button
              variant="outline"
              onClick={handleResolve}
              disabled={contacts.isResolving || !value.trim()}
              className="shrink-0"
            >
              {contacts.isResolving
                ? <Loader2 className="size-4 animate-spin" />
                : <Search className="size-4" />}
              <span className="ml-1 hidden sm:inline">
                {contacts.isResolving ? strings.contacts.resolving : strings.contacts.resolve}
              </span>
            </Button>
          </div>
          {notFound && (
            <p className="text-xs text-destructive">{strings.contacts.notFound}</p>
          )}
        </div>

        {/* Resolution preview */}
        {result && (
          <div className="rounded-xl border border-border bg-secondary/30 p-4 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200">
            <div className="flex items-center gap-3">
              <Avatar className="size-12 shrink-0">
                <AvatarImage src={result.picture} alt={result.name} />
                <AvatarFallback className="bg-primary/10 text-primary font-serif font-bold">
                  {initials(result.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground truncate">{result.name}</p>
                {result.title && (
                  <p className="text-sm text-muted-foreground truncate">{result.title}</p>
                )}
                {result.nip05 && (
                  <p className="text-xs text-primary font-mono truncate">{result.nip05}</p>
                )}
              </div>
              {result.verificationTier && (
                <VerificationBadge tier={result.verificationTier} size="sm" />
              )}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {result.nip05 && (
                <Badge
                  variant="outline"
                  className={cn(
                    'gap-1 text-[10px]',
                    result.nip05Verified
                      ? 'border-green-300 text-green-700 dark:text-green-400'
                      : 'border-brass/40 text-brass',
                  )}
                >
                  {result.nip05Verified
                    ? <ShieldCheck className="size-3" />
                    : <ShieldAlert className="size-3" />}
                  {result.nip05Verified
                    ? strings.contacts.nip05Verified
                    : strings.contacts.nip05Mismatch}
                </Badge>
              )}
              {!result.title && !result.picture && (
                <span className="text-xs text-muted-foreground">{strings.contacts.noProfile}</span>
              )}
            </div>

            <p className="mt-3 text-[11px] text-muted-foreground font-mono break-all">
              {nip19.npubEncode(result.pubkey)}
            </p>
          </div>
        )}

        <div className="flex items-start gap-2 rounded-lg bg-primary/5 border border-primary/10 p-3">
          <Info className="size-4 text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">{strings.contacts.primaryReference}</p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {strings.common.cancel}
          </Button>
          <Button onClick={handleSave} disabled={!result}>
            <UserPlus className="size-4 mr-1" />
            {strings.contacts.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

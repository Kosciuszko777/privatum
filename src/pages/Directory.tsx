/**
 * DIRECTORY — Phase V.
 *
 * Verified-contact discovery. Two views:
 *  - Directory: a curated list of register-verified professionals. Each can
 *    be added to contacts (resolving their NIP-05) or messaged directly.
 *  - My Contacts: the user's trusted-contacts registry, searchable, each
 *    linking into a secure conversation.
 *
 * Addressing is always by name; the public key stays the primary reference.
 */

import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSeoMeta } from '@unhead/react';
import { nip19 } from 'nostr-tools';
import {
  ArrowLeft, Users, Search, UserPlus, Trash2, MessageSquareLock,
  ShieldCheck, ShieldAlert, BookUser,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { VerificationBadge } from '@/components/profile/VerificationBadge';
import { AddContactDialog } from '@/components/contacts/AddContactDialog';
import { useLocale } from '@/hooks/useLocale';
import { useContacts } from '@/hooks/useContacts';
import { toast } from '@/hooks/useToast';
import { demoDirectory, type DirectoryProfessional } from '@/lib/demoData';
import type { Contact } from '@/lib/contacts';
import { cn } from '@/lib/utils';

type LocaleStrings = ReturnType<typeof useLocale>['strings'];

function initialsFromName(name: string): string {
  return name.split(/\s+/).map((n) => n.charAt(0)).join('').slice(0, 2).toUpperCase();
}

const Directory = () => {
  const { strings } = useLocale();
  const navigate = useNavigate();
  const contacts = useContacts();
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [addPrefill, setAddPrefill] = useState<string | undefined>();
  const [pendingRemove, setPendingRemove] = useState<Contact | null>(null);

  useSeoMeta({
    title: `PRIVATUM — ${strings.contacts.title}`,
    description: strings.contacts.subtitle,
  });

  const filteredContacts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return contacts.contacts;
    return contacts.contacts.filter((c) =>
      c.name.toLowerCase().includes(q)
      || c.title?.toLowerCase().includes(q)
      || c.nip05?.toLowerCase().includes(q),
    );
  }, [contacts.contacts, search]);

  const isAdded = (nip05: string, name: string) =>
    contacts.contacts.some((c) => c.nip05 === nip05 || c.name === name);

  const openAddFor = (prefill?: string) => {
    setAddPrefill(prefill);
    setAddOpen(true);
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
            <BookUser className="size-5 text-primary" />
            <h1 className="font-sans font-semibold text-foreground">{strings.contacts.title}</h1>
          </div>
          <div className="ml-auto">
            <Button size="sm" onClick={() => openAddFor()}>
              <UserPlus className="size-4 mr-1" />
              <span className="hidden sm:inline">{strings.contacts.addContact}</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container max-w-4xl py-8">
        <div className="mb-6">
          <h2 className="font-serif font-semibold text-2xl text-foreground">{strings.contacts.title}</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{strings.contacts.subtitle}</p>
        </div>

        <Tabs defaultValue="contacts" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="contacts">
              <Users className="size-4" />
              {strings.contacts.myContactsTab}
              {contacts.contacts.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-[10px] px-1.5">
                  {contacts.contacts.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="directory">
              <BookUser className="size-4" />
              {strings.contacts.directoryTab}
            </TabsTrigger>
          </TabsList>

          {/* My Contacts */}
          <TabsContent value="contacts" className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={strings.contacts.searchPlaceholder}
                className="pl-9"
              />
            </div>

            {filteredContacts.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-16 text-center">
                  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mx-auto mb-3">
                    <Users className="size-5 text-muted-foreground" />
                  </div>
                  <p className="font-medium text-foreground mb-1">{strings.contacts.noContacts}</p>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-4">
                    {strings.contacts.noContactsDesc}
                  </p>
                  <Button size="sm" variant="outline" onClick={() => openAddFor()}>
                    <UserPlus className="size-4 mr-1" />
                    {strings.contacts.addContact}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {filteredContacts.map((contact) => (
                  <ContactRow
                    key={contact.pubkey}
                    contact={contact}
                    onMessage={() => navigate(`/messages?to=${contact.pubkey}`)}
                    onRemove={() => setPendingRemove(contact)}
                    strings={strings}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Directory */}
          <TabsContent value="directory" className="space-y-4">
            <div className="rounded-xl bg-primary/5 border border-primary/10 p-4">
              <p className="font-medium text-sm text-foreground">{strings.contacts.verifiedDirectory}</p>
              <p className="text-sm text-muted-foreground">{strings.contacts.verifiedDirectoryDesc}</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {demoDirectory.map((pro) => (
                <DirectoryCard
                  key={pro.nip05}
                  pro={pro}
                  added={isAdded(pro.nip05, pro.name)}
                  onAdd={() => openAddFor(pro.nip05)}
                  strings={strings}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Add contact dialog */}
      <AddContactDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        initialValue={addPrefill}
        onSaved={() => contacts.refresh()}
      />

      {/* Remove confirmation */}
      <AlertDialog open={!!pendingRemove} onOpenChange={(o) => { if (!o) setPendingRemove(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{strings.contacts.remove}</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingRemove?.name}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{strings.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingRemove) {
                  contacts.removeContact(pendingRemove.pubkey);
                  toast({ title: strings.contacts.removed });
                  setPendingRemove(null);
                }
              }}
            >
              {strings.common.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// ─── Saved contact row ───────────────────────────────────────────────

function ContactRow({
  contact, onMessage, onRemove, strings,
}: {
  contact: Contact;
  onMessage: () => void;
  onRemove: () => void;
  strings: LocaleStrings;
}) {
  return (
    <Card className="border-border hover:shadow-sm transition-shadow">
      <CardContent className="p-4 flex items-center gap-3">
        <Avatar className="size-11 shrink-0">
          <AvatarImage src={contact.picture} alt={contact.name} />
          <AvatarFallback className="bg-primary/10 text-primary font-serif font-bold text-sm">
            {initialsFromName(contact.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-foreground truncate">{contact.name}</span>
            {contact.verificationTier && (
              <VerificationBadge tier={contact.verificationTier} size="sm" />
            )}
          </div>
          {contact.title && (
            <p className="text-sm text-muted-foreground truncate">{contact.title}</p>
          )}
          <div className="flex items-center gap-2 mt-0.5">
            {contact.nip05 ? (
              <span className="inline-flex items-center gap-1 text-xs text-primary font-mono truncate">
                {contact.nip05Verified
                  ? <ShieldCheck className="size-3 text-green-600" />
                  : <ShieldAlert className="size-3 text-brass" />}
                {contact.nip05}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground font-mono truncate">
                {nip19.npubEncode(contact.pubkey).slice(0, 18)}…
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button size="sm" variant="outline" onClick={onMessage}>
            <MessageSquareLock className="size-4 sm:mr-1" />
            <span className="hidden sm:inline">{strings.contacts.message}</span>
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={onRemove}
            aria-label={strings.contacts.remove}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Directory card ──────────────────────────────────────────────────

function DirectoryCard({
  pro, added, onAdd, strings,
}: {
  pro: DirectoryProfessional;
  added: boolean;
  onAdd: () => void;
  strings: LocaleStrings;
}) {
  return (
    <Card className="border-border">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="size-11 shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary font-serif font-bold text-sm">
              {initialsFromName(pro.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-foreground truncate">{pro.name}</p>
            <p className="text-xs text-muted-foreground truncate">{pro.title}</p>
            <p className="text-xs text-muted-foreground truncate">{pro.jurisdiction}</p>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between gap-2">
          <VerificationBadge
            tier={pro.verified}
            source={pro.verificationSource}
            domain={pro.verificationSource}
            size="sm"
          />
          <Button
            size="sm"
            variant={added ? 'ghost' : 'outline'}
            onClick={onAdd}
            disabled={added}
            className={cn(added && 'text-muted-foreground')}
          >
            {added ? (
              <>
                <ShieldCheck className="size-3.5 mr-1 text-green-600" />
                {strings.contacts.alreadyAdded}
              </>
            ) : (
              <>
                <UserPlus className="size-3.5 mr-1" />
                {strings.contacts.addContact}
              </>
            )}
          </Button>
        </div>
        <p className="mt-2 text-[11px] text-primary font-mono truncate">{pro.nip05}</p>
      </CardContent>
    </Card>
  );
}

export default Directory;

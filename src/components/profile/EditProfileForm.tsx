/**
 * Edit profile form for professionals.
 * Handles both standard Nostr metadata and Privatum-specific fields.
 */

import { useState, useRef } from 'react';
import { Camera, Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useUploadFile } from '@/hooks/useUploadFile';
import { toast } from '@/hooks/useToast';
import { useLocale } from '@/hooks/useLocale';
import type { NostrMetadata } from '@nostrify/nostrify';

interface EditProfileFormProps {
  onSaved?: () => void;
}

export function EditProfileForm({ onSaved }: EditProfileFormProps) {
  const { strings } = useLocale();
  const { user, metadata } = useCurrentUser();
  const { mutateAsync: publishEvent, isPending: isPublishing } = useNostrPublish();
  const { mutateAsync: uploadFile, isPending: isUploading } = useUploadFile();
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Standard Nostr metadata
  const [name, setName] = useState(metadata?.name ?? '');
  const [about, setAbout] = useState(metadata?.about ?? '');
  const [picture, setPicture] = useState(metadata?.picture ?? '');
  const [website, setWebsite] = useState(metadata?.website ?? '');

  // Privatum-specific fields (stored in kind 0 content JSON)
  const existing = metadata as (NostrMetadata & Record<string, unknown>) | undefined;
  const [handle, setHandle] = useState(
    typeof existing?.privatum_handle === 'string' ? existing.privatum_handle : ''
  );
  const [professionalTitle, setProfessionalTitle] = useState(
    typeof existing?.privatum_title === 'string' ? existing.privatum_title : ''
  );
  const [jurisdiction, setJurisdiction] = useState(
    typeof existing?.privatum_jurisdiction === 'string' ? existing.privatum_jurisdiction : ''
  );
  const [retention, setRetention] = useState(
    typeof existing?.privatum_retention === 'string' ? existing.privatum_retention : '30d'
  );

  const initials = name
    .split(' ')
    .map((n) => n.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?';

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Bitte wählen Sie ein Bild.', variant: 'destructive' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Bild zu gross (max. 5 MB).', variant: 'destructive' });
      return;
    }

    try {
      const tags = await uploadFile(file);
      const url = tags[0]?.[1];
      if (url) setPicture(url);
    } catch {
      toast({ title: 'Upload fehlgeschlagen.', variant: 'destructive' });
    }
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      const content: Record<string, unknown> = {};

      // Standard Nostr metadata
      if (name) content.name = name;
      if (about) content.about = about;
      if (picture) content.picture = picture;
      if (website) content.website = website;

      // Privatum-specific fields
      if (handle) content.privatum_handle = handle.toLowerCase().replace(/[^a-z0-9-]/g, '');
      if (professionalTitle) content.privatum_title = professionalTitle;
      if (jurisdiction) content.privatum_jurisdiction = jurisdiction;
      if (retention) content.privatum_retention = retention;

      // Always mark as self-declared on save (verification requires separate process)
      content.privatum_verification_tier = 'self-declared';

      await publishEvent({ kind: 0, content: JSON.stringify(content) });

      // Persist handle to localStorage for quick access
      if (handle) {
        localStorage.setItem('privatum:handle', handle);
      }

      toast({ title: 'Profil gespeichert.' });
      onSaved?.();
    } catch {
      toast({ title: 'Speichern fehlgeschlagen.', variant: 'destructive' });
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Avatar & Name */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="font-sans text-base">Profil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Avatar className="w-16 h-16">
                <AvatarImage src={picture} alt={name} />
                <AvatarFallback className="bg-primary/10 text-primary font-serif font-bold text-xl">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => avatarInputRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                disabled={isUploading}
              >
                {isUploading ? (
                  <Loader2 className="size-5 text-white animate-spin" />
                ) : (
                  <Camera className="size-5 text-white" />
                )}
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </div>
            <div className="flex-1 space-y-2">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  {strings.onboarding.name}
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Dr. Anna Meier"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Über mich
            </label>
            <Textarea
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              placeholder="Kurze Beschreibung Ihrer Praxis oder Tätigkeit …"
              className="min-h-20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Website
            </label>
            <Input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://meier-law.ch"
            />
          </div>
        </CardContent>
      </Card>

      {/* Privatum-specific */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="font-sans text-base">Privatum-Kanal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Handle
            </label>
            <div className="flex items-center gap-0">
              <span className="px-3 py-2 bg-secondary rounded-l-md border border-r-0 border-input text-sm text-muted-foreground">
                privatum.ch/
              </span>
              <Input
                value={handle}
                onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                className="rounded-l-none"
                placeholder="anna-meier"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              {strings.onboarding.professionalTitle}
            </label>
            <Input
              value={professionalTitle}
              onChange={(e) => setProfessionalTitle(e.target.value)}
              placeholder="Rechtsanwältin / Attorney at Law"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              {strings.onboarding.jurisdiction}
            </label>
            <Input
              value={jurisdiction}
              onChange={(e) => setJurisdiction(e.target.value)}
              placeholder="Zürich, Schweiz"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              {strings.onboarding.retention}
            </label>
            <Select value={retention} onValueChange={setRetention}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="download">Nach erstem Download löschen</SelectItem>
                <SelectItem value="24h">Nach 24 Stunden löschen</SelectItem>
                <SelectItem value="7d">Nach 7 Tagen löschen</SelectItem>
                <SelectItem value="30d">Nach 30 Tagen löschen</SelectItem>
                <SelectItem value="vault">In verschlüsselten Vault verschieben</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      <Button onClick={handleSave} disabled={isPublishing} className="w-full">
        {isPublishing ? (
          <>
            <Loader2 className="size-4 mr-2 animate-spin" />
            Wird gespeichert …
          </>
        ) : (
          <>
            <Save className="size-4 mr-2" />
            {strings.common.save}
          </>
        )}
      </Button>
    </div>
  );
}

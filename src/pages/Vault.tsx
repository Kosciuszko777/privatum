/**
 * VAULT — §5 Zero-knowledge encrypted storage.
 *
 * Matters, cases, patients, folders.
 * Client-side encryption throughout.
 * Permission layer with grant/revoke/audit.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSeoMeta } from '@unhead/react';
import {
  ArrowLeft, Plus, FolderPlus, Upload, ChevronLeft, Shield,
  Lock, FileText, Search, Share2, LayoutGrid, List
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { VaultFolderCard } from '@/components/vault/VaultFolderCard';
import { VaultDocumentRow } from '@/components/vault/VaultDocumentRow';
import { PermissionGrantCard } from '@/components/vault/PermissionGrantCard';
import { useLocale } from '@/hooks/useLocale';
import {
  demoVaultFolders,
  demoVaultDocuments,
  demoAccessGrants,
} from '@/lib/demoData';
import { toast } from '@/hooks/useToast';

const Vault = () => {
  const { strings } = useLocale();
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDesc, setNewFolderDesc] = useState('');

  useSeoMeta({ title: 'PRIVATUM — Vault' });

  const activeFolder = activeFolderId
    ? demoVaultFolders.find((f) => f.id === activeFolderId)
    : null;

  const documentsInFolder = activeFolderId
    ? demoVaultDocuments.filter((d) => d.folderId === activeFolderId)
    : [];

  const allDocuments = demoVaultDocuments;

  const filteredDocuments = searchQuery
    ? allDocuments.filter((d) =>
        d.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.senderName?.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : documentsInFolder;

  const totalSize = allDocuments.reduce((sum, d) => sum + d.size, 0);
  const formatSize = (bytes: number) => {
    if (bytes >= 1000000000) return `${(bytes / 1000000000).toFixed(1)} GB`;
    if (bytes >= 1000000) return `${(bytes / 1000000).toFixed(1)} MB`;
    return `${(bytes / 1000).toFixed(0)} KB`;
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    toast({ title: `Ordner "${newFolderName}" erstellt.` });
    setCreateFolderOpen(false);
    setNewFolderName('');
    setNewFolderDesc('');
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
            <Lock className="size-5 text-primary" />
            <h1 className="font-sans font-semibold text-foreground">
              Vault
            </h1>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setCreateFolderOpen(true)}>
              <FolderPlus className="size-4 mr-1" />
              Neuer Ordner
            </Button>
          </div>
        </div>
      </header>

      <main className="container max-w-5xl py-8 space-y-6">
        {/* Stats bar */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Lock className="size-3.5 text-primary" />
            <span className="font-medium text-foreground">{allDocuments.length}</span> Dokumente
          </span>
          <span>·</span>
          <span>
            <span className="font-medium text-foreground">{demoVaultFolders.length}</span> Ordner
          </span>
          <span>·</span>
          <span>
            <span className="font-medium text-foreground">{formatSize(totalSize)}</span> verschlüsselt
          </span>
          <span className="ml-auto text-xs">
            Alle Daten sind clientseitig verschlüsselt.
          </span>
        </div>

        <Tabs defaultValue="documents">
          <TabsList>
            <TabsTrigger value="documents">
              <FileText className="size-4 mr-1.5" />
              Dokumente
            </TabsTrigger>
            <TabsTrigger value="permissions">
              <Shield className="size-4 mr-1.5" />
              Berechtigungen
            </TabsTrigger>
          </TabsList>

          <TabsContent value="documents" className="space-y-6 mt-6">
            {/* Search + view toggle */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder={strings.common.search + ' …'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex items-center border border-border rounded-md">
                <Button
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="icon-xs"
                  className="rounded-r-none"
                  onClick={() => setViewMode('grid')}
                >
                  <LayoutGrid className="size-3.5" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="icon-xs"
                  className="rounded-l-none"
                  onClick={() => setViewMode('list')}
                >
                  <List className="size-3.5" />
                </Button>
              </div>
            </div>

            {/* Breadcrumb */}
            {activeFolderId && (
              <div className="flex items-center gap-2 text-sm">
                <button
                  onClick={() => { setActiveFolderId(null); setSearchQuery(''); }}
                  className="text-primary hover:underline flex items-center gap-1"
                >
                  <ChevronLeft className="size-3" />
                  Vault
                </button>
                <span className="text-muted-foreground">/</span>
                <span className="font-medium text-foreground">{activeFolder?.name}</span>
                <Badge variant="outline" className="text-[10px] ml-1">
                  {documentsInFolder.length} Dokumente
                </Badge>
              </div>
            )}

            {/* Search results view */}
            {searchQuery && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground mb-3">
                  {filteredDocuments.length} Ergebnis{filteredDocuments.length !== 1 ? 'se' : ''} für „{searchQuery}"
                </p>
                {filteredDocuments.map((doc) => (
                  <VaultDocumentRow
                    key={doc.id}
                    document={doc}
                    onView={() => toast({ title: `Dokument wird entschlüsselt: ${doc.filename}` })}
                    onDownload={() => toast({ title: `Download: ${doc.filename}` })}
                    onShare={() => toast({ title: 'Zugriff teilen …' })}
                    onDelete={() => toast({ title: `${doc.filename} wird sicher gelöscht.`, variant: 'destructive' })}
                  />
                ))}
                {filteredDocuments.length === 0 && (
                  <Card className="border-dashed">
                    <CardContent className="py-12 text-center">
                      <p className="text-muted-foreground">Keine Dokumente gefunden.</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Folder list */}
            {!activeFolderId && !searchQuery && (
              <div className={viewMode === 'grid' ? 'grid sm:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
                {demoVaultFolders.map((folder) => (
                  <VaultFolderCard
                    key={folder.id}
                    folder={folder}
                    onClick={() => setActiveFolderId(folder.id)}
                    onRename={() => toast({ title: 'Umbenennen …' })}
                    onDelete={() => toast({ title: `Ordner "${folder.name}" wird gelöscht.`, variant: 'destructive' })}
                    onShare={() => toast({ title: 'Zugriff teilen …' })}
                  />
                ))}
              </div>
            )}

            {/* Document list within a folder */}
            {activeFolderId && !searchQuery && (
              <div className="space-y-1">
                {activeFolder?.description && (
                  <p className="text-sm text-muted-foreground mb-4">{activeFolder.description}</p>
                )}
                {documentsInFolder.map((doc) => (
                  <VaultDocumentRow
                    key={doc.id}
                    document={doc}
                    onView={() => toast({ title: `Entschlüsseln: ${doc.filename}` })}
                    onDownload={() => toast({ title: `Download: ${doc.filename}` })}
                    onShare={() => toast({ title: 'Zugriff teilen …' })}
                    onDelete={() => toast({ title: `${doc.filename} wird sicher gelöscht.`, variant: 'destructive' })}
                  />
                ))}
                {documentsInFolder.length === 0 && (
                  <Card className="border-dashed">
                    <CardContent className="py-12 text-center">
                      <Upload className="size-8 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">
                        Dieser Ordner ist leer. Verschieben Sie Dokumente aus dem Posteingang hierher.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="permissions" className="space-y-6 mt-6">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="font-sans text-base flex items-center gap-2">
                  <Shield className="size-4" />
                  Erteilte Zugriffsberechtigungen
                </CardTitle>
                <CardDescription>
                  Kryptographisch signierte Zugriffserteilungen. Widerruf ist real: Schlüssel werden rotiert, Berechtigungen verfallen.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {demoAccessGrants.map((grant) => (
                  <PermissionGrantCard
                    key={grant.id}
                    grant={grant}
                    onRevoke={
                      grant.status === 'active'
                        ? () => toast({ title: `Zugriff für "${grant.grantedName}" widerrufen.` })
                        : undefined
                    }
                  />
                ))}
              </CardContent>
            </Card>

            {/* Permission verbs reference */}
            <Card className="border-border bg-secondary/20">
              <CardContent className="p-6">
                <h3 className="font-sans font-medium text-sm text-foreground mb-3">Berechtigungsstufen</h3>
                <div className="grid sm:grid-cols-2 gap-3 text-xs text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <Badge variant="outline" className="text-[10px] shrink-0">Ansehen</Badge>
                    <span>Empfänger kann das Dokument im Browser entschlüsseln und anzeigen.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge variant="outline" className="text-[10px] shrink-0">Herunterladen</Badge>
                    <span>Empfänger kann das entschlüsselte Dokument lokal speichern.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge variant="outline" className="text-[10px] shrink-0">Weiterleiten</Badge>
                    <span>Empfänger kann den verschlüsselten Zugriff an Dritte übertragen.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge variant="outline" className="text-[10px] shrink-0">Delegieren</Badge>
                    <span>Empfänger kann selbst Berechtigungen an andere erteilen.</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Create folder dialog */}
      <Dialog open={createFolderOpen} onOpenChange={setCreateFolderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neuer Vault-Ordner</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Name</label>
              <Input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Nachlasssache Müller"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Beschreibung (optional)</label>
              <Input
                value={newFolderDesc}
                onChange={(e) => setNewFolderDesc(e.target.value)}
                placeholder="Erbschaftsangelegenheiten Familie Müller"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateFolderOpen(false)}>
              {strings.common.cancel}
            </Button>
            <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
              <FolderPlus className="size-4 mr-1" />
              Ordner erstellen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Vault;

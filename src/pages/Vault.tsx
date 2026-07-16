/**
 * VAULT — §5 Zero-knowledge encrypted storage.
 *
 * Real encryption (AES-256-GCM) via cryptvault.
 * Real storage via IndexedDB StorageDriver.
 * Demo data is merged with real data for a rich demo experience.
 */

import { useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useSeoMeta } from '@unhead/react';
import {
  ArrowLeft, FolderPlus, Upload, ChevronLeft, Shield,
  Lock, FileText, Search, LayoutGrid, List, Plus
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
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { VaultFolderCard } from '@/components/vault/VaultFolderCard';
import { VaultDocumentRow } from '@/components/vault/VaultDocumentRow';
import { PermissionGrantCard } from '@/components/vault/PermissionGrantCard';
import { FolderPickerDialog } from '@/components/vault/FolderPickerDialog';
import { useLocale } from '@/hooks/useLocale';
import { useVault } from '@/hooks/useVault';
import { toast } from '@/hooks/useToast';
import type { VaultRetention } from '@/lib/vault';

const Vault = () => {
  const { strings } = useLocale();
  const vault = useVault();

  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDesc, setNewFolderDesc] = useState('');

  // Upload dialog state
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadRetention, setUploadRetention] = useState<VaultRetention>('manual');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'encrypting' | 'storing' | 'complete'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Folder picker for uploads when not inside a folder
  const [folderPickerOpen, setFolderPickerOpen] = useState(false);

  useSeoMeta({ title: `PRIVATUM — ${strings.vault.title}` });

  const activeFolder = activeFolderId
    ? vault.displayFolders.find((f) => f.id === activeFolderId)
    : null;

  const documentsInFolder = activeFolderId
    ? vault.displayDocuments.filter((d) => d.folderId === activeFolderId)
    : [];

  const filteredDocuments = searchQuery
    ? vault.displayDocuments.filter((d) =>
        d.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.senderName?.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : documentsInFolder;

  const formatSize = (bytes: number) => {
    if (bytes >= 1000000000) return `${(bytes / 1000000000).toFixed(1)} GB`;
    if (bytes >= 1000000) return `${(bytes / 1000000).toFixed(1)} MB`;
    return `${(bytes / 1000).toFixed(0)} KB`;
  };

  // ─── Folder creation ────────────────────────────────────────────

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    vault.createFolder(newFolderName.trim(), newFolderDesc.trim() || undefined);
    toast({ title: `"${newFolderName}" — ${strings.vault.folderCreated}` });
    setCreateFolderOpen(false);
    setNewFolderName('');
    setNewFolderDesc('');
  };

  const handleDeleteFolder = (folderId: string, folderName: string, isDemo: boolean) => {
    if (isDemo) {
      toast({ title: `"${folderName}" — ${strings.vault.folderDeleted}`, variant: 'destructive' });
      return;
    }
    vault.deleteFolder(folderId);
    if (activeFolderId === folderId) setActiveFolderId(null);
    toast({ title: `"${folderName}" — ${strings.vault.folderDeleted}`, variant: 'destructive' });
  };

  // ─── File handling ──────────────────────────────────────────────

  const handleFileDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) setSelectedFiles(files);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length > 0) setSelectedFiles(files);
  }, []);

  // ─── Upload with real encryption ───────────────────────────────

  const handleStartUpload = () => {
    if (selectedFiles.length === 0) return;
    if (activeFolderId) {
      // Already in a folder — upload directly
      performUpload(activeFolderId);
    } else {
      // Need to pick a folder first
      setFolderPickerOpen(true);
    }
  };

  const performUpload = useCallback(async (folderId: string) => {
    if (selectedFiles.length === 0) return;

    setFolderPickerOpen(false);
    setUploadStatus('encrypting');
    setUploadProgress(10);

    try {
      await vault.uploadFiles(
        selectedFiles,
        folderId,
        uploadRetention,
        (step, pct) => {
          setUploadStatus(step);
          setUploadProgress(pct);
        },
      );

      setUploadStatus('complete');
      setUploadProgress(100);

      await new Promise((r) => setTimeout(r, 600));
      toast({ title: strings.vault.uploadComplete });
    } catch {
      toast({ title: strings.common.error, variant: 'destructive' });
    } finally {
      setUploadDialogOpen(false);
      setSelectedFiles([]);
      setUploadProgress(null);
      setUploadStatus('idle');
    }
  }, [selectedFiles, uploadRetention, vault, strings]);

  // ─── Document actions ───────────────────────────────────────────

  const handleDownload = async (docId: string, filename: string, isDemo: boolean) => {
    if (isDemo) {
      toast({ title: `${strings.vault.downloading}: ${filename}` });
      return;
    }
    const ok = await vault.downloadDocument(docId);
    if (ok) {
      toast({ title: `${strings.vault.downloading}: ${filename}` });
    } else {
      toast({ title: strings.common.error, variant: 'destructive' });
    }
  };

  const handleDelete = async (docId: string, filename: string, isDemo: boolean) => {
    if (isDemo) {
      toast({ title: `${filename} ${strings.vault.deleting}`, variant: 'destructive' });
      return;
    }
    await vault.deleteDocument(docId);
    toast({ title: `${filename} ${strings.vault.deleting}`, variant: 'destructive' });
  };

  // ─── Retention options ──────────────────────────────────────────

  const retentionOptions: { value: VaultRetention; label: string }[] = [
    { value: 'manual', label: strings.vault.retentionManual },
    { value: 'after-download', label: strings.vault.retentionAfterDownload },
    { value: '24h', label: strings.vault.retention24h },
    { value: '7d', label: strings.vault.retention7d },
    { value: '30d', label: strings.vault.retention30d },
    { value: '90d', label: strings.vault.retention90d },
    { value: '1y', label: strings.vault.retention1y },
  ];

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
              {strings.vault.title}
            </h1>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setUploadDialogOpen(true)}>
              <Upload className="size-4 mr-1" />
              {strings.vault.uploadFile}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setCreateFolderOpen(true)}>
              <FolderPlus className="size-4 mr-1" />
              {strings.vault.newFolder}
            </Button>
          </div>
        </div>
      </header>

      <main className="container max-w-5xl py-8 space-y-6">
        {/* Stats bar */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Lock className="size-3.5 text-primary" />
            <span className="font-medium text-foreground">{vault.stats.documentCount}</span> {strings.vault.documents}
          </span>
          <span>·</span>
          <span>
            <span className="font-medium text-foreground">{vault.stats.folderCount}</span> {strings.vault.folders}
          </span>
          <span>·</span>
          <span>
            <span className="font-medium text-foreground">{formatSize(vault.stats.totalSize)}</span> {strings.vault.encrypted}
          </span>
          <span className="ml-auto text-xs">
            {strings.vault.allEncrypted}
          </span>
        </div>

        <Tabs defaultValue="documents">
          <TabsList>
            <TabsTrigger value="documents">
              <FileText className="size-4 mr-1.5" />
              {strings.vault.documents}
            </TabsTrigger>
            <TabsTrigger value="permissions">
              <Shield className="size-4 mr-1.5" />
              {strings.vault.permissions}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="documents" className="space-y-6 mt-6">
            {/* Search + view toggle */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder={strings.vault.searchPlaceholder}
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
                  {strings.vault.title}
                </button>
                <span className="text-muted-foreground">/</span>
                <span className="font-medium text-foreground">{activeFolder?.name}</span>
                <Badge variant="outline" className="text-[10px] ml-1">
                  {documentsInFolder.length} {strings.vault.documents}
                </Badge>
              </div>
            )}

            {/* Search results view */}
            {searchQuery && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground mb-3">
                  {filteredDocuments.length} {strings.vault.resultsFor} &ldquo;{searchQuery}&rdquo;
                </p>
                {filteredDocuments.map((doc) => (
                  <VaultDocumentRow
                    key={doc.id}
                    document={doc}
                    onView={() => toast({ title: `${strings.vault.decrypting}: ${doc.filename}` })}
                    onDownload={() => handleDownload(doc.id, doc.filename, doc.isDemo)}
                    onShare={() => toast({ title: `${strings.vault.shareAccess} …` })}
                    onDelete={() => handleDelete(doc.id, doc.filename, doc.isDemo)}
                  />
                ))}
                {filteredDocuments.length === 0 && (
                  <Card className="border-dashed">
                    <CardContent className="py-12 text-center">
                      <p className="text-muted-foreground">{strings.vault.noDocuments}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Folder list */}
            {!activeFolderId && !searchQuery && (
              <div className={viewMode === 'grid' ? 'grid sm:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
                {vault.displayFolders.map((folder) => (
                  <VaultFolderCard
                    key={folder.id}
                    folder={folder}
                    onClick={() => setActiveFolderId(folder.id)}
                    onRename={!folder.isDemo ? () => toast({ title: `${strings.vault.rename} …` }) : undefined}
                    onDelete={() => handleDeleteFolder(folder.id, folder.name, folder.isDemo)}
                    onShare={() => toast({ title: `${strings.vault.shareAccess} …` })}
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

                <div className="mb-4">
                  <Button size="sm" variant="outline" onClick={() => setUploadDialogOpen(true)}>
                    <Plus className="size-4 mr-1" />
                    {strings.vault.uploadFile}
                  </Button>
                </div>

                {documentsInFolder.map((doc) => (
                  <VaultDocumentRow
                    key={doc.id}
                    document={doc}
                    onView={() => toast({ title: `${strings.vault.decrypting}: ${doc.filename}` })}
                    onDownload={() => handleDownload(doc.id, doc.filename, doc.isDemo)}
                    onShare={() => toast({ title: `${strings.vault.shareAccess} …` })}
                    onDelete={() => handleDelete(doc.id, doc.filename, doc.isDemo)}
                  />
                ))}
                {documentsInFolder.length === 0 && (
                  <Card className="border-dashed">
                    <CardContent className="py-12 text-center">
                      <Upload className="size-8 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">
                        {strings.vault.folderEmpty}
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
                  {strings.vault.grantedPermissions}
                </CardTitle>
                <CardDescription>
                  {strings.vault.grantedPermissionsDesc}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {vault.displayGrants.map((grant) => (
                  <PermissionGrantCard
                    key={grant.id}
                    grant={grant}
                    onRevoke={
                      grant.status === 'active'
                        ? () => toast({ title: `${strings.vault.revokedFor} "${grant.grantedName}" ${strings.vault.revoked}` })
                        : undefined
                    }
                  />
                ))}
              </CardContent>
            </Card>

            <Card className="border-border bg-secondary/20">
              <CardContent className="p-6">
                <h3 className="font-sans font-medium text-sm text-foreground mb-3">{strings.vault.permissionLevels}</h3>
                <div className="grid sm:grid-cols-2 gap-3 text-xs text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <Badge variant="outline" className="text-[10px] shrink-0">{strings.vault.permView}</Badge>
                    <span>{strings.vault.permViewDesc}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge variant="outline" className="text-[10px] shrink-0">{strings.vault.permDownload}</Badge>
                    <span>{strings.vault.permDownloadDesc}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge variant="outline" className="text-[10px] shrink-0">{strings.vault.permForward}</Badge>
                    <span>{strings.vault.permForwardDesc}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge variant="outline" className="text-[10px] shrink-0">{strings.vault.permDelegate}</Badge>
                    <span>{strings.vault.permDelegateDesc}</span>
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
            <DialogTitle>{strings.vault.newVaultFolder}</DialogTitle>
            <DialogDescription>{strings.vault.allEncrypted}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{strings.vault.folderName}</label>
              <Input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder={strings.vault.folderNamePlaceholder}
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{strings.vault.folderDescription}</label>
              <Input
                value={newFolderDesc}
                onChange={(e) => setNewFolderDesc(e.target.value)}
                placeholder={strings.vault.folderDescPlaceholder}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateFolderOpen(false)}>
              {strings.common.cancel}
            </Button>
            <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
              <FolderPlus className="size-4 mr-1" />
              {strings.vault.createFolder}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={(open) => {
        if (!open && (uploadStatus === 'idle' || uploadStatus === 'complete')) {
          setUploadDialogOpen(false);
          setSelectedFiles([]);
          setUploadProgress(null);
          setUploadStatus('idle');
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{strings.vault.uploadTitle}</DialogTitle>
            <DialogDescription>{strings.vault.allEncrypted}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Drop zone */}
            {selectedFiles.length === 0 && uploadStatus === 'idle' && (
              <div
                className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/40 transition-colors"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="size-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">{strings.vault.uploadDragDrop}</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                  {strings.vault.uploadSelectFiles}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>
            )}

            {/* Selected files */}
            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                {selectedFiles.map((file, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
                    <FileText className="size-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{formatSize(file.size)}</p>
                    </div>
                    {uploadStatus === 'idle' && (
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => setSelectedFiles((prev) => prev.filter((_, idx) => idx !== i))}
                      >
                        ×
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Retention policy */}
            {uploadStatus === 'idle' && selectedFiles.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  {strings.vault.retentionPolicy}
                </label>
                <Select value={uploadRetention} onValueChange={(v) => setUploadRetention(v as VaultRetention)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {retentionOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Progress */}
            {uploadProgress !== null && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {uploadStatus === 'encrypting' && strings.vault.uploadEncrypting}
                    {uploadStatus === 'storing' && strings.vault.uploadStoring}
                    {uploadStatus === 'complete' && strings.vault.uploadComplete}
                  </span>
                  <span className="font-medium text-foreground">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}
          </div>

          <DialogFooter>
            {uploadStatus === 'idle' && (
              <>
                <Button variant="outline" onClick={() => { setUploadDialogOpen(false); setSelectedFiles([]); }}>
                  {strings.common.cancel}
                </Button>
                <Button onClick={handleStartUpload} disabled={selectedFiles.length === 0}>
                  <Lock className="size-4 mr-1" />
                  {strings.vault.uploadTitle}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Folder picker for uploads when not inside a folder */}
      <FolderPickerDialog
        open={folderPickerOpen}
        onOpenChange={setFolderPickerOpen}
        folders={vault.displayFolders}
        onSelect={performUpload}
        onCreateFolder={(name, desc) => {
          const f = vault.createFolder(name, desc);
          return f.id;
        }}
        title={strings.vault.uploadTitle}
        description={strings.vault.allEncrypted}
      />
    </div>
  );
};

export default Vault;

/**
 * FolderPickerDialog — Select or create a vault folder.
 * Used by the upload flow and the "Move to Vault" inbox action.
 */

import { useState } from 'react';
import { FolderOpen, FolderPlus, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLocale } from '@/hooks/useLocale';
import type { DisplayFolder } from '@/hooks/useVault';
import { cn } from '@/lib/utils';

interface FolderPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folders: DisplayFolder[];
  onSelect: (folderId: string) => void;
  onCreateFolder: (name: string, description?: string) => string;
  title?: string;
  description?: string;
}

export function FolderPickerDialog({
  open,
  onOpenChange,
  folders,
  onSelect,
  onCreateFolder,
  title,
  description,
}: FolderPickerDialogProps) {
  const { strings } = useLocale();
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const handleConfirm = () => {
    if (selectedFolderId) {
      onSelect(selectedFolderId);
      onOpenChange(false);
      setSelectedFolderId(null);
    }
  };

  const handleCreate = () => {
    if (!newName.trim()) return;
    const folderId = onCreateFolder(newName.trim(), newDesc.trim() || undefined);
    setSelectedFolderId(folderId);
    setShowCreate(false);
    setNewName('');
    setNewDesc('');
  };

  return (
    <Dialog open={open} onOpenChange={(v) => {
      if (!v) {
        setSelectedFolderId(null);
        setShowCreate(false);
        setNewName('');
        setNewDesc('');
      }
      onOpenChange(v);
    }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title || strings.vault.title}</DialogTitle>
          <DialogDescription>
            {description || strings.vault.allEncrypted}
          </DialogDescription>
        </DialogHeader>

        {!showCreate ? (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {folders.map((folder) => (
              <button
                key={folder.id}
                onClick={() => setSelectedFolderId(folder.id)}
                className={cn(
                  'w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors border',
                  selectedFolderId === folder.id
                    ? 'border-primary bg-primary/5'
                    : 'border-transparent hover:bg-secondary/50'
                )}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${folder.color}15` }}
                >
                  <FolderOpen className="size-4" style={{ color: folder.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{folder.name}</p>
                  {folder.description && (
                    <p className="text-xs text-muted-foreground truncate">{folder.description}</p>
                  )}
                </div>
                {selectedFolderId === folder.id && (
                  <Check className="size-4 text-primary shrink-0" />
                )}
              </button>
            ))}

            {folders.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">
                {strings.vault.noDocuments}
              </p>
            )}

            <button
              onClick={() => setShowCreate(true)}
              className="w-full flex items-center gap-3 p-3 rounded-lg text-left border border-dashed border-border hover:border-primary/40 transition-colors"
            >
              <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                <FolderPlus className="size-4 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">{strings.vault.newFolder} …</p>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{strings.vault.folderName}</label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={strings.vault.folderNamePlaceholder}
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{strings.vault.folderDescription}</label>
              <Input
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder={strings.vault.folderDescPlaceholder}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          {!showCreate ? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                {strings.common.cancel}
              </Button>
              <Button onClick={handleConfirm} disabled={!selectedFolderId}>
                {strings.common.next}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setShowCreate(false)}>
                {strings.common.back}
              </Button>
              <Button onClick={handleCreate} disabled={!newName.trim()}>
                <FolderPlus className="size-4 mr-1" />
                {strings.vault.createFolder}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { FolderOpen, FileText, Clock, MoreVertical, Pencil, Trash2, Share2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useLocale } from '@/hooks/useLocale';
import type { DemoVaultFolder } from '@/lib/demoData';

interface VaultFolderCardProps {
  folder: DemoVaultFolder;
  onClick: () => void;
  onRename?: () => void;
  onDelete?: () => void;
  onShare?: () => void;
}

export function VaultFolderCard({ folder, onClick, onRename, onDelete, onShare }: VaultFolderCardProps) {
  const { strings } = useLocale();

  const formatSize = (bytes: number) => {
    if (bytes >= 1000000000) return `${(bytes / 1000000000).toFixed(1)} GB`;
    if (bytes >= 1000000) return `${(bytes / 1000000).toFixed(1)} MB`;
    return `${(bytes / 1000).toFixed(0)} KB`;
  };

  return (
    <Card
      className="border-border hover:border-primary/20 hover:shadow-sm transition-all duration-200 cursor-pointer group"
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div
            className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${folder.color}15` }}
          >
            <FolderOpen className="size-5" style={{ color: folder.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-foreground truncate">{folder.name}</h3>
              <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-xs" className="text-muted-foreground">
                      <MoreVertical className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onShare && (
                      <DropdownMenuItem onSelect={onShare}>
                        <Share2 className="size-4" />
                        {strings.vault.shareAccess}
                      </DropdownMenuItem>
                    )}
                    {onRename && (
                      <DropdownMenuItem onSelect={onRename}>
                        <Pencil className="size-4" />
                        {strings.vault.rename}
                      </DropdownMenuItem>
                    )}
                    {onDelete && (
                      <DropdownMenuItem onSelect={onDelete} variant="destructive">
                        <Trash2 className="size-4" />
                        {strings.common.delete}
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            {folder.description && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{folder.description}</p>
            )}
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <FileText className="size-3" />
                {folder.documentCount}
              </span>
              <span>{formatSize(folder.totalSize)}</span>
              <span className="flex items-center gap-1">
                <Clock className="size-3" />
                {folder.lastActivity}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

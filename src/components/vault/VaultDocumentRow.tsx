import {
  FileText, Download, Eye, Trash2, Share2, MoreVertical,
  Clock, Lock, Inbox, Upload, LinkIcon
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLocale } from '@/hooks/useLocale';
import type { DemoVaultDocument } from '@/lib/demoData';
import { cn } from '@/lib/utils';

interface VaultDocumentRowProps {
  document: DemoVaultDocument;
  onView?: () => void;
  onDownload?: () => void;
  onShare?: () => void;
  onDelete?: () => void;
}

export function VaultDocumentRow({ document, onView, onDownload, onShare, onDelete }: VaultDocumentRowProps) {
  const { strings } = useLocale();

  const formatSize = (bytes: number) => {
    if (bytes >= 1000000) return `${(bytes / 1000000).toFixed(1)} MB`;
    return `${(bytes / 1000).toFixed(0)} KB`;
  };

  const sourceIcon = () => {
    switch (document.source) {
      case 'inbox': return <Inbox className="size-3" />;
      case 'upload': return <Upload className="size-3" />;
      case 'secure-link': return <LinkIcon className="size-3" />;
    }
  };

  const sourceLabel = () => {
    switch (document.source) {
      case 'inbox': return document.senderName || strings.vault.inbox;
      case 'upload': return strings.vault.manualUpload;
      case 'secure-link': return document.senderName || strings.vault.secureLink;
    }
  };

  return (
    <div className={cn(
      'flex items-center gap-4 p-3 rounded-lg hover:bg-secondary/30 transition-colors group',
      document.status === 'pending-deletion' && 'opacity-60'
    )}>
      {/* File icon */}
      <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
        <FileText className="size-4 text-muted-foreground" />
      </div>

      {/* File info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground truncate">{document.filename}</span>
          {document.status === 'pending-deletion' && (
            <Badge variant="outline" className="text-[10px] shrink-0">
              <Clock className="size-2.5 mr-0.5" />
              {strings.vault.pendingDeletion}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            {sourceIcon()}
            {sourceLabel()}
          </span>
          <span>·</span>
          <span>{formatSize(document.size)}</span>
          <span>·</span>
          <span>{document.createdAt}</span>
          {document.deleteAt && (
            <>
              <span>·</span>
              <span className="flex items-center gap-0.5 text-destructive/60">
                <Trash2 className="size-2.5" />
                {document.deleteAt}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Encrypted indicator */}
      <Lock className="size-3.5 text-primary/40 shrink-0" />

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        {onView && (
          <Button variant="ghost" size="icon-xs" onClick={onView} title={strings.vault.permView}>
            <Eye className="size-3.5" />
          </Button>
        )}
        {onDownload && (
          <Button variant="ghost" size="icon-xs" onClick={onDownload} title={strings.common.download}>
            <Download className="size-3.5" />
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-xs">
              <MoreVertical className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onView && (
              <DropdownMenuItem onSelect={onView}>
                <Eye className="size-4" />
                {strings.vault.permView}
              </DropdownMenuItem>
            )}
            {onDownload && (
              <DropdownMenuItem onSelect={onDownload}>
                <Download className="size-4" />
                {strings.common.download}
              </DropdownMenuItem>
            )}
            {onShare && (
              <DropdownMenuItem onSelect={onShare}>
                <Share2 className="size-4" />
                {strings.vault.shareAccess}
              </DropdownMenuItem>
            )}
            {onDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={onDelete} variant="destructive">
                  <Trash2 className="size-4" />
                  {strings.vault.secureDelete}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

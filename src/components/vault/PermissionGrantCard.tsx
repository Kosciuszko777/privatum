import { Shield, Clock, XCircle, Eye, Download, Forward, UserCog } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { DemoAccessGrant } from '@/lib/demoData';
import { cn } from '@/lib/utils';

interface PermissionGrantCardProps {
  grant: DemoAccessGrant;
  onRevoke?: () => void;
}

const verbIcons: Record<string, typeof Eye> = {
  view: Eye,
  download: Download,
  forward: Forward,
  delegate: UserCog,
};

const verbLabels: Record<string, string> = {
  view: 'Ansehen',
  download: 'Herunterladen',
  forward: 'Weiterleiten',
  delegate: 'Delegieren',
  revoke: 'Widerrufen',
};

export function PermissionGrantCard({ grant, onRevoke }: PermissionGrantCardProps) {
  return (
    <div className={cn(
      'flex items-start gap-4 p-4 rounded-lg border border-border',
      grant.status === 'revoked' && 'opacity-50',
      grant.status === 'expired' && 'opacity-50'
    )}>
      <div className={cn(
        'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
        grant.status === 'active' ? 'bg-primary/10' : 'bg-secondary'
      )}>
        <Shield className={cn(
          'size-4',
          grant.status === 'active' ? 'text-primary' : 'text-muted-foreground'
        )} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-foreground">{grant.grantedName}</span>
          {grant.status === 'active' && (
            <Badge variant="outline" className="text-[10px] text-green-700 border-green-300">Aktiv</Badge>
          )}
          {grant.status === 'expired' && (
            <Badge variant="secondary" className="text-[10px]">Abgelaufen</Badge>
          )}
          {grant.status === 'revoked' && (
            <Badge variant="secondary" className="text-[10px] text-destructive">Widerrufen</Badge>
          )}
        </div>

        <p className="text-xs text-muted-foreground mb-2">
          Zugriff auf: {grant.targetName}
        </p>

        <div className="flex flex-wrap items-center gap-1.5">
          {grant.permissions.map((perm) => {
            const Icon = verbIcons[perm] || Shield;
            return (
              <span key={perm} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-secondary text-[10px] text-foreground">
                <Icon className="size-2.5" />
                {verbLabels[perm] || perm}
              </span>
            );
          })}
        </div>

        <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
          <span>Erteilt: {grant.createdAt}</span>
          {grant.expiresAt && (
            <span className="flex items-center gap-0.5">
              <Clock className="size-2.5" />
              Ablauf: {grant.expiresAt}
            </span>
          )}
        </div>
      </div>

      {grant.status === 'active' && onRevoke && (
        <Button
          variant="ghost"
          size="icon-xs"
          className="text-destructive/60 hover:text-destructive shrink-0"
          onClick={onRevoke}
          title="Zugriff widerrufen"
        >
          <XCircle className="size-4" />
        </Button>
      )}
    </div>
  );
}

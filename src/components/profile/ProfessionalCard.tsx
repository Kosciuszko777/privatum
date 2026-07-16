/**
 * Professional identity card — used in the dashboard header,
 * the upload page, and the public profile.
 */

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { VerificationBadge } from './VerificationBadge';
import type { VerificationTier } from '@/lib/signer';
import { cn } from '@/lib/utils';

interface ProfessionalCardProps {
  name: string;
  title?: string;
  jurisdiction?: string;
  picture?: string;
  handle?: string;
  verificationTier?: VerificationTier;
  verificationDomain?: string;
  verificationSource?: string;
  verificationDate?: string;
  /** Compact mode for sidebar/small spaces */
  compact?: boolean;
  className?: string;
}

export function ProfessionalCard({
  name,
  title,
  jurisdiction,
  picture,
  handle,
  verificationTier = 'self-declared',
  verificationDomain,
  verificationSource,
  verificationDate,
  compact = false,
  className,
}: ProfessionalCardProps) {
  const initials = name
    .split(' ')
    .map((n) => n.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();

  if (compact) {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        <Avatar className="w-10 h-10">
          <AvatarImage src={picture} alt={name} />
          <AvatarFallback className="bg-primary/10 text-primary font-serif font-bold text-sm">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="font-medium text-sm text-foreground truncate">{name}</p>
          {title && (
            <p className="text-xs text-muted-foreground truncate">{title}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('text-center', className)}>
      <Avatar className="w-16 h-16 mx-auto mb-3">
        <AvatarImage src={picture} alt={name} />
        <AvatarFallback className="bg-primary/10 text-primary font-serif font-bold text-xl">
          {initials}
        </AvatarFallback>
      </Avatar>
      <h2 className="text-xl font-serif font-semibold text-foreground">{name}</h2>
      {title && (
        <p className="text-sm text-muted-foreground mt-0.5">{title}</p>
      )}
      {jurisdiction && (
        <p className="text-sm text-muted-foreground">{jurisdiction}</p>
      )}
      {handle && (
        <p className="text-xs text-muted-foreground mt-1 font-mono">
          privatum.ch/{handle}
        </p>
      )}
      <div className="mt-3 flex justify-center">
        <VerificationBadge
          tier={verificationTier}
          domain={verificationDomain}
          source={verificationSource}
          date={verificationDate}
        />
      </div>
    </div>
  );
}

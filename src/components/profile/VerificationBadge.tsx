/**
 * Verification Badge — §4 honest verification tiers.
 *
 * Three visually distinct tiers:
 * - Self-declared (default): "Details provided by this professional."
 * - Domain-verified: control of the firm domain proven.
 * - Register-verified: checked against an attorney/medical/notarial register.
 *   Only register-verified may use the brass seal.
 */

import { Check, Globe, Award } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { VerificationTier } from '@/lib/signer';
import { cn } from '@/lib/utils';

interface VerificationBadgeProps {
  tier: VerificationTier;
  /** Domain for domain-verified tier */
  domain?: string;
  /** Source for register-verified tier (e.g., "Zürcher Anwaltsverband") */
  source?: string;
  /** Date of verification (ISO string) */
  date?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function VerificationBadge({
  tier,
  domain,
  source,
  date,
  size = 'md',
  className,
}: VerificationBadgeProps) {
  const config = getBadgeConfig(tier);
  const formattedDate = date ? new Date(date).toLocaleDateString('de-CH') : undefined;

  const tooltipContent = (() => {
    switch (tier) {
      case 'self-declared':
        return 'Angaben von dieser Fachperson bereitgestellt.';
      case 'domain-verified':
        return domain
          ? `Domain verifiziert: ${domain}`
          : 'Kontrolle über die Firmen-Domain bestätigt.';
      case 'register-verified':
        return source
          ? `Registerverifiziert: ${source}${formattedDate ? ` (${formattedDate})` : ''}`
          : 'Im Berufsregister verifiziert.';
    }
  })();

  const iconSize = size === 'sm' ? 'size-2.5' : size === 'lg' ? 'size-4' : 'size-3';
  const textSize = size === 'sm' ? 'text-[10px]' : size === 'lg' ? 'text-sm' : 'text-xs';
  const padding = size === 'sm' ? 'px-1.5 py-0.5' : size === 'lg' ? 'px-3 py-1.5' : 'px-2.5 py-1';
  const dotSize = size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full border cursor-default',
            padding,
            config.containerClass,
            className
          )}
        >
          {tier === 'register-verified' ? (
            <div className={cn(dotSize, 'rounded-full bg-brass flex items-center justify-center')}>
              <Award className={cn(iconSize, 'text-brass-foreground')} />
            </div>
          ) : tier === 'domain-verified' ? (
            <Globe className={cn(iconSize, config.iconClass)} />
          ) : (
            <Check className={cn(iconSize, config.iconClass)} />
          )}
          <span className={cn('font-medium', textSize, config.textClass)}>
            {config.label}
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-xs">
        <p className="text-xs">{tooltipContent}</p>
      </TooltipContent>
    </Tooltip>
  );
}

function getBadgeConfig(tier: VerificationTier) {
  switch (tier) {
    case 'register-verified':
      return {
        label: 'Verifiziert',
        containerClass: 'bg-brass/10 border-brass/20',
        iconClass: 'text-brass',
        textClass: 'text-brass',
      };
    case 'domain-verified':
      return {
        label: 'Domain verifiziert',
        containerClass: 'bg-primary/5 border-primary/15',
        iconClass: 'text-primary',
        textClass: 'text-primary',
      };
    case 'self-declared':
    default:
      return {
        label: 'Selbstangaben',
        containerClass: 'bg-secondary border-border',
        iconClass: 'text-muted-foreground',
        textClass: 'text-muted-foreground',
      };
  }
}

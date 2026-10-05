import { useSeoMeta } from '@unhead/react';
import { Link } from 'react-router-dom';
import {
  Shield, ShieldCheck, Key, Smartphone, Clock, UserCheck,
  ChevronRight, ArrowLeft, Check, AlertCircle, Radio
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useLocale } from '@/hooks/useLocale';
import { cn } from '@/lib/utils';

const SecurityCenter = () => {
  const { strings } = useLocale();

  useSeoMeta({
    title: `PRIVATUM — ${strings.security.title}`,
  });

  const checklist = [
    {
      id: 'auth',
      label: strings.security.authEnabled,
      icon: ShieldCheck,
      configured: true,
      description: 'Schlüsselbasierte Authentifizierung aktiv.',
    },
    {
      id: 'recovery',
      label: strings.security.recoveryConfigured,
      icon: Key,
      configured: false,
      description: 'Verschlüsseltes Wiederherstellungspaket einrichten.',
    },
    {
      id: 'devices',
      label: strings.security.trustedDevices,
      icon: Smartphone,
      configured: true,
      description: '1 vertrauenswürdiges Gerät registriert.',
    },
    {
      id: 'retention',
      label: strings.security.retentionSet,
      icon: Clock,
      configured: true,
      description: 'Standard: Nach 30 Tagen löschen.',
    },
    {
      id: 'identity',
      label: strings.security.identityVerified,
      icon: UserCheck,
      configured: false,
      description: 'Berufliche Identität beim Anwaltsverband verifizieren.',
    },
  ];

  const configuredCount = checklist.filter((c) => c.configured).length;

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
            <Shield className="size-5 text-primary" />
            <h1 className="font-sans font-semibold text-foreground">
              {strings.security.title}
            </h1>
          </div>
        </div>
      </header>

      <main className="container max-w-3xl py-8 space-y-8">
        {/* Score */}
        <Card className="border-border">
          <CardContent className="py-8 text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <span className="text-3xl font-serif font-bold text-primary">{configuredCount}/{checklist.length}</span>
            </div>
            <p className="text-muted-foreground text-sm">
              {configuredCount === checklist.length
                ? 'Alle Sicherheitsmassnahmen sind konfiguriert.'
                : `${checklist.length - configuredCount} ${checklist.length - configuredCount === 1 ? 'Massnahme' : 'Massnahmen'} noch offen.`}
            </p>
          </CardContent>
        </Card>

        {/* Checklist */}
        <div className="space-y-3">
          {checklist.map((item) => (
            <Card key={item.id} className={cn(
              'border-border',
              !item.configured && 'border-primary/20'
            )}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
                    item.configured ? 'bg-primary/10' : 'bg-secondary'
                  )}>
                    {item.configured
                      ? <Check className="size-5 text-primary" />
                      : <item.icon className="size-5 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      'font-medium text-sm',
                      item.configured ? 'text-foreground' : 'text-foreground'
                    )}>
                      {item.label}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.description}
                    </p>
                  </div>
                  {item.configured ? (
                    <span className="text-xs font-medium text-primary">
                      {strings.security.configured}
                    </span>
                  ) : (
                    <Button size="sm" variant="outline">
                      {strings.security.configure}
                      <ChevronRight className="size-3 ml-1" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Relays & delivery */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="font-sans text-base flex items-center gap-2">
              <Radio className="size-4" />
              {strings.relays.title}
            </CardTitle>
            <CardDescription>{strings.relays.subtitle}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild>
              <Link to="/relays">
                <Radio className="size-4 mr-1" />
                {strings.relays.title}
                <ChevronRight className="size-3 ml-1" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Recovery section */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="font-sans text-base flex items-center gap-2">
              <Key className="size-4" />
              {strings.recovery.title}
            </CardTitle>
            <CardDescription>{strings.recovery.subtitle}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-2 p-3 rounded-lg bg-secondary/50">
              <AlertCircle className="size-4 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                {strings.recovery.disclaimer}
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              {[
                strings.recovery.encryptedPackage,
                strings.recovery.trustedDevice,
                strings.recovery.organizational,
                strings.recovery.shamir,
                strings.recovery.trustedContacts,
              ].map((method) => (
                <div
                  key={method}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/20 transition-colors cursor-pointer"
                >
                  <div className="w-8 h-8 rounded bg-secondary flex items-center justify-center shrink-0">
                    <Key className="size-4 text-muted-foreground" />
                  </div>
                  <span className="text-sm text-foreground">{method}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default SecurityCenter;

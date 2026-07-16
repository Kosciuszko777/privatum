/**
 * Privacy Dashboard — §3.7
 *
 * Shows encrypted documents, scheduled deletions, expired links,
 * metadata retained, security events. Plus a global Panic Delete.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSeoMeta } from '@unhead/react';
import {
  ArrowLeft, Shield, Trash2, Clock, FileText, LinkIcon,
  AlertTriangle, Database, Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useLocale } from '@/hooks/useLocale';
import { dashboardStats } from '@/lib/demoData';

const PrivacyDashboard = () => {
  const { strings } = useLocale();
  const [panicDialogOpen, setPanicDialogOpen] = useState(false);
  const [panicConfirm, setPanicConfirm] = useState('');

  useSeoMeta({
    title: `PRIVATUM — ${strings.dashboard.privacyDashboard}`,
  });

  const scheduledDeletions = [
    { name: 'Passport_Mueller.pdf', deleteAt: '22. Juli 2026', channel: 'Nachlasssache Müller' },
    { name: 'Bankauszüge_Q1-Q4.zip', deleteAt: '22. Juli 2026', channel: 'Nachlasssache Müller' },
    { name: 'Steuerdokumente_2025.zip', deleteAt: '12. August 2026', channel: 'Private Client 2026' },
  ];

  const expiredLinks = [
    { purpose: 'Private Client 2026 — Erstberatung', expiredAt: '15. Juli 2026', uploads: 5 },
  ];

  const metadataRetained = [
    { type: 'Kanäle', count: 3, description: 'Kanal-ID, Erstelldatum, Aufbewahrungsrichtlinie' },
    { type: 'Sichere Links', count: 5, description: 'Token, Ablaufdatum, Nutzungsstatistik' },
    { type: 'Aktivitätsprotokoll', count: 12, description: 'Zeitstempel, Aktionstyp (kein Inhalt)' },
    { type: 'Integritätskette', count: 8, description: 'SHA-256 Hashes, Zeitstempel, Richtung' },
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
            <Eye className="size-5 text-primary" />
            <h1 className="font-sans font-semibold text-foreground">
              {strings.dashboard.privacyDashboard}
            </h1>
          </div>
        </div>
      </header>

      <main className="container max-w-3xl py-8 space-y-8">
        {/* Storage overview */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="font-sans text-base flex items-center gap-2">
              <Database className="size-4" />
              Verschlüsselter Speicher
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Belegt</span>
                <span className="font-medium text-foreground">
                  {dashboardStats.storageUsed} / {dashboardStats.storageTotal}
                </span>
              </div>
              <Progress value={dashboardStats.storagePercent} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Alle gespeicherten Dokumente sind clientseitig verschlüsselt. Privatum kann den Inhalt nicht lesen.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Scheduled deletions */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="font-sans text-base flex items-center gap-2">
              <Clock className="size-4" />
              Geplante Löschungen
            </CardTitle>
            <CardDescription>
              Dokumente, die automatisch gelöscht werden.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {scheduledDeletions.map((item) => (
              <div key={item.name} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30">
                <FileText className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.channel}</p>
                </div>
                <div className="text-right shrink-0">
                  <Badge variant="outline" className="text-xs">
                    <Clock className="size-3 mr-1" />
                    {item.deleteAt}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Expired links */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="font-sans text-base flex items-center gap-2">
              <LinkIcon className="size-4" />
              Abgelaufene Links
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {expiredLinks.map((link) => (
              <div key={link.purpose} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30">
                <LinkIcon className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{link.purpose}</p>
                  <p className="text-xs text-muted-foreground">
                    Abgelaufen: {link.expiredAt} · {link.uploads} Uploads empfangen
                  </p>
                </div>
                <Badge variant="secondary" className="text-xs shrink-0">Abgelaufen</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Metadata retained */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="font-sans text-base flex items-center gap-2">
              <Shield className="size-4" />
              Aufbewahrte Metadaten
            </CardTitle>
            <CardDescription>
              Privatum speichert nur minimale Metadaten. Dokumenteninhalte sind nie Teil davon.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {metadataRetained.map((item) => (
              <div key={item.type} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{item.type}</p>
                    <Badge variant="outline" className="text-xs">{item.count}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Data minimization statement */}
        <div className="bg-primary/5 border border-primary/10 rounded-xl p-6 text-center">
          <Shield className="size-8 text-primary mx-auto mb-3" />
          <p className="text-sm text-foreground font-medium mb-1">
            Privatum ist darauf ausgelegt, so wenig Informationen wie nötig zu speichern, so kurz wie nötig.
          </p>
          <p className="text-xs text-muted-foreground">
            Dokumenteninhalte werden verschlüsselt, bevor sie unsere Infrastruktur erreichen. Wir können sie nicht lesen.
          </p>
        </div>

        {/* Panic Delete */}
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="font-sans text-base flex items-center gap-2 text-destructive">
              <Trash2 className="size-4" />
              Notfall-Löschung
            </CardTitle>
            <CardDescription>
              Löscht alle verschlüsselten Dokumente und Metadaten unwiderruflich.
              Diese Aktion kann nicht rückgängig gemacht werden.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={() => setPanicDialogOpen(true)}
              className="w-full"
            >
              <Trash2 className="size-4 mr-2" />
              Alle Daten unwiderruflich löschen
            </Button>
          </CardContent>
        </Card>
      </main>

      {/* Panic Delete confirmation */}
      <Dialog open={panicDialogOpen} onOpenChange={setPanicDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="size-5" />
              Notfall-Löschung bestätigen
            </DialogTitle>
            <DialogDescription>
              Diese Aktion löscht unwiderruflich alle verschlüsselten Dokumente, Metadaten,
              Sichere Links und Aktivitätsprotokolle. Sie kann nicht rückgängig gemacht werden.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-foreground">
              Geben Sie <span className="font-mono font-bold">LÖSCHEN</span> ein, um zu bestätigen:
            </p>
            <input
              type="text"
              value={panicConfirm}
              onChange={(e) => setPanicConfirm(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-input bg-transparent text-sm font-mono"
              placeholder="LÖSCHEN"
              autoComplete="off"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setPanicDialogOpen(false); setPanicConfirm(''); }}>
              {strings.common.cancel}
            </Button>
            <Button
              variant="destructive"
              disabled={panicConfirm !== 'LÖSCHEN'}
              onClick={() => {
                // In production: clear all localStorage, clear IndexedDB, revoke all sessions
                localStorage.clear();
                setPanicDialogOpen(false);
                setPanicConfirm('');
                window.location.href = '/';
              }}
            >
              <Trash2 className="size-4 mr-2" />
              Unwiderruflich löschen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PrivacyDashboard;

import { useState } from 'react';
import { useSeoMeta } from '@unhead/react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, LinkIcon, Lock, Copy, QrCode, Mail, Code,
  Check, AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLocale } from '@/hooks/useLocale';

type Step = 'configure' | 'created';

const CreateSecureLink = () => {
  const { strings } = useLocale();
  const [step, setStep] = useState<Step>('configure');
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [purpose, setPurpose] = useState('');
  const [expiration, setExpiration] = useState('30d');
  const [maxUploads, setMaxUploads] = useState('10');
  const [accessCodeEnabled, setAccessCodeEnabled] = useState(true);
  const [oneTimeUse, setOneTimeUse] = useState(false);
  const [deleteAfterDownload, setDeleteAfterDownload] = useState(false);
  const [requireId, setRequireId] = useState(false);
  const [allowReplies, setAllowReplies] = useState(true);
  const [copied, setCopied] = useState(false);

  const demoLink = 'https://privatum.ch/drop/xK9mP2vQ';
  const demoAccessCode = '847291';

  useSeoMeta({
    title: `PRIVATUM — ${strings.secureLink.title}`,
  });

  const handleCreate = () => {
    setStep('created');
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(demoLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
            <LinkIcon className="size-5 text-primary" />
            <h1 className="font-sans font-semibold text-foreground">
              {strings.secureLink.title}
            </h1>
          </div>
        </div>
      </header>

      <main className="container max-w-2xl py-8">
        {step === 'configure' && (
          <div className="space-y-6 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="font-sans text-base">Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    {strings.secureLink.recipientName}
                  </label>
                  <Input
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="Thomas Müller"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    {strings.secureLink.recipientEmail}
                  </label>
                  <Input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="t.mueller@example.ch"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    {strings.secureLink.purpose}
                  </label>
                  <Input
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder="Nachlasssache Müller — Dokumenteneingang"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <CardTitle className="font-sans text-base">Einschränkungen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      {strings.secureLink.expiration}
                    </label>
                    <Select value={expiration} onValueChange={setExpiration}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="24h">24 Stunden</SelectItem>
                        <SelectItem value="7d">7 Tage</SelectItem>
                        <SelectItem value="30d">30 Tage</SelectItem>
                        <SelectItem value="90d">90 Tage</SelectItem>
                        <SelectItem value="never">Kein Ablauf</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      {strings.secureLink.maxUploads}
                    </label>
                    <Input
                      type="number"
                      value={maxUploads}
                      onChange={(e) => setMaxUploads(e.target.value)}
                      min="1"
                      max="100"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <CardTitle className="font-sans text-base">Sicherheit</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Access code — §3.4: two-factor by default */}
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Lock className="size-4 text-primary" />
                      <label className="text-sm font-medium text-foreground">
                        {strings.secureLink.accessCode}
                      </label>
                    </div>
                    <Switch
                      checked={accessCodeEnabled}
                      onCheckedChange={setAccessCodeEnabled}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5 ml-6">
                    {strings.secureLink.accessCodeDefault}
                  </p>
                  {!accessCodeEnabled && (
                    <div className="flex items-start gap-2 mt-2 ml-6 p-2 rounded-md bg-destructive/5 border border-destructive/10">
                      <AlertTriangle className="size-3.5 text-destructive mt-0.5 shrink-0" />
                      <p className="text-xs text-destructive/80">
                        {strings.secureLink.accessCodeWarning}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm text-foreground">
                    {strings.secureLink.oneTimeUse}
                  </label>
                  <Switch checked={oneTimeUse} onCheckedChange={setOneTimeUse} />
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm text-foreground">
                    {strings.secureLink.requireIdentification}
                  </label>
                  <Switch checked={requireId} onCheckedChange={setRequireId} />
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm text-foreground">
                    {strings.secureLink.deleteAfterDownload}
                  </label>
                  <Switch checked={deleteAfterDownload} onCheckedChange={setDeleteAfterDownload} />
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm text-foreground">
                    {strings.secureLink.allowReplies}
                  </label>
                  <Switch checked={allowReplies} onCheckedChange={setAllowReplies} />
                </div>
              </CardContent>
            </Card>

            <Button onClick={handleCreate} className="w-full" size="lg">
              <LinkIcon className="size-4 mr-2" />
              {strings.secureLink.create}
            </Button>
          </div>
        )}

        {step === 'created' && (
          <div className="space-y-6 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500">
            <div className="text-center">
              <div className="w-14 h-14 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Check className="size-7 text-primary" />
              </div>
              <h2 className="text-2xl font-serif font-semibold text-foreground mb-2">
                Sicherer Link erstellt
              </h2>
              {purpose && (
                <p className="text-sm text-muted-foreground">{purpose}</p>
              )}
            </div>

            <Card className="border-border">
              <CardContent className="p-6 space-y-4">
                {/* Link */}
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Link</label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-2 text-sm bg-secondary rounded-md text-foreground font-mono break-all">
                      {demoLink}
                    </code>
                    <Button size="sm" variant="outline" onClick={handleCopy}>
                      {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                    </Button>
                  </div>
                </div>

                {/* Access code */}
                {accessCodeEnabled && (
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                      {strings.secureLink.accessCode}
                    </label>
                    <div className="flex items-center gap-2">
                      <code className="px-3 py-2 text-lg bg-secondary rounded-md text-foreground font-mono tracking-widest">
                        {demoAccessCode}
                      </code>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5">
                      Teilen Sie diesen Code über einen separaten Kanal (Telefon, Brief, persönlich).
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="grid sm:grid-cols-2 gap-3">
              <Button variant="outline" onClick={handleCopy}>
                <Copy className="size-4 mr-2" />
                {strings.secureLink.copyLink}
              </Button>
              <Button variant="outline">
                <QrCode className="size-4 mr-2" />
                {strings.secureLink.showQR}
              </Button>
              <Button variant="outline">
                <Mail className="size-4 mr-2" />
                {strings.secureLink.sendEmail}
              </Button>
              <Button variant="outline">
                <Code className="size-4 mr-2" />
                {strings.secureLink.embedSnippet}
              </Button>
            </div>

            <div className="flex justify-center">
              <Button variant="ghost" asChild>
                <Link to="/dashboard">
                  <ArrowLeft className="size-4 mr-1" />
                  Zurück zum Dashboard
                </Link>
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default CreateSecureLink;

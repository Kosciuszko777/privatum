import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSeoMeta } from '@unhead/react';
import { ArrowRight, ArrowLeft, Shield, Check, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLocale } from '@/hooks/useLocale';
import { cn } from '@/lib/utils';

type Step = 'identity' | 'profile' | 'retention' | 'recovery' | 'complete';

const Onboarding = () => {
  const { strings } = useLocale();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('identity');
  const [handle, setHandle] = useState('');
  const [fullName, setFullName] = useState('');
  const [professionalTitle, setProfessionalTitle] = useState('');
  const [jurisdiction, setJurisdiction] = useState('');
  const [retention, setRetention] = useState('30d');
  const [isCreating, setIsCreating] = useState(false);

  useSeoMeta({
    title: 'PRIVATUM — ' + strings.onboarding.title,
    description: strings.hero.subtitle,
  });

  const steps: Step[] = ['identity', 'profile', 'retention', 'recovery', 'complete'];
  const currentIndex = steps.indexOf(step);

  const handleCreate = () => {
    setIsCreating(true);
    // Simulate keypair generation and channel creation
    setTimeout(() => {
      setIsCreating(false);
      setStep('complete');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-lg">
        <div className="container flex items-center h-16">
          <button onClick={() => navigate('/')} className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
              <span className="text-primary-foreground font-serif font-bold text-lg leading-none">P</span>
            </div>
            <span className="font-serif font-semibold text-xl tracking-tight text-foreground">
              PRIVATUM
            </span>
          </button>
        </div>
      </header>

      {/* Progress */}
      <div className="container max-w-2xl mx-auto pt-8">
        <div className="flex items-center gap-2 mb-8">
          {steps.slice(0, -1).map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors duration-300',
                i < currentIndex
                  ? 'bg-primary text-primary-foreground'
                  : i === currentIndex
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-muted-foreground'
              )}>
                {i < currentIndex ? <Check className="size-4" /> : i + 1}
              </div>
              {i < steps.length - 2 && (
                <div className={cn(
                  'flex-1 h-0.5 transition-colors duration-300',
                  i < currentIndex ? 'bg-primary' : 'bg-border'
                )} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 container max-w-2xl mx-auto py-8">
        {step === 'identity' && (
          <div className="space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                <Shield className="size-4" />
                {strings.onboarding.title}
              </div>
              <h1 className="text-3xl font-serif font-semibold text-foreground mb-2">
                {strings.onboarding.handle}
              </h1>
              <p className="text-muted-foreground">
                {strings.onboarding.handleHint}
              </p>
            </div>

            <div className="bg-card rounded-xl border border-border p-6 space-y-6">
              <div>
                <label htmlFor="handle" className="block text-sm font-medium text-foreground mb-2">
                  Handle
                </label>
                <div className="flex items-center gap-0">
                  <span className="px-3 py-2 bg-secondary rounded-l-md border border-r-0 border-input text-sm text-muted-foreground">
                    privatum.ch/
                  </span>
                  <Input
                    id="handle"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    className="rounded-l-none"
                    placeholder="anna-meier"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-foreground mb-2">
                  {strings.onboarding.name}
                </label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Dr. Anna Meier"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={() => setStep('profile')}
                disabled={!handle || !fullName}
              >
                {strings.common.next}
                <ArrowRight className="size-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {step === 'profile' && (
          <div className="space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300">
            <div>
              <h1 className="text-3xl font-serif font-semibold text-foreground mb-2">
                {strings.onboarding.professionalTitle}
              </h1>
            </div>

            <div className="bg-card rounded-xl border border-border p-6 space-y-6">
              {/* Photo upload */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {strings.onboarding.photo}
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-secondary flex items-center justify-center border border-border">
                    <Camera className="size-6 text-muted-foreground" />
                  </div>
                  <Button variant="outline" size="sm">
                    {strings.upload.chooseFiles}
                  </Button>
                </div>
              </div>

              <div>
                <label htmlFor="title" className="block text-sm font-medium text-foreground mb-2">
                  {strings.onboarding.professionalTitle}
                </label>
                <Input
                  id="title"
                  value={professionalTitle}
                  onChange={(e) => setProfessionalTitle(e.target.value)}
                  placeholder="Rechtsanwältin / Attorney at Law"
                />
              </div>

              <div>
                <label htmlFor="jurisdiction" className="block text-sm font-medium text-foreground mb-2">
                  {strings.onboarding.jurisdiction}
                </label>
                <Input
                  id="jurisdiction"
                  value={jurisdiction}
                  onChange={(e) => setJurisdiction(e.target.value)}
                  placeholder="Zürich, Schweiz"
                />
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep('identity')}>
                <ArrowLeft className="size-4 mr-1" />
                {strings.common.back}
              </Button>
              <Button onClick={() => setStep('retention')}>
                {strings.common.next}
                <ArrowRight className="size-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {step === 'retention' && (
          <div className="space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300">
            <div>
              <h1 className="text-3xl font-serif font-semibold text-foreground mb-2">
                {strings.onboarding.retention}
              </h1>
              <p className="text-muted-foreground">
                Privatum ist darauf ausgelegt, so wenig Informationen wie nötig zu speichern, so kurz wie nötig.
              </p>
            </div>

            <div className="bg-card rounded-xl border border-border p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {strings.onboarding.retention}
                </label>
                <Select value={retention} onValueChange={setRetention}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="download">Nach erstem Download löschen</SelectItem>
                    <SelectItem value="24h">Nach 24 Stunden löschen</SelectItem>
                    <SelectItem value="7d">Nach 7 Tagen löschen</SelectItem>
                    <SelectItem value="30d">Nach 30 Tagen löschen</SelectItem>
                    <SelectItem value="vault">In verschlüsselten Vault verschieben</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep('profile')}>
                <ArrowLeft className="size-4 mr-1" />
                {strings.common.back}
              </Button>
              <Button onClick={() => setStep('recovery')}>
                {strings.common.next}
                <ArrowRight className="size-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {step === 'recovery' && (
          <div className="space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300">
            <div>
              <h1 className="text-3xl font-serif font-semibold text-foreground mb-2">
                {strings.onboarding.recoveryPrompt}
              </h1>
              <p className="text-muted-foreground">
                {strings.recovery.disclaimer}
              </p>
            </div>

            <div className="bg-card rounded-xl border border-border p-6 space-y-4">
              <p className="text-sm text-foreground leading-relaxed">
                Die Wiederherstellung schützt Sie davor, den Zugang zu Ihren verschlüsselten Daten zu verlieren.
                Sie können dies jetzt einrichten oder später in den Einstellungen nachholen.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row justify-between gap-3">
              <Button variant="ghost" onClick={() => setStep('retention')}>
                <ArrowLeft className="size-4 mr-1" />
                {strings.common.back}
              </Button>
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleCreate}>
                  {strings.onboarding.recoveryLater}
                </Button>
                <Button onClick={handleCreate} disabled={isCreating}>
                  {isCreating ? strings.onboarding.title : strings.onboarding.complete}
                  {!isCreating && <ArrowRight className="size-4 ml-1" />}
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === 'complete' && (
          <div className="text-center space-y-8 py-12 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500">
            <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
              <Check className="size-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-serif font-semibold text-foreground mb-4">
                Ihr sicherer Kanal ist bereit.
              </h1>
              <p className="text-lg text-muted-foreground max-w-md mx-auto">
                privatum.ch/<span className="font-medium text-foreground">{handle || 'anna-meier'}</span>
              </p>
            </div>
            <div className="flex justify-center gap-4">
              <Button size="lg" onClick={() => navigate('/dashboard')}>
                {strings.nav.dashboard}
                <ArrowRight className="size-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Onboarding;

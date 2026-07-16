import { useState, useCallback, useRef } from 'react';
import { useSeoMeta } from '@unhead/react';
import { useParams } from 'react-router-dom';
import {
  Upload, Shield, Lock, FileText, X, ArrowRight, Loader2
} from 'lucide-react';
import { VerificationBadge } from '@/components/profile/VerificationBadge';
import type { VerificationTier } from '@/lib/signer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useLocale } from '@/hooks/useLocale';
import { annaMeier } from '@/lib/demoData';
import { cn } from '@/lib/utils';

interface SelectedFile {
  file: File;
  id: string;
}

type UploadState = 'access-code' | 'ready' | 'encrypting' | 'uploading' | 'delivered';

const SecureUpload = () => {
  const { strings } = useLocale();
  const { handle } = useParams<{ handle: string }>();
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [message, setMessage] = useState('');
  const [uploadState, setUploadState] = useState<UploadState>('access-code');
  const [accessCode, setAccessCode] = useState('');
  const [progress, setProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use demo data for display
  const professional = handle === 'anna-meier' ? annaMeier : {
    name: handle ? handle.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ') : 'Professional',
    title: 'Professional',
    jurisdiction: 'Switzerland',
    verified: 'self-declared' as const,
  };

  useSeoMeta({
    title: `${strings.upload.title} — ${professional.name}`,
    description: strings.upload.encryption,
  });

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files).map((file) => ({
      file,
      id: `${file.name}-${file.size}-${Date.now()}`,
    }));
    setFiles((prev) => [...prev, ...droppedFiles]);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selected = Array.from(e.target.files).map((file) => ({
      file,
      id: `${file.name}-${file.size}-${Date.now()}`,
    }));
    setFiles((prev) => [...prev, ...selected]);
    e.target.value = '';
  }, []);

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const formatSize = (bytes: number) => {
    if (bytes >= 1000000) return `${(bytes / 1000000).toFixed(1)} MB`;
    return `${(bytes / 1000).toFixed(0)} KB`;
  };

  const handleAccessCodeSubmit = () => {
    if (accessCode.length >= 4) {
      setUploadState('ready');
    }
  };

  const handleSubmit = async () => {
    if (files.length === 0) return;

    // Simulate encryption
    setUploadState('encrypting');
    setProgress(0);
    for (let i = 0; i <= 100; i += 5) {
      await new Promise((r) => setTimeout(r, 50));
      setProgress(i);
    }

    // Simulate upload
    setUploadState('uploading');
    setProgress(0);
    for (let i = 0; i <= 100; i += 3) {
      await new Promise((r) => setTimeout(r, 40));
      setProgress(i);
    }

    setUploadState('delivered');
  };

  const verificationTier: VerificationTier = ('verified' in professional)
    ? professional.verified as VerificationTier
    : 'self-declared';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Minimal header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-lg">
        <div className="container flex items-center justify-center h-14">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
              <span className="text-primary-foreground font-serif font-bold text-sm leading-none">P</span>
            </div>
            <span className="font-serif font-semibold text-base tracking-tight text-foreground">
              PRIVATUM
            </span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center py-8 px-4">
        <div className="w-full max-w-xl">
          {/* Access code gate */}
          {uploadState === 'access-code' && (
            <div className="bg-card rounded-xl border border-border p-8 text-center space-y-6 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500">
              <div className="w-14 h-14 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                <Lock className="size-7 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-serif font-semibold text-foreground mb-2">
                  {strings.upload.accessCode}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {strings.upload.accessCodeHint}
                </p>
              </div>
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={accessCode}
                  onChange={setAccessCode}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <Button
                onClick={handleAccessCodeSubmit}
                disabled={accessCode.length < 4}
                className="w-full"
              >
                {strings.common.next}
                <ArrowRight className="size-4 ml-1" />
              </Button>
            </div>
          )}

          {/* Upload form */}
          {uploadState === 'ready' && (
            <div className="bg-card rounded-xl border border-border p-8 space-y-6 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500">
              {/* Title */}
              <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10">
                  <Shield className="size-4 text-primary" />
                  <span className="text-sm font-medium text-primary">{strings.upload.title}</span>
                </div>

                <p className="text-sm text-muted-foreground">{strings.upload.sendingTo}</p>

                <div>
                  <h2 className="text-xl font-serif font-semibold text-foreground">{professional.name}</h2>
                  {'title' in professional && (
                    <p className="text-sm text-muted-foreground">{professional.title}</p>
                  )}
                  {'jurisdiction' in professional && (
                    <p className="text-sm text-muted-foreground">{professional.jurisdiction}</p>
                  )}
                  <div className="mt-2 flex justify-center">
                    <VerificationBadge tier={verificationTier} />
                  </div>
                </div>
              </div>

              {/* Drop zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200',
                  isDragOver
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/40 hover:bg-secondary/30'
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Upload className={cn(
                  'size-8 mx-auto mb-3 transition-colors',
                  isDragOver ? 'text-primary' : 'text-muted-foreground'
                )} />
                <p className="text-sm font-medium text-foreground mb-1">
                  {strings.upload.dragDrop}
                </p>
                <p className="text-xs text-muted-foreground">
                  {strings.upload.chooseFiles}
                </p>
              </div>

              {/* File list */}
              {files.length > 0 && (
                <div className="space-y-2">
                  {files.map((f) => (
                    <div key={f.id} className="flex items-center gap-3 p-2 rounded-lg bg-secondary/50">
                      <FileText className="size-4 text-muted-foreground shrink-0" />
                      <span className="text-sm text-foreground truncate flex-1">{f.file.name}</span>
                      <span className="text-xs text-muted-foreground shrink-0">{formatSize(f.file.size)}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); removeFile(f.id); }}
                        className="p-1 hover:bg-secondary rounded"
                      >
                        <X className="size-3 text-muted-foreground" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Optional fields */}
              <div className="grid sm:grid-cols-2 gap-3">
                <Input
                  placeholder={strings.upload.yourName}
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                />
                <Input
                  placeholder={strings.upload.yourEmail}
                  type="email"
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                />
              </div>
              <Textarea
                placeholder={strings.upload.message}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-20"
              />

              {/* Encryption notice */}
              <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
                <Lock className="size-4 text-primary mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {strings.upload.encryption}
                </p>
              </div>

              {/* Submit */}
              <Button
                onClick={handleSubmit}
                disabled={files.length === 0}
                className="w-full h-11"
                size="lg"
              >
                <Shield className="size-4 mr-2" />
                {strings.upload.submit}
              </Button>
            </div>
          )}

          {/* Encrypting / Uploading */}
          {(uploadState === 'encrypting' || uploadState === 'uploading') && (
            <div className="bg-card rounded-xl border border-border p-8 text-center space-y-6 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300">
              <div className="w-14 h-14 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                <Loader2 className="size-7 text-primary animate-spin" />
              </div>
              <div>
                <h2 className="text-xl font-serif font-semibold text-foreground mb-2">
                  {uploadState === 'encrypting'
                    ? strings.upload.encrypting
                    : strings.upload.uploading}
                </h2>
              </div>
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-muted-foreground">{Math.round(progress)}%</p>
            </div>
          )}

          {/* Delivered */}
          {uploadState === 'delivered' && (
            <div className="bg-card rounded-xl border border-border p-8 text-center space-y-6 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500">
              <div className="w-14 h-14 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                <Check className="size-7 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-serif font-semibold text-foreground mb-2">
                  {strings.upload.delivered}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {files.length} {files.length === 1 ? 'Dokument' : 'Dokumente'} an {professional.name}
                </p>
              </div>

              {/* Receipt */}
              <div className="bg-secondary/50 rounded-lg p-4 text-left space-y-2">
                <p className="text-xs font-medium text-foreground">Zustellungsbeleg</p>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Transfer-ID: PRV-2026-07-15-001</p>
                  <p className="text-xs text-muted-foreground">Zeitstempel: {new Date().toISOString()}</p>
                  <p className="text-xs text-muted-foreground font-mono break-all">
                    Integritätshash: a3f8c2d1e5b7...4f9a
                  </p>
                </div>
              </div>

              {/* PLG line */}
              <div className="pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  {strings.upload.plgLine}
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Minimal footer */}
      <footer className="border-t border-border/50 py-4">
        <div className="container text-center">
          <p className="text-xs text-muted-foreground">
            PRIVATUM — {strings.brand.tagline}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default SecureUpload;

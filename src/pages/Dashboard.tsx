import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSeoMeta } from '@unhead/react';
import {
  Inbox, FileText, LinkIcon, Users, Activity, Settings,
  Plus, ChevronRight, Shield, Clock, HardDrive,
  ExternalLink, Download, Eye, Lock, Menu, X,
  LogOut, User as UserIcon, FolderOpen, MessageSquareLock, BookUser, UserPlus, Radio
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { VerificationBadge } from '@/components/profile/VerificationBadge';
import { EditProfileForm } from '@/components/profile/EditProfileForm';
import { FolderPickerDialog } from '@/components/vault/FolderPickerDialog';
import { useLocale } from '@/hooks/useLocale';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useLoginActions } from '@/hooks/useLoginActions';
import { useVault } from '@/hooks/useVault';
import { useAuditChain } from '@/hooks/useAuditChain';
import { useContacts } from '@/hooks/useContacts';
import {
  annaMeier,
  demoDeliveries,
  demoSecureLinks,
  demoActivities,
  dashboardStats,
  type DemoDelivery,
} from '@/lib/demoData';
import { toast } from '@/hooks/useToast';
import { parsePrivatumProfile, type VerificationTier } from '@/lib/signer';
import { cn } from '@/lib/utils';
import type { NostrMetadata } from '@nostrify/nostrify';

type Tab = 'overview' | 'inbox' | 'documents' | 'links' | 'contacts' | 'activity' | 'settings';

const Dashboard = () => {
  const { strings } = useLocale();
  const { user, metadata } = useCurrentUser();
  const login = useLoginActions();
  const navigate = useNavigate();
  const vault = useVault();
  const auditChain = useAuditChain();
  const { contacts } = useContacts();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [moveToVaultDelivery, setMoveToVaultDelivery] = useState<DemoDelivery | null>(null);

  useSeoMeta({
    title: `PRIVATUM — ${strings.dashboard.inbox}`,
    description: strings.hero.subtitle,
  });

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      // Give a brief moment for login state to load
      const timer = setTimeout(() => {
        if (!user) navigate('/');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [user, navigate]);

  // Parse profile data
  const profile = metadata
    ? parsePrivatumProfile(metadata as NostrMetadata & Record<string, unknown>)
    : null;

  const displayName = metadata?.name || profile?.privatum_handle || 'Professional';
  const displayTitle = profile?.privatum_title || metadata?.about || '';
  const displayPicture = metadata?.picture;
  const displayHandle = profile?.privatum_handle || localStorage.getItem('privatum:handle') || '';
  const verificationTier: VerificationTier = profile?.privatum_verification_tier || 'self-declared';

  // Use demo data as fallback for display
  const isDemo = !user;
  const effectiveName = isDemo ? annaMeier.name : displayName;
  const firstName = effectiveName.split(' ').pop() || effectiveName;
  const initials = effectiveName.split(' ').map((n) => n.charAt(0)).join('').slice(0, 2).toUpperCase();

  const navItems: { id: Tab; label: string; icon: typeof Inbox }[] = [
    { id: 'inbox', label: strings.dashboard.inbox, icon: Inbox },
    { id: 'documents', label: strings.dashboard.documents, icon: FileText },
    { id: 'links', label: strings.dashboard.secureLinks, icon: LinkIcon },
    { id: 'contacts', label: strings.dashboard.contacts, icon: Users },
    { id: 'activity', label: strings.dashboard.activity, icon: Activity },
    { id: 'settings', label: strings.dashboard.settings, icon: Settings },
  ];

  const formatSize = (bytes: number) => {
    if (bytes >= 1000000) return `${(bytes / 1000000).toFixed(1)} MB`;
    return `${(bytes / 1000).toFixed(0)} KB`;
  };

  const handleLogout = async () => {
    await login.logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Logo */}
        <div className="flex items-center gap-2 h-16 px-6 border-b border-border">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center">
              <span className="text-primary-foreground font-serif font-bold text-base leading-none">P</span>
            </div>
            <span className="font-serif font-semibold text-lg tracking-tight text-foreground">
              PRIVATUM
            </span>
          </Link>
          <button className="lg:hidden ml-auto p-1" onClick={() => setSidebarOpen(false)}>
            <X className="size-5" />
          </button>
        </div>

        {/* Professional info */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={displayPicture} alt={effectiveName} />
              <AvatarFallback className="bg-primary/10 text-primary font-serif font-bold text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm text-foreground truncate">{effectiveName}</p>
              <p className="text-xs text-muted-foreground truncate">{displayTitle}</p>
            </div>
          </div>
          {displayHandle && (
            <div className="mt-2">
              <VerificationBadge tier={verificationTier} size="sm" />
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          <button
            onClick={() => { setActiveTab('overview'); setSidebarOpen(false); }}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              activeTab === 'overview'
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
            )}
          >
            <Shield className="size-4" />
            Dashboard
          </button>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                activeTab === item.id
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              )}
            >
              <item.icon className="size-4" />
              {item.label}
              {item.id === 'inbox' && dashboardStats.newDeliveries > 0 && (
                <Badge className="ml-auto text-xs bg-primary text-primary-foreground px-1.5 py-0">
                  {dashboardStats.newDeliveries}
                </Badge>
              )}
            </button>
          ))}
        </nav>

        {/* Bottom actions */}
        <div className="p-4 border-t border-border space-y-2">
          <Link
            to="/messages"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <MessageSquareLock className="size-4" />
            <span>{strings.dashboard.messages}</span>
            <ChevronRight className="size-3 ml-auto" />
          </Link>
          <Link
            to="/directory"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <BookUser className="size-4" />
            <span>{strings.contacts.title}</span>
            <ChevronRight className="size-3 ml-auto" />
          </Link>
          <Link
            to="/vault"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Lock className="size-4" />
            <span>{strings.vault.title}</span>
            <ChevronRight className="size-3 ml-auto" />
          </Link>
          <Link
            to="/audit"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Shield className="size-4" />
            <span>{strings.audit.title}</span>
            <ChevronRight className="size-3 ml-auto" />
          </Link>
          <Link
            to="/privacy-dashboard"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Eye className="size-4" />
            <span>{strings.dashboard.privacyDashboard}</span>
            <ChevronRight className="size-3 ml-auto" />
          </Link>
          <Link
            to="/security"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Shield className="size-4" />
            <span>{strings.dashboard.securityCenter}</span>
            <ChevronRight className="size-3 ml-auto" />
          </Link>
          <Link
            to="/relays"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Radio className="size-4" />
            <span>{strings.relays.title}</span>
            <ChevronRight className="size-3 ml-auto" />
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-destructive/70 hover:text-destructive transition-colors w-full"
          >
            <LogOut className="size-4" />
            <span>{strings.dashboard.logout}</span>
          </button>
        </div>
      </aside>

      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="flex-1 min-w-0">
        {/* Top bar */}
        <header className="h-16 border-b border-border bg-card/50 backdrop-blur-lg flex items-center px-6 gap-4">
          <button className="lg:hidden p-1" onClick={() => setSidebarOpen(true)}>
            <Menu className="size-5" />
          </button>
          <h1 className="font-sans font-semibold text-foreground">
            {strings.dashboard.greeting}, {firstName}
          </h1>
          <div className="ml-auto flex items-center gap-3">
            <Button size="sm" asChild>
              <Link to="/dashboard/create-link">
                <Plus className="size-4 mr-1" />
                {strings.dashboard.createSecureLink}
              </Link>
            </Button>
          </div>
        </header>

        <div className="p-6 max-w-6xl">
          {/* Overview */}
          {activeTab === 'overview' && (
            <div className="space-y-6 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300">
              {/* Secure Inbox URL */}
              {displayHandle && (
                <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <LinkIcon className="size-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{strings.dashboard.secureInbox}</p>
                    <p className="text-sm text-primary font-mono truncate">privatum.ch/{displayHandle}</p>
                  </div>
                   <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(`https://privatum.ch/inbox/${displayHandle}`)}>
                     {strings.dashboard.copy}
                   </Button>
                </div>
              )}

              {/* Stats cards */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-border">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Inbox className="size-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-2xl font-serif font-bold text-foreground">{dashboardStats.newDeliveries}</p>
                        <p className="text-xs text-muted-foreground">{strings.dashboard.newDeliveries}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-brass/10 flex items-center justify-center">
                        <LinkIcon className="size-5 text-brass" />
                      </div>
                      <div>
                        <p className="text-2xl font-serif font-bold text-foreground">{dashboardStats.activeLinks}</p>
                        <p className="text-xs text-muted-foreground">{strings.dashboard.activeLinks}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                        <HardDrive className="size-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-2xl font-serif font-bold text-foreground">{dashboardStats.storageUsed}</p>
                        <p className="text-xs text-muted-foreground">{strings.dashboard.storage}</p>
                      </div>
                    </div>
                    <Progress value={dashboardStats.storagePercent} className="mt-3 h-1.5" />
                  </CardContent>
                </Card>

                <Card className="border-border">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Shield className="size-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-2xl font-serif font-bold text-foreground">{dashboardStats.securityScore}/5</p>
                        <p className="text-xs text-muted-foreground">{strings.dashboard.securityStatus}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent deliveries + Activity */}
              <div className="grid lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3">
                  <Card className="border-border">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="font-sans text-base">{strings.dashboard.inbox}</CardTitle>
                        <Button variant="ghost" size="sm" onClick={() => setActiveTab('inbox')}>
                          {strings.dashboard.viewAll}
                          <ChevronRight className="size-3 ml-1" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {demoDeliveries.map((delivery) => (
                        <div
                          key={delivery.id}
                          className="flex items-start gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer"
                        >
                          <div className={cn(
                            'w-2 h-2 mt-2 rounded-full shrink-0',
                            delivery.status === 'new' ? 'bg-primary' : 'bg-transparent'
                          )} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm text-foreground truncate">
                                {delivery.senderName}
                              </span>
                              <span className="text-xs text-muted-foreground ml-auto shrink-0">
                                {delivery.date}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">
                              {delivery.fileCount} {delivery.fileCount === 1 ? strings.dashboard.document : strings.dashboard.documentsPlural}
                              {delivery.message && ` — ${delivery.message}`}
                            </p>
                          </div>
                          {delivery.status === 'new' && (
                            <Badge variant="outline" className="text-xs shrink-0">{strings.dashboard.new}</Badge>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>

                <div className="lg:col-span-2">
                  <Card className="border-border">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="font-sans text-base">{strings.dashboard.recentActivity}</CardTitle>
                        <Button variant="ghost" size="sm" onClick={() => setActiveTab('activity')}>
                          {strings.dashboard.viewAll}
                          <ChevronRight className="size-3 ml-1" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {demoActivities.slice(0, 4).map((activity) => (
                        <div key={activity.id} className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                            {activity.type === 'delivery' && <Inbox className="size-3 text-muted-foreground" />}
                            {activity.type === 'link_opened' && <ExternalLink className="size-3 text-muted-foreground" />}
                            {activity.type === 'download' && <Download className="size-3 text-muted-foreground" />}
                            {activity.type === 'expired' && <Clock className="size-3 text-muted-foreground" />}
                            {activity.type === 'access' && <Lock className="size-3 text-muted-foreground" />}
                            {activity.type === 'link_created' && <Plus className="size-3 text-muted-foreground" />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm text-foreground leading-snug">{activity.description}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{activity.relativeTime}</p>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {/* Inbox tab */}
          {activeTab === 'inbox' && (
            <div className="space-y-4 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300">
              <h2 className="text-xl font-serif font-semibold text-foreground">{strings.dashboard.inbox}</h2>
              {demoDeliveries.map((delivery) => (
                <Card key={delivery.id} className="border-border hover:shadow-sm transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
                        delivery.status === 'new' ? 'bg-primary/10' : 'bg-secondary'
                      )}>
                        <Inbox className={cn(
                          'size-5',
                          delivery.status === 'new' ? 'text-primary' : 'text-muted-foreground'
                        )} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-foreground">{delivery.senderName}</span>
                          {delivery.status === 'new' && (
                            <Badge className="text-xs bg-primary text-primary-foreground">{strings.dashboard.new}</Badge>
                          )}
                          {delivery.status === 'viewed' && (
                            <Badge variant="outline" className="text-xs">{strings.dashboard.viewed}</Badge>
                          )}
                          {delivery.status === 'downloaded' && (
                            <Badge variant="secondary" className="text-xs">{strings.dashboard.downloaded}</Badge>
                          )}
                          <span className="text-sm text-muted-foreground ml-auto">{delivery.date}</span>
                        </div>
                        {delivery.message && (
                          <p className="text-sm text-muted-foreground mb-3">{delivery.message}</p>
                        )}
                        <div className="flex flex-wrap gap-2 mb-3">
                          {delivery.files.map((file) => (
                            <span key={file.name} className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-secondary text-xs text-foreground">
                              <FileText className="size-3" />
                              {file.name}
                              <span className="text-muted-foreground">({formatSize(file.size)})</span>
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="size-3 mr-1" />
                            {strings.vault.permView}
                          </Button>
                          <Button size="sm" variant="outline">
                            <Download className="size-3 mr-1" />
                            {strings.common.download}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setMoveToVaultDelivery(delivery)}>
                            <FolderOpen className="size-3 mr-1" />
                            {strings.vault.openVault}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Secure Links tab */}
          {activeTab === 'links' && (
            <div className="space-y-4 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-serif font-semibold text-foreground">{strings.dashboard.secureLinks}</h2>
                <Button size="sm" asChild>
                  <Link to="/dashboard/create-link">
                    <Plus className="size-4 mr-1" />
                    {strings.dashboard.createSecureLink}
                  </Link>
                </Button>
              </div>
              {demoSecureLinks.map((link) => (
                <Card key={link.id} className="border-border">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
                        link.status === 'active' ? 'bg-primary/10' : 'bg-secondary'
                      )}>
                        <LinkIcon className={cn(
                          'size-5',
                          link.status === 'active' ? 'text-primary' : 'text-muted-foreground'
                        )} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-foreground">{link.purpose}</span>
                          {link.status === 'active' && (
                            <Badge variant="outline" className="text-xs text-green-700 border-green-300">Aktiv</Badge>
                          )}
                          {link.status === 'expired' && (
                            <Badge variant="secondary" className="text-xs">Abgelaufen</Badge>
                          )}
                          {link.status === 'used' && (
                            <Badge variant="secondary" className="text-xs">Aufgebraucht</Badge>
                          )}
                        </div>
                        {link.recipientName && (
                          <p className="text-sm text-muted-foreground mb-1">Für: {link.recipientName}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span>Erstellt: {link.created}</span>
                          <Separator orientation="vertical" className="h-3" />
                          <span>Ablauf: {link.expires}</span>
                          <Separator orientation="vertical" className="h-3" />
                          <span>Uploads: {link.currentUploads}/{link.maxUploads}</span>
                          {link.accessCodeEnabled && (
                            <>
                              <Separator orientation="vertical" className="h-3" />
                              <span className="flex items-center gap-1">
                                <Lock className="size-3" />
                                Zugangscode
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Activity tab */}
          {activeTab === 'activity' && (
            <div className="space-y-4 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-serif font-semibold text-foreground">{strings.dashboard.activity}</h2>
                <Button size="sm" variant="outline" asChild>
                  <Link to="/audit">
                    <Shield className="size-4 mr-1" />
                    {strings.audit.title}
                  </Link>
                </Button>
              </div>
              <Card className="border-border">
                <CardContent className="p-6 space-y-4">
                  {/* Real chain entries first */}
                  {[...auditChain.entries].reverse().slice(0, 10).map((entry) => (
                    <div key={entry.entryHash} className="flex items-start gap-4 py-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Lock className="size-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-foreground">
                          {entry.direction === 'inbound' ? strings.audit.eventEncrypt : strings.audit.eventDownload}
                          {entry.filename && `: ${entry.filename}`}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(entry.timestamp * 1000).toLocaleString('de-CH')}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-[10px] shrink-0 font-mono">
                        {entry.entryHash.slice(0, 8)}…
                      </Badge>
                    </div>
                  ))}
                  {/* Demo activities */}
                  {demoActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-4 py-2">
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                        {activity.type === 'delivery' && <Inbox className="size-4 text-muted-foreground" />}
                        {activity.type === 'link_opened' && <ExternalLink className="size-4 text-muted-foreground" />}
                        {activity.type === 'download' && <Download className="size-4 text-muted-foreground" />}
                        {activity.type === 'expired' && <Clock className="size-4 text-muted-foreground" />}
                        {activity.type === 'access' && <Lock className="size-4 text-muted-foreground" />}
                        {activity.type === 'link_created' && <Plus className="size-4 text-muted-foreground" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-foreground">{activity.description}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{activity.timestamp}</p>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">{activity.relativeTime}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Settings tab — Profile editing */}
          {activeTab === 'settings' && (
            <div className="max-w-2xl motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300">
              <h2 className="text-xl font-serif font-semibold text-foreground mb-6">
                {strings.dashboard.settings}
              </h2>
              <EditProfileForm onSaved={() => setActiveTab('overview')} />
            </div>
          )}

          {/* Documents tab — links to Vault */}
          {activeTab === 'documents' && (
            <div className="space-y-4 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-serif font-semibold text-foreground">{strings.dashboard.documents}</h2>
                <Button size="sm" asChild>
                  <Link to="/vault">
                    <Lock className="size-4 mr-1" />
                    {strings.vault.openVault}
                  </Link>
                </Button>
              </div>

              {/* Quick stats */}
              <div className="grid sm:grid-cols-3 gap-4">
                <Card className="border-border">
                  <CardContent className="pt-6 text-center">
                    <p className="text-2xl font-serif font-bold text-foreground">{vault.stats.documentCount}</p>
                    <p className="text-xs text-muted-foreground">{strings.vault.encryptedDocuments}</p>
                  </CardContent>
                </Card>
                <Card className="border-border">
                  <CardContent className="pt-6 text-center">
                    <p className="text-2xl font-serif font-bold text-foreground">{vault.stats.folderCount}</p>
                    <p className="text-xs text-muted-foreground">{strings.vault.foldersMatters}</p>
                  </CardContent>
                </Card>
                <Card className="border-border">
                  <CardContent className="pt-6 text-center">
                    <p className="text-2xl font-serif font-bold text-foreground">{vault.stats.activePermissions}</p>
                    <p className="text-xs text-muted-foreground">{strings.vault.activePermissions}</p>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-primary/10 bg-primary/5">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Lock className="size-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{strings.vault.vaultDesc}</p>
                    <p className="text-sm text-muted-foreground">
                      {strings.vault.vaultSubDesc}
                    </p>
                  </div>
                  <Button asChild variant="outline">
                    <Link to="/vault">{strings.vault.openVault}</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Contacts — trusted directory */}
          {activeTab === 'contacts' && (
            <div className="space-y-4 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-serif font-semibold text-foreground">
                  {strings.dashboard.contacts}
                </h2>
                <Button size="sm" asChild>
                  <Link to="/directory">
                    <BookUser className="size-4 mr-1" />
                    {strings.contacts.title}
                  </Link>
                </Button>
              </div>

              {contacts.length === 0 ? (
                <Card className="border-dashed border-border">
                  <CardContent className="py-16 px-8 text-center">
                    <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mx-auto mb-3">
                      <UserIcon className="size-5 text-muted-foreground" />
                    </div>
                    <p className="font-medium text-foreground mb-1">{strings.contacts.noContacts}</p>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-4">
                      {strings.contacts.noContactsDesc}
                    </p>
                    <Button size="sm" variant="outline" asChild>
                      <Link to="/directory">
                        <UserPlus className="size-4 mr-1" />
                        {strings.contacts.addContact}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {contacts.map((contact) => (
                    <Card key={contact.pubkey} className="border-border">
                      <CardContent className="p-4 flex items-center gap-3">
                        <Avatar className="size-10 shrink-0">
                          <AvatarImage src={contact.picture} alt={contact.name} />
                          <AvatarFallback className="bg-primary/10 text-primary font-serif font-bold text-xs">
                            {contact.name.split(/\s+/).map((n) => n.charAt(0)).join('').slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-foreground truncate">{contact.name}</span>
                            {contact.verificationTier && (
                              <VerificationBadge tier={contact.verificationTier} size="sm" />
                            )}
                          </div>
                          {contact.nip05 && (
                            <p className="text-xs text-primary font-mono truncate">{contact.nip05}</p>
                          )}
                        </div>
                        <Button size="sm" variant="outline" asChild>
                          <Link to={`/messages?to=${contact.pubkey}`}>
                            <MessageSquareLock className="size-4 sm:mr-1" />
                            <span className="hidden sm:inline">{strings.contacts.message}</span>
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Move to Vault folder picker */}
      <FolderPickerDialog
        open={!!moveToVaultDelivery}
        onOpenChange={(open) => { if (!open) setMoveToVaultDelivery(null); }}
        folders={vault.displayFolders}
        onSelect={(folderId) => {
          if (moveToVaultDelivery) {
            vault.moveDeliveryToVault(
              { senderName: moveToVaultDelivery.senderName, files: moveToVaultDelivery.files },
              folderId,
              'manual',
            );
            const folderName = vault.displayFolders.find((f) => f.id === folderId)?.name || strings.vault.title;
            toast({
              title: `${moveToVaultDelivery.files.length} ${strings.vault.documents} → ${folderName}`,
            });
            setMoveToVaultDelivery(null);
          }
        }}
        onCreateFolder={(name, desc) => {
          const f = vault.createFolder(name, desc);
          return f.id;
        }}
        title={strings.vault.openVault}
        description={strings.vault.vaultSubDesc}
      />
    </div>
  );
};

export default Dashboard;

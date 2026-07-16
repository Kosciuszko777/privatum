import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSeoMeta } from '@unhead/react';
import {
  Inbox, FileText, LinkIcon, Users, Activity, Settings,
  Plus, ChevronRight, Shield, Clock, HardDrive,
  ExternalLink, Download, Archive, Eye, Lock, Menu, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useLocale } from '@/hooks/useLocale';
import {
  annaMeier,
  demoDeliveries,
  demoSecureLinks,
  demoActivities,
  dashboardStats,
} from '@/lib/demoData';
import { cn } from '@/lib/utils';

type Tab = 'overview' | 'inbox' | 'documents' | 'links' | 'contacts' | 'activity' | 'settings';

const Dashboard = () => {
  const { strings } = useLocale();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useSeoMeta({
    title: `PRIVATUM — ${strings.dashboard.inbox}`,
    description: strings.hero.subtitle,
  });

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
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-serif font-bold text-lg">A</span>
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm text-foreground truncate">{annaMeier.name}</p>
              <p className="text-xs text-muted-foreground truncate">{annaMeier.title}</p>
            </div>
          </div>
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

        {/* Security status */}
        <div className="p-4 border-t border-border">
          <Link
            to="/security"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Shield className="size-4" />
            <span>{strings.dashboard.securityCenter}</span>
            <ChevronRight className="size-3 ml-auto" />
          </Link>
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
            {strings.dashboard.greeting}, {annaMeier.name.split(' ')[1]}
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
                              {delivery.fileCount} {delivery.fileCount === 1 ? 'Dokument' : 'Dokumente'}
                              {delivery.message && ` — ${delivery.message}`}
                            </p>
                          </div>
                          {delivery.status === 'new' && (
                            <Badge variant="outline" className="text-xs shrink-0">Neu</Badge>
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
                            <Badge className="text-xs bg-primary text-primary-foreground">Neu</Badge>
                          )}
                          {delivery.status === 'viewed' && (
                            <Badge variant="outline" className="text-xs">Gesehen</Badge>
                          )}
                          {delivery.status === 'downloaded' && (
                            <Badge variant="secondary" className="text-xs">Heruntergeladen</Badge>
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
                            Ansehen
                          </Button>
                          <Button size="sm" variant="outline">
                            <Download className="size-3 mr-1" />
                            Herunterladen
                          </Button>
                          <Button size="sm" variant="outline">
                            <Archive className="size-3 mr-1" />
                            Archivieren
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
              <h2 className="text-xl font-serif font-semibold text-foreground">{strings.dashboard.activity}</h2>
              <Card className="border-border">
                <CardContent className="p-6 space-y-4">
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

          {/* Placeholder tabs */}
          {(activeTab === 'documents' || activeTab === 'contacts' || activeTab === 'settings') && (
            <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300">
              <h2 className="text-xl font-serif font-semibold text-foreground mb-4">
                {navItems.find(n => n.id === activeTab)?.label}
              </h2>
              <Card className="border-dashed border-border">
                <CardContent className="py-16 px-8 text-center">
                  <p className="text-muted-foreground max-w-sm mx-auto">
                    {strings.dashboard.noItems}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;

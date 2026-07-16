import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoginArea } from '@/components/auth/LoginArea';
import { useLocale } from '@/hooks/useLocale';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { cn } from '@/lib/utils';

export function Header() {
  const { strings, locale, setLocale } = useLocale();
  const { user } = useCurrentUser();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { href: '#features', label: strings.nav.features },
    { href: '#security', label: strings.nav.security },
    { href: '#pricing', label: strings.nav.pricing },
    { href: '#verticals', label: strings.nav.verticals },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
      <div className="container flex items-center justify-between h-16">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
            <span className="text-primary-foreground font-serif font-bold text-lg leading-none">P</span>
          </div>
          <span className="font-serif font-semibold text-xl tracking-tight text-foreground">
            PRIVATUM
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Desktop actions */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={() => setLocale(locale === 'de' ? 'en' : 'de')}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Switch language"
          >
            <Globe className="size-4" />
            <span className="uppercase">{locale}</span>
          </button>

          {user ? (
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost">
                <Link to="/dashboard">{strings.nav.dashboard}</Link>
              </Button>
              <LoginArea className="max-w-48" />
            </div>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link to="/login">{strings.nav.login}</Link>
              </Button>
              <Button asChild>
                <Link to="/onboarding">{strings.nav.getStarted}</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-2 text-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          'md:hidden overflow-hidden transition-all duration-300 ease-in-out',
          mobileOpen ? 'max-h-96' : 'max-h-0'
        )}
      >
        <nav className="container pb-6 flex flex-col gap-4">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => setLocale(locale === 'de' ? 'en' : 'de')}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              aria-label="Switch language"
            >
              <Globe className="size-4" />
              <span className="uppercase">{locale}</span>
            </button>
          </div>
          <div className="flex gap-3">
            {user ? (
              <>
                <Button asChild className="flex-1">
                  <Link to="/dashboard">{strings.nav.dashboard}</Link>
                </Button>
                <LoginArea className="max-w-32" />
              </>
            ) : (
              <>
                <Button variant="ghost" asChild className="flex-1">
                  <Link to="/login">{strings.nav.login}</Link>
                </Button>
                <Button asChild className="flex-1">
                  <Link to="/onboarding">{strings.nav.getStarted}</Link>
                </Button>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}

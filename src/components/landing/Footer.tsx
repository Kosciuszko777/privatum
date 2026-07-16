import { Link } from 'react-router-dom';
import { useLocale } from '@/hooks/useLocale';

export function Footer() {
  const { strings } = useLocale();

  return (
    <footer className="border-t border-border bg-card">
      <div className="container py-12 md:py-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand column */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                <span className="text-primary-foreground font-serif font-bold text-lg leading-none">P</span>
              </div>
              <span className="font-serif font-semibold text-xl tracking-tight text-foreground">
                PRIVATUM
              </span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              {strings.footer.tagline}
            </p>
          </div>

          {/* Security & Trust */}
          <div>
            <h4 className="font-sans font-semibold text-sm text-foreground mb-4">
              {strings.footer.security}
            </h4>
            <ul className="space-y-2">
              <li>
                <a href="#security" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Zero-Knowledge
                </a>
              </li>
              <li>
                <a href="#security" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {strings.trust.clientSide}
                </a>
              </li>
              <li>
                <a href="#security" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {strings.trust.swissHosting}
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-sans font-semibold text-sm text-foreground mb-4">
              {strings.footer.legal}
            </h4>
            <ul className="space-y-2">
              <li>
                <Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {strings.footer.privacy}
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {strings.footer.terms}
                </Link>
              </li>
              <li>
                <Link to="/imprint" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {strings.footer.imprint}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-sans font-semibold text-sm text-foreground mb-4">
              {strings.footer.contact}
            </h4>
            <ul className="space-y-2">
              <li>
                <span className="text-sm text-muted-foreground">hello@privatum.ch</span>
              </li>
              <li>
                <span className="text-sm text-muted-foreground">Zurich, Switzerland</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Privatum AG. All rights reserved.
          </p>
          <a
            href="https://shakespeare.diy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {strings.footer.vibed}
          </a>
        </div>
      </div>
    </footer>
  );
}

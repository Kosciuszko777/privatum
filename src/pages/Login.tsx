/**
 * Login page — wraps the existing AuthDialog in a branded Privatum experience.
 * No Nostr terminology exposed to the user.
 */

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSeoMeta } from '@unhead/react';
import { Shield } from 'lucide-react';
import AuthDialog from '@/components/auth/AuthDialog';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useLocale } from '@/hooks/useLocale';

const Login = () => {
  const { strings } = useLocale();
  const { user } = useCurrentUser();
  const navigate = useNavigate();
  const [authOpen, setAuthOpen] = useState(true);

  useSeoMeta({
    title: `PRIVATUM — ${strings.nav.login}`,
  });

  // Redirect to dashboard once logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Minimal header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-lg">
        <div className="container flex items-center justify-center h-14">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
              <span className="text-primary-foreground font-serif font-bold text-sm leading-none">P</span>
            </div>
            <span className="font-serif font-semibold text-base tracking-tight text-foreground">
              PRIVATUM
            </span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <Shield className="size-8 text-primary" />
          </div>
          <h1 className="text-2xl font-serif font-semibold text-foreground mb-2">
            {strings.nav.login}
          </h1>
          <p className="text-muted-foreground mb-6">
            Melden Sie sich bei Ihrem sicheren Privatum-Kanal an.
          </p>
        </div>
      </main>

      {/* The actual auth dialog */}
      <AuthDialog
        isOpen={authOpen}
        onClose={() => {
          setAuthOpen(false);
          if (!user) navigate('/');
        }}
      />
    </div>
  );
};

export default Login;

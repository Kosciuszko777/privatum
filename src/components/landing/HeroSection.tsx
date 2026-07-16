import { Link } from 'react-router-dom';
import { ArrowRight, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocale } from '@/hooks/useLocale';

export function HeroSection() {
  const { strings } = useLocale();

  return (
    <section className="relative isolate pt-32 pb-20 md:pt-44 md:pb-32 overflow-hidden">
      {/* Subtle warm gradient background */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background via-background to-secondary/30" />
      <div className="absolute top-20 right-0 -z-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 -z-10 w-72 h-72 bg-brass/5 rounded-full blur-3xl" />

      <div className="container">
        <div className="max-w-3xl mx-auto text-center">
          {/* Trust badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/80 border border-border/50 mb-8 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-700">
            <Shield className="size-4 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">
              Zero-Knowledge · Swiss-Hosted · Open Standards
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-semibold leading-tight tracking-tight text-foreground mb-4 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 motion-safe:duration-700">
            {strings.hero.title}
          </h1>
          <p className="text-4xl md:text-5xl lg:text-6xl font-serif font-semibold leading-tight tracking-tight text-primary mb-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 motion-safe:duration-700 motion-safe:delay-100">
            {strings.hero.titleHighlight}
          </p>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 motion-safe:duration-700 motion-safe:delay-200">
            {strings.hero.subtitle}
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 motion-safe:duration-700 motion-safe:delay-300">
            <Button size="lg" className="text-base px-8 h-12 rounded-lg" asChild>
              <Link to="/onboarding">
                {strings.hero.cta}
                <ArrowRight className="size-4 ml-1" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-base px-8 h-12 rounded-lg" asChild>
              <a href="#how-it-works">
                {strings.hero.ctaSecondary}
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

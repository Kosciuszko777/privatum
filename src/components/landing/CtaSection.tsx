import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocale } from '@/hooks/useLocale';

export function CtaSection() {
  const { strings } = useLocale();

  return (
    <section className="py-20 md:py-32">
      <div className="container">
        <div className="relative isolate max-w-4xl mx-auto bg-primary rounded-2xl p-10 md:p-16 text-center overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 -z-10 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 -z-10 w-48 h-48 bg-brass/10 rounded-full blur-3xl" />

          <h2 className="text-3xl md:text-4xl font-serif font-semibold text-primary-foreground mb-4">
            {strings.brand.taglineAlt1}
          </h2>
          <p className="text-lg text-primary-foreground/80 max-w-2xl mx-auto mb-8">
            {strings.hero.subtitle}
          </p>
          <Button
            size="lg"
            className="bg-white text-primary hover:bg-white/90 text-base px-8 h-12 rounded-lg"
            asChild
          >
            <Link to="/onboarding">
              {strings.hero.cta}
              <ArrowRight className="size-4 ml-1" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

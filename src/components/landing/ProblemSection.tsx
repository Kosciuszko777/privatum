import { AlertTriangle, Shield } from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';

export function ProblemSection() {
  const { strings } = useLocale();

  const emailSteps = strings.problem.emailPath.split(' → ');
  const privatumSteps = strings.problem.privatumPath.split(' → ');

  return (
    <section id="features" className="py-20 md:py-32 bg-secondary/30">
      <div className="container">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-serif font-semibold text-foreground mb-4">
            {strings.problem.title}
          </h2>
          <p className="text-lg text-muted-foreground">
            {strings.problem.subtitle}
          </p>
        </div>

        <div className="max-w-4xl mx-auto grid gap-8">
          {/* Email path — the problem */}
          <div className="relative bg-card rounded-xl border border-destructive/20 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="size-5 text-destructive" />
              </div>
              <div>
                <p className="font-semibold text-foreground">{strings.problem.emailLabel}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {emailSteps.map((step, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="px-3 py-1.5 text-sm bg-destructive/5 border border-destructive/10 rounded-md text-foreground/80 whitespace-nowrap">
                    {step}
                  </span>
                  {i < emailSteps.length - 1 && (
                    <span className="text-muted-foreground">→</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Privatum path — the solution */}
          <div className="relative bg-card rounded-xl border-2 border-primary/30 p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Shield className="size-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">{strings.problem.privatumLabel}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {privatumSteps.map((step, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className={`px-3 py-1.5 text-sm rounded-md whitespace-nowrap ${
                    step.includes('Encrypted') || step.includes('verschlüsselt')
                      ? 'bg-primary/10 border-2 border-primary/30 text-primary font-medium'
                      : 'bg-secondary border border-border text-foreground/80'
                  }`}>
                    {step}
                  </span>
                  {i < privatumSteps.length - 1 && (
                    <span className="text-primary">→</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

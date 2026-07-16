import { Scale, Heart, Brain, Calculator, Stamp, TrendingUp, Building2 } from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';

export function VerticalsSection() {
  const { strings } = useLocale();

  const verticals = [
    { icon: Scale, label: strings.verticals.lawyers },
    { icon: Heart, label: strings.verticals.healthcare },
    { icon: Brain, label: strings.verticals.psychotherapy },
    { icon: Calculator, label: strings.verticals.fiduciary },
    { icon: Stamp, label: strings.verticals.notaries },
    { icon: TrendingUp, label: strings.verticals.wealth },
    { icon: Building2, label: strings.verticals.familyOffice },
  ];

  return (
    <section id="verticals" className="py-20 md:py-32">
      <div className="container">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-serif font-semibold text-foreground mb-4">
            {strings.verticals.title}
          </h2>
        </div>

        <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-4">
          {verticals.map((v) => (
            <div
              key={v.label}
              className="flex items-center gap-3 px-6 py-4 bg-card rounded-xl border border-border hover:border-primary/30 hover:shadow-sm transition-all duration-300 cursor-default"
            >
              <v.icon className="size-5 text-primary" />
              <span className="font-medium text-foreground">{v.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

import { ShieldCheck, Lock, MapPin, Minimize2, KeyRound, EyeOff } from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';

export function TrustSection() {
  const { strings } = useLocale();

  const features = [
    { icon: ShieldCheck, title: strings.trust.zeroKnowledge, desc: strings.trust.zeroKnowledgeDesc },
    { icon: Lock, title: strings.trust.clientSide, desc: strings.trust.clientSideDesc },
    { icon: MapPin, title: strings.trust.swissHosting, desc: strings.trust.swissHostingDesc },
    { icon: Minimize2, title: strings.trust.dataMin, desc: strings.trust.dataMinDesc },
    { icon: KeyRound, title: strings.trust.openStandards, desc: strings.trust.openStandardsDesc },
    { icon: EyeOff, title: strings.trust.noAds, desc: strings.trust.noAdsDesc },
  ];

  return (
    <section id="security" className="py-20 md:py-32 bg-secondary/30">
      <div className="container">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-serif font-semibold text-foreground mb-4">
            {strings.trust.title}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {strings.trust.subtitle}
          </p>
        </div>

        <div className="max-w-5xl mx-auto grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-card rounded-xl border border-border p-6 hover:border-primary/20 hover:shadow-sm transition-all duration-300"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <feature.icon className="size-5 text-primary" />
              </div>
              <h3 className="font-sans font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

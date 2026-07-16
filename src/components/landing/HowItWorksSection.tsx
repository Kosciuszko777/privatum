import { UserPlus, Upload, Lock } from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';

export function HowItWorksSection() {
  const { strings } = useLocale();

  const steps = [
    {
      icon: UserPlus,
      title: strings.howItWorks.step1Title,
      desc: strings.howItWorks.step1Desc,
      number: '01',
    },
    {
      icon: Upload,
      title: strings.howItWorks.step2Title,
      desc: strings.howItWorks.step2Desc,
      number: '02',
    },
    {
      icon: Lock,
      title: strings.howItWorks.step3Title,
      desc: strings.howItWorks.step3Desc,
      number: '03',
    },
  ];

  return (
    <section id="how-it-works" className="py-20 md:py-32">
      <div className="container">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-serif font-semibold text-foreground mb-4">
            {strings.howItWorks.title}
          </h2>
        </div>

        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8">
          {steps.map((step) => (
            <div
              key={step.number}
              className="relative bg-card rounded-xl border border-border p-8 group hover:border-primary/30 hover:shadow-md transition-all duration-300"
            >
              {/* Step number */}
              <span className="absolute top-6 right-6 text-4xl font-serif font-bold text-border/80 select-none">
                {step.number}
              </span>

              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/15 transition-colors duration-300">
                <step.icon className="size-6 text-primary" />
              </div>

              <h3 className="text-xl font-serif font-semibold text-foreground mb-3">
                {step.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

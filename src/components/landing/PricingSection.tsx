import { Check, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLocale } from '@/hooks/useLocale';
import { cn } from '@/lib/utils';

export function PricingSection() {
  const { strings } = useLocale();

  const plans = [
    {
      ...strings.pricing.solo,
      highlighted: false,
      cta: strings.pricing.cta,
      href: '/onboarding',
    },
    {
      ...strings.pricing.professional,
      highlighted: true,
      cta: strings.pricing.cta,
      href: '/onboarding',
    },
    {
      ...strings.pricing.practice,
      highlighted: false,
      cta: strings.pricing.cta,
      href: '/onboarding',
    },
    {
      ...strings.pricing.enterprise,
      highlighted: false,
      cta: strings.pricing.ctaEnterprise,
      href: '/contact',
    },
  ];

  return (
    <section id="pricing" className="py-20 md:py-32 bg-secondary/30">
      <div className="container">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-serif font-semibold text-foreground mb-4">
            {strings.pricing.title}
          </h2>
          <p className="text-lg text-muted-foreground">
            {strings.pricing.subtitle}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            {strings.pricing.annual}
          </p>
        </div>

        <div className="max-w-6xl mx-auto grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                'relative flex flex-col bg-card rounded-xl border p-6',
                plan.highlighted
                  ? 'border-primary shadow-md ring-1 ring-primary/20'
                  : 'border-border'
              )}
            >
              {/* Popular badge */}
              {'popular' in plan && plan.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brass text-brass-foreground border-none text-xs px-3">
                  {plan.popular}
                </Badge>
              )}

              <div className="mb-6">
                <h3 className="font-sans font-bold text-sm tracking-wider text-muted-foreground mb-2">
                  {plan.name}
                </h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-serif font-bold text-foreground">
                    {plan.price}
                  </span>
                  {plan.price !== strings.pricing.enterprise.price && (
                    <span className="text-sm text-muted-foreground">
                      {strings.pricing.monthly}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">{plan.desc}</p>
              </div>

              <ul className="flex-1 space-y-3 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="size-4 text-primary mt-0.5 shrink-0" />
                    <span className="text-sm text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                variant={plan.highlighted ? 'default' : 'outline'}
                className="w-full"
                asChild
              >
                <Link to={plan.href}>
                  {plan.cta}
                  <ArrowRight className="size-4 ml-1" />
                </Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

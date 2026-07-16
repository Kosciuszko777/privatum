import { useSeoMeta } from '@unhead/react';
import { Header } from '@/components/landing/Header';
import { HeroSection } from '@/components/landing/HeroSection';
import { ProblemSection } from '@/components/landing/ProblemSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { TrustSection } from '@/components/landing/TrustSection';
import { VerticalsSection } from '@/components/landing/VerticalsSection';
import { PricingSection } from '@/components/landing/PricingSection';
import { Footer } from '@/components/landing/Footer';
import { CtaSection } from '@/components/landing/CtaSection';

const Index = () => {
  useSeoMeta({
    title: 'PRIVATUM — Confidential by design.',
    description: 'Secure, zero-knowledge document transfer for lawyers, physicians, and trusted professionals. Your clients\' secrets were never ours.',
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <ProblemSection />
        <HowItWorksSection />
        <TrustSection />
        <VerticalsSection />
        <PricingSection />
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;

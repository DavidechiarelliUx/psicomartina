import React from "react";
import HeroSection from "../components/home/HeroSection";
import ServicesPreview from "../components/home/ServicesPreview";
import AboutPreview from "../components/home/AboutPreview";
import TestimonialsSection from "../components/home/TestimonialsSection";
import CtaSection from "../components/home/CtaSection";
import SEOHead from "@/components/SEOHead";
import { getCanonicalUrl, seoPages } from "@/config/seo";

export default function Home() {
  return (
    <>
      <SEOHead {...seoPages.home} canonical={getCanonicalUrl(seoPages.home.path)} />
      <HeroSection />
      <ServicesPreview />
      <AboutPreview />
      <TestimonialsSection />
      <CtaSection />
    </>
  );
}

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, Calendar, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import SEOHead from "@/components/SEOHead";
import { getCanonicalUrl, seoPages } from "@/config/seo";

export default function NotFound() {
  const location = useLocation();

  return (
    <div className="pt-24 md:pt-28">
      <SEOHead {...seoPages.notFound} canonical={getCanonicalUrl(location.pathname)} />
      <section className="px-5 md:px-8 py-20 md:py-28">
        <div className="max-w-2xl mx-auto text-center">
          <p className="font-heading text-7xl md:text-8xl font-semibold text-primary/20 mb-4">404</p>
          <h1 className="font-heading text-hero-sm md:text-display-sm font-semibold text-foreground mb-5">Pagina non trovata</h1>
          <p className="text-muted-foreground leading-relaxed max-w-xl mx-auto">
            La pagina che stai cercando non esiste, è stata spostata o l'indirizzo è stato digitato in modo errato.
          </p>

          <div className="mt-9 flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/">
              <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-full px-8 gap-2 w-full sm:w-auto">
                <Home className="w-4 h-4" />
                Torna alla Home
              </Button>
            </Link>
            <Link to="/contatti">
              <Button size="lg" variant="outline" className="rounded-full px-8 gap-2 w-full sm:w-auto">
                <Calendar className="w-4 h-4" />
                Vai ai Contatti
              </Button>
            </Link>
          </div>

          <Link to="/blog" className="mt-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Leggi le risorse del blog
          </Link>
        </div>
      </section>
    </div>
  );
}

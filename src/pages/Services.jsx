import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Calendar, CheckCircle, Sparkles } from "lucide-react";
import SectionHeading from "../components/shared/SectionHeading";
import SEOHead from "@/components/SEOHead";
import { getCanonicalUrl, seoPages } from "@/config/seo";
import { apiFetch } from "@/api/client";
import { INTERVENTION_CODES, SERVICE_CODES, mergeServicesWithDefaults } from "@/config/servicesCatalog";

function ServiceCard({ service: s, index: i }) {
  return (
    <motion.div
      key={s.id}
      id={s.code}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: i * 0.05 }}
      className="bg-card border border-border rounded-2xl p-6 md:p-10 hover:shadow-md transition-shadow"
    >
      <div className="flex flex-col md:flex-row gap-6 md:gap-10">
        <div className="flex-shrink-0">
          <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-2xl">{s.icon || "•"}</div>
        </div>
        <div className="flex-1">
          {s.subtitle && <p className="text-xs font-semibold uppercase tracking-[0.15em] text-accent mb-1">{s.subtitle}</p>}
          <h3 className="font-heading text-xl md:text-2xl font-semibold text-foreground mb-3">{s.title}</h3>
          <p className="text-muted-foreground leading-relaxed mb-5">{s.description}</p>
          {s.price && <p className="mb-4 text-sm font-semibold text-primary">{s.price}</p>}
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {["Percorso personalizzato", "Spazio riservato e accogliente"].map((p) => (
              <li key={p} className="flex items-start gap-2 text-sm text-muted-foreground">
                <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                {p}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  );
}

// Card "Primo colloquio" in evidenza, sopra a tutto.
function FeaturedCard({ service: s }) {
  if (!s) return null;
  return (
    <motion.div
      id={s.code}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-3xl border border-accent/30 bg-gradient-to-br from-accent/10 via-card to-primary/5 p-7 md:p-12 shadow-sm"
    >
      <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-accent">
        <Sparkles className="h-3.5 w-3.5" /> Inizia da qui
      </span>
      <div className="mt-5 flex flex-col gap-6 md:flex-row md:items-center md:gap-10">
        <div className="flex-shrink-0">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/15 text-3xl">{s.icon || "☘️"}</div>
        </div>
        <div className="flex-1">
          {s.subtitle && <p className="mb-1 text-xs font-semibold uppercase tracking-[0.15em] text-accent">{s.subtitle}</p>}
          <h2 className="font-heading text-2xl font-semibold text-foreground md:text-3xl">{s.title}</h2>
          <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">{s.description}</p>
          {s.price && <p className="mt-3 text-sm font-semibold text-primary">{s.price}</p>}
        </div>
        <div className="flex-shrink-0">
          <Link to="/contatti">
            <Button size="lg" className="gap-2 rounded-full bg-accent px-7 text-accent-foreground hover:bg-accent/90">
              <Calendar className="h-4 w-4" /> Prenota
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

// Fascia scorrevole degli ambiti di intervento: card orizzontali con una linea che le
// attraversa al centro, in scorrimento continuo (marquee).
function InterventionAreasCarousel({ items }) {
  if (!items.length) return null;
  // Duplichiamo la lista per ottenere uno scorrimento continuo. Il margine è applicato
  // a OGNI card (anche l'ultima): così -50% corrisponde esattamente a un set e il loop
  // si ricongiunge senza buchi.
  const loop = [...items, ...items];

  return (
    <div className="relative mx-auto max-w-6xl overflow-hidden">
      {/* Linea che passa al centro delle card */}
      <div className="pointer-events-none absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      {/* Sfumature ai bordi per un'entrata/uscita morbida */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-10 bg-gradient-to-r from-background to-transparent md:w-14" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-10 bg-gradient-to-l from-background to-transparent md:w-14" />

      <motion.div
        className="flex w-max py-6"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: Math.max(20, items.length * 8), ease: "linear", repeat: Infinity }}
      >
        {loop.map((s, i) => (
          <div
            key={`${s.id}-${i}`}
            className="relative z-10 mr-6 w-[78vw] flex-shrink-0 rounded-2xl border border-border bg-card p-6 shadow-sm sm:w-[300px] md:mr-10 lg:w-[340px]"
          >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-xl">{s.icon || "•"}</div>
            {s.subtitle && <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-accent">{s.subtitle}</p>}
            <h3 className="mb-2 font-heading text-lg font-semibold text-foreground">{s.title}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{s.description}</p>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

export default function Services() {
  const { data: services = [] } = useQuery({
    queryKey: ["cms-services-public"],
    queryFn: () => apiFetch("/api/cms/servizi"),
  });
  const mergedServices = mergeServicesWithDefaults(services);
  const serviceItems = mergedServices.filter((service) => service.content_type === "servizio" || (!service.content_type && SERVICE_CODES.includes(service.code)));
  const interventionItems = mergedServices.filter((service) => service.content_type === "ambito" || (!service.content_type && INTERVENTION_CODES.includes(service.code)));

  const primoColloquio = serviceItems.find((service) => service.code === "primo_colloquio");
  const otherServices = serviceItems.filter((service) => service.code !== "primo_colloquio");

  return (
    <div className="pt-24 md:pt-28">
      <SEOHead {...seoPages.services} canonical={getCanonicalUrl(seoPages.services.path)} />
      <section className="px-5 md:px-8 pb-8">
        <div className="max-w-6xl mx-auto">
          <SectionHeading
            label="Servizi"
            title="Servizi e ambiti di intervento"
            description="Ogni percorso è costruito intorno a te, alle tue esigenze e ai tuoi tempi. Qui trovi sia le prestazioni offerte sia le aree in cui posso accompagnarti."
          />
        </div>
      </section>

      <section className="px-5 md:px-8 pb-20 md:pb-28">
        <div className="max-w-5xl mx-auto space-y-14">
          {/* 1. Primo colloquio in evidenza, sopra a tutto */}
          <FeaturedCard service={primoColloquio} />

          {/* 2. Percorsi e valutazioni (gli altri servizi) */}
          <div className="space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent mb-2">Servizi</p>
              <h2 className="font-heading text-3xl md:text-display-sm font-semibold text-foreground">Percorsi e valutazioni</h2>
            </div>
            <div className="space-y-8">
              {otherServices.map((service, i) => (
                <ServiceCard key={service.id} service={service} index={i} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3. Aree di supporto psicologico: fascia scorrevole con linea centrale */}
      <section className="px-0 md:px-0 pb-20 md:pb-28">
        <div className="max-w-5xl mx-auto px-5 md:px-8 mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent mb-2">Ambiti di intervento</p>
          <h2 className="font-heading text-3xl md:text-display-sm font-semibold text-foreground">Aree di supporto psicologico</h2>
        </div>
        <InterventionAreasCarousel items={interventionItems} />
      </section>

      <section className="px-5 md:px-8 py-16 bg-primary/5">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-heading text-display-sm font-semibold text-foreground mb-4">Non sai quale percorso fa per te?</h2>
          <p className="text-muted-foreground mb-8">È normale. Il primo colloquio serve proprio a questo: capire insieme di cosa hai bisogno e come posso aiutarti.</p>
          <Link to="/contatti">
            <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-full px-8 gap-2">
              <Calendar className="w-4 h-4" /> Prenota un Colloquio Gratuito
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

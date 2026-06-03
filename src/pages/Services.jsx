import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Calendar, CheckCircle } from "lucide-react";
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

export default function Services() {
  const { data: services = [] } = useQuery({
    queryKey: ["cms-services-public"],
    queryFn: () => apiFetch("/api/cms/servizi"),
  });
  const mergedServices = mergeServicesWithDefaults(services);
  const serviceItems = mergedServices.filter((service) => service.content_type === "servizio" || (!service.content_type && SERVICE_CODES.includes(service.code)));
  const interventionItems = mergedServices.filter((service) => service.content_type === "ambito" || (!service.content_type && INTERVENTION_CODES.includes(service.code)));

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
          <div className="space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent mb-2">Servizi</p>
              <h2 className="font-heading text-3xl md:text-display-sm font-semibold text-foreground">Percorsi e valutazioni</h2>
            </div>
            <div className="space-y-8">
              {serviceItems.map((service, i) => (
                <ServiceCard key={service.id} service={service} index={i} />
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent mb-2">Ambiti di intervento</p>
              <h2 className="font-heading text-3xl md:text-display-sm font-semibold text-foreground">Aree di supporto psicologico</h2>
            </div>
            <div className="space-y-8">
              {interventionItems.map((service, i) => (
                <ServiceCard key={service.id} service={service} index={i} />
              ))}
            </div>
          </div>
        </div>
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

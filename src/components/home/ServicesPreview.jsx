import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import SectionHeading from "../shared/SectionHeading";
import { apiFetch } from "@/api/client";
import { SERVICE_CODES, mergeServicesWithDefaults } from "@/config/servicesCatalog";

export default function ServicesPreview() {
  const { data: services = [] } = useQuery({
    queryKey: ["cms-services-preview"],
    queryFn: () => apiFetch("/api/cms/servizi"),
  });
  const previewServices = mergeServicesWithDefaults(services).filter((service) => SERVICE_CODES.includes(service.code));

  return (
    <section className="py-20 md:py-28 px-5 md:px-8">
      <div className="max-w-6xl mx-auto">
        <SectionHeading
          label="I miei servizi"
          title="Come posso aiutarti"
          description="Ogni percorso è unico, proprio come te. Insieme troveremo l'approccio più adatto alle tue esigenze."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {previewServices.slice(0, 4).map((service, i) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <Link to="/servizi" className="group block h-full">
                <div className="h-full bg-card border border-border rounded-2xl p-6 md:p-8 hover:shadow-lg hover:border-primary/20 transition-all duration-500">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary/10 text-primary mb-5 text-xl">{service.icon || "•"}</div>
                  <h3 className="font-heading text-xl font-semibold text-foreground mb-3">{service.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">{service.subtitle || service.description}</p>
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary group-hover:gap-3 transition-all duration-300">
                    Scopri di più <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

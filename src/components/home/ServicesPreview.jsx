import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Heart, Sparkles, Brain, ArrowRight } from "lucide-react";
import SectionHeading from "../shared/SectionHeading";

const services = [
  {
    icon: Shield,
    title: "Ansia e Stress",
    description: "Impara a riconoscere e gestire l'ansia, ritrovando calma e sicurezza nella tua quotidianità.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: Heart,
    title: "Relazioni",
    description: "Esplora le dinamiche relazionali per costruire legami più autentici e soddisfacenti.",
    color: "bg-secondary/40 text-foreground",
  },
  {
    icon: Sparkles,
    title: "Autostima",
    description: "Riscopri il tuo valore e sviluppa una relazione più gentile e autentica con te stessa/o.",
    color: "bg-accent/15 text-accent",
  },
  {
    icon: Brain,
    title: "Elaborazione Traumi",
    description: "Un percorso delicato per rielaborare esperienze dolorose e ritrovare il tuo equilibrio.",
    color: "bg-primary/10 text-primary",
  },
];

export default function ServicesPreview() {
  return (
    <section className="py-20 md:py-28 px-5 md:px-8">
      <div className="max-w-6xl mx-auto">
        <SectionHeading
          label="I miei servizi"
          title="Come posso aiutarti"
          description="Ogni percorso è unico, proprio come te. Insieme troveremo l'approccio più adatto alle tue esigenze."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {services.map((service, i) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <Link to="/servizi" className="group block h-full">
                <div className="h-full bg-card border border-border rounded-2xl p-6 md:p-8 hover:shadow-lg hover:border-primary/20 transition-all duration-500">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${service.color} mb-5`}>
                    <service.icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-heading text-xl font-semibold text-foreground mb-3">{service.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">{service.description}</p>
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

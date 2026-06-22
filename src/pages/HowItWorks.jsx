import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Calendar, MessageCircle, Target, TrendingUp, Phone, HelpCircle } from "lucide-react";
import SectionHeading from "../components/shared/SectionHeading";
import SEOHead from "@/components/SEOHead";
import { getCanonicalUrl, seoPages } from "@/config/seo";

const steps = [
  {
    icon: Phone,
    title: "Primo Contatto",
    description: "Mi contatti tramite il form, telefono o email. Ti rispondo entro 24 ore per fissare un appuntamento.",
  },
  {
    icon: MessageCircle,
    title: "Colloquio Conoscitivo",
    description: "Un primo incontro gratuito di 30 minuti per conoscerci, capire le tue esigenze e verificare che ci sia la giusta intesa.",
  },
  {
    icon: Target,
    title: "Definizione degli Obiettivi",
    description: "Insieme stabiliamo gli obiettivi del percorso di sostegno e l'approccio più adatto a te.",
  },
  {
    icon: TrendingUp,
    title: "Il Percorso",
    description: "Incontri periodici di circa 50 minuti, in studio o online. Monitoriamo i progressi e adattiamo il percorso alle tue esigenze.",
  },
];

const faqs = [
  {
    q: "Quanto dura un incontro?",
    a: "Ogni incontro dura circa 50 minuti. La frequenza viene concordata insieme ed è flessibile in base alle tue esigenze.",
  },
  {
    q: "Quanto dura il percorso complessivo?",
    a: "La durata varia in base agli obiettivi. Alcuni percorsi durano pochi mesi, altri possono essere più lunghi. Ne parleremo insieme fin dall'inizio.",
  },
  {
    q: "Fai incontri online?",
    a: "Sì, ricevo sia in studio a Roma che online tramite videochiamata, con la stessa cura e riservatezza.",
  },
  {
    q: "Quanto costa un incontro?",
    a: "Le tariffe sono trasparenti e vengono concordate fin dal primo contatto.",
  },
  {
    q: "Gli incontri sono detraibili?",
    a: "Sì, le spese per le prestazioni psicologiche sono detraibili al 19% nella dichiarazione dei redditi.",
  },
];

export default function HowItWorks() {
  return (
    <div className="pt-24 md:pt-28">
      <SEOHead {...seoPages.howItWorks} canonical={getCanonicalUrl(seoPages.howItWorks.path)} />
      <section className="px-5 md:px-8 pb-20 md:pb-28">
        <div className="max-w-6xl mx-auto">
          <SectionHeading
            label="Come Funziona"
            title="Il tuo percorso in 4 passi"
            description="Un percorso chiaro e trasparente, dal primo contatto all'accompagnamento nel cambiamento."
          />

          <div className="relative">
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-border -translate-x-1/2" />
            <div className="space-y-8 md:space-y-0">
              {steps.map((step, i) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className={`md:flex md:items-center md:gap-12 md:py-8 ${i % 2 === 0 ? "" : "md:flex-row-reverse"}`}
                >
                  <div className={`flex-1 ${i % 2 === 0 ? "md:text-right" : "md:text-left"}`}>
                    <div className={`bg-card border border-border rounded-2xl p-6 md:p-8 ${i % 2 === 0 ? "md:ml-auto" : "md:mr-auto"} max-w-md`}>
                      <div className={`flex items-center gap-3 mb-3 ${i % 2 === 0 ? "md:flex-row-reverse" : ""}`}>
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-primary">{i + 1}</span>
                        </div>
                        <h3 className="font-heading text-lg font-semibold text-foreground">{step.title}</h3>
                      </div>
                      <p className={`text-sm text-muted-foreground leading-relaxed ${i % 2 === 0 ? "md:text-right" : ""}`}>{step.description}</p>
                    </div>
                  </div>
                  <div className="hidden md:flex w-12 justify-center relative z-10">
                    <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                      <step.icon className="w-5 h-5 text-primary-foreground" />
                    </div>
                  </div>
                  <div className="flex-1 hidden md:block" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-5 md:px-8 py-20 md:py-28 bg-muted/40">
        <div className="max-w-3xl mx-auto">
          <SectionHeading
            label="Domande Frequenti"
            title="Hai qualche dubbio?"
            description="Ecco le risposte alle domande più comuni. Se ne hai altre, non esitare a contattarmi."
          />
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="bg-card border border-border rounded-xl p-5 md:p-6"
              >
                <div className="flex items-start gap-3">
                  <HelpCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-heading font-semibold text-foreground mb-2">{faq.q}</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 md:px-8 py-16 bg-primary/5">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-heading text-display-sm font-semibold text-foreground mb-4">Pronta/o a iniziare?</h2>
          <p className="text-muted-foreground mb-8">Il primo passo è sempre il più coraggioso. Io sono qui per accompagnarti.</p>
          <Link to="/contatti">
            <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-full px-8 gap-2">
              <Calendar className="w-4 h-4" /> Prenota il Primo Colloquio
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

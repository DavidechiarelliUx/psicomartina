// @ts-nocheck
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Calendar, GraduationCap, Heart, Shield, Lightbulb } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { getCanonicalUrl, seoPages } from "@/config/seo";

const ABOUT_IMG = "/images/dott4-3.png";
const OFFICE_IMG = "/images/studio.png";
const alboNumber = import.meta.env.VITE_STUDIO_ALBO_NUMBER || "12345";

const qualifications = [
  "Laurea Magistrale in Psicologia Clinica — Sapienza Università di Roma",
  "Specializzazione in Psicoterapia Cognitivo-Comportamentale",
  "Formazione EMDR per l'elaborazione dei traumi",
  `Iscritta all'Albo degli Psicologi — n. ${alboNumber}`,
  "Formazione continua in Mindfulness e ACT",
];

const values = [
  {
    icon: Heart,
    title: "Empatia",
    text: "Ogni incontro parte dall'ascolto genuino. Mi metto in relazione con te senza giudizio, con calore e rispetto.",
  },
  {
    icon: Shield,
    title: "Riservatezza",
    text: "Il tuo spazio è sacro. Tutto ciò che condividi resta in un ambiente sicuro e protetto dalla legge.",
  },
  {
    icon: Lightbulb,
    title: "Personalizzazione",
    text: "Non esistono soluzioni uguali per tutti. Costruisco ogni percorso intorno alle tue esigenze specifiche.",
  },
];

export default function About() {
  return (
    <div className="pt-24 md:pt-28">
      <SEOHead {...seoPages.about} canonical={getCanonicalUrl(seoPages.about.path)} />
      {/* Intro */}
      <section className="px-5 md:px-8 pb-20 md:pb-28">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
              <img src={ABOUT_IMG} alt="Dott.ssa Martina Giovinazzo" className="rounded-2xl shadow-xl w-full object-cover aspect-[4/3]" />
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.15 }}>
              <span className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-accent mb-4">Chi Sono</span>
              <h1 className="font-heading text-hero-sm md:text-display font-semibold text-foreground mb-6">Dott.ssa Martina Giovinazzo</h1>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  Ciao, sono Martina. Sono psicologa e psicoterapeuta con oltre 10 anni di esperienza clinica. Ho scelto questa professione perché credo
                  profondamente nel potenziale di ogni persona di trasformare la propria sofferenza in crescita.
                </p>
                <p>
                  Il mio approccio è integrativo: unisco tecniche cognitive, relazionali e corporee per costruire un percorso terapeutico realmente su misura.
                  Lavoro con adulti che affrontano ansia, difficoltà relazionali, problemi di autostima e traumi.
                </p>
                <p>
                  Fuori dallo studio amo camminare nella natura, leggere e praticare yoga — attività che mi aiutano a restare centrata e presente, anche nel mio
                  lavoro.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="px-5 md:px-8 py-20 md:py-28 bg-muted/40">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <span className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-accent mb-3">Il mio approccio</span>
            <h2 className="font-heading text-display-sm md:text-display font-semibold text-foreground">I valori che guidano il mio lavoro</h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {values.map((v, i) => (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-card border border-border rounded-2xl p-8 text-center"
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                  <v.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-heading text-xl font-semibold text-foreground mb-3">{v.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{v.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Qualifications */}
      <section className="px-5 md:px-8 py-20 md:py-28">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-accent mb-4">Formazione</span>
              <h2 className="font-heading text-display-sm md:text-display font-semibold text-foreground mb-8">Qualifiche e formazione</h2>
              <ul className="space-y-4">
                {qualifications.map((q, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-3"
                  >
                    <GraduationCap className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <p className="text-muted-foreground">{q}</p>
                  </motion.li>
                ))}
              </ul>
            </div>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}>
              <img src={OFFICE_IMG} alt="Studio della Dott.ssa Martina Giovinazzo" className="rounded-2xl shadow-xl w-full object-cover aspect-video" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-5 md:px-8 py-16 bg-primary/5">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-heading text-display-sm font-semibold text-foreground mb-4">Vuoi saperne di più?</h2>
          <p className="text-muted-foreground mb-8">
            Prenota un primo colloquio conoscitivo gratuito. Sarà un'occasione per conoscerci e capire insieme se posso aiutarti.
          </p>
          <Link to="/contatti">
            <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-full px-8 gap-2">
              <Calendar className="w-4 h-4" /> Prenota ora
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

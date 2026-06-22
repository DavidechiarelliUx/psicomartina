import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Award, BookOpen, Users } from "lucide-react";
import { motion } from "framer-motion";

const ABOUT_IMG = "/images/studio.png";
const alboNumber = import.meta.env.VITE_STUDIO_ALBO_NUMBER || "32977";
const alboRegion = import.meta.env.VITE_STUDIO_ALBO_REGION || "Lazio";

const stats = [
  { icon: Award, value: `Albo ${alboRegion}`, label: `Iscritta n. ${alboNumber}` },
  { icon: BookOpen, value: "CBT", label: "Approccio cognitivo-comportamentale" },
  { icon: Users, value: "Roma + Online", label: "Adulti, adolescenti e bambini" },
];

export default function AboutPreview() {
  return (
    <section className="py-20 md:py-28 px-5 md:px-8 bg-muted/40">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <div className="relative">
              <div className="absolute -inset-3 bg-gradient-to-br from-primary/10 to-secondary/20 rounded-[2rem] blur-xl" />
              <img
                src={ABOUT_IMG}
                alt="Un ambiente accogliente per gli incontri"
                className="relative rounded-2xl shadow-xl w-full object-cover aspect-[4/3]"
              />
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.15 }}>
            <span className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-accent mb-4">Chi Sono</span>
            <h2 className="font-heading text-display-sm md:text-display font-semibold text-foreground mb-5">Uno spazio di ascolto, senza giudizio</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Sono la Dott.ssa Martina Giovinazzo, psicologa iscritta all'Albo degli Psicologi del Lazio. Lavoro con un approccio
              cognitivo-comportamentale, che mette in relazione pensieri, emozioni e comportamenti per offrirti strumenti concreti
              e un percorso di sostegno su misura.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-8">
              Credo che ogni persona abbia già dentro di sé le risorse per stare meglio. Il mio ruolo è aiutarti a scoprirle, in uno spazio privo di giudizio.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 sm:flex-col sm:gap-0 sm:p-3 sm:text-center"
                >
                  <stat.icon className="h-5 w-5 flex-shrink-0 text-primary sm:mx-auto sm:mb-2" />
                  <div>
                    <p className="font-heading text-base font-bold leading-tight text-foreground sm:text-lg">{stat.value}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>

            <Link to="/chi-sono">
              <Button variant="outline" className="rounded-full px-6 gap-2">
                Leggi la mia storia <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Award, BookOpen, Users } from "lucide-react";
import { motion } from "framer-motion";

const ABOUT_IMG = "/images/studio.png";

const stats = [
  { icon: Users, value: "10+", label: "Anni di esperienza" },
  { icon: Award, value: "500+", label: "Persone aiutate" },
  { icon: BookOpen, value: "200+", label: "Ore di formazione" },
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
                alt="Dott.ssa Martina Giovinazzo durante una seduta"
                className="relative rounded-2xl shadow-xl w-full object-cover aspect-[4/3]"
              />
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.15 }}>
            <span className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-accent mb-4">Chi Sono</span>
            <h2 className="font-heading text-display-sm md:text-display font-semibold text-foreground mb-5">Credo nel potere della relazione terapeutica</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Sono la Dott.ssa Martina Giovinazzo, psicologa iscritta all'Albo degli Psicologi. Il mio approccio integra tecniche cognitive,
              relazionali e corporee per offrirti un percorso davvero su misura.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-8">
              Credo che ogni persona abbia già dentro di sé le risorse per stare meglio. Il mio ruolo è aiutarti a scoprirle, in uno spazio privo di giudizio.
            </p>

            <div className="grid grid-cols-3 gap-4 mb-8">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center p-3 bg-card rounded-xl border border-border">
                  <stat.icon className="w-5 h-5 text-primary mx-auto mb-2" />
                  <p className="font-heading text-xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
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

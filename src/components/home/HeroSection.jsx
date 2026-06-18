import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar } from "lucide-react";
import { motion } from "framer-motion";

const HERO_IMG = "/images/martina_giovinazzo.png";

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-20">
      <div className="absolute inset-0 bg-gradient-to-br from-secondary/20 via-background to-primary/5" />

      <div className="relative max-w-6xl mx-auto px-5 md:px-8 py-12 md:py-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="order-2 lg:order-1"
          >
            <span className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-accent mb-5">
              Dott.ssa Martina Giovinazzo — Psicologa
            </span>
            <h1 className="font-heading text-hero-sm md:text-hero font-semibold text-foreground leading-tight">
              Uno spazio sicuro dove <span className="text-primary italic">ascoltarti</span> davvero
            </h1>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-lg">
              Insieme trasformiamo le difficoltà in crescita. Ti accompagno in un percorso di consapevolezza, accoglienza e cambiamento — al tuo ritmo.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <Link to="/contatti">
                <Button
                  size="lg"
                  className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-full px-8 text-base gap-2 shadow-lg shadow-accent/20 w-full sm:w-auto"
                >
                  <Calendar className="w-4 h-4" />
                  Prenota un Colloquio
                </Button>
              </Link>
              <Link to="/chi-sono">
                <Button size="lg" variant="outline" className="rounded-full px-8 text-base gap-2 w-full sm:w-auto">
                  Scopri di più
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="order-1 lg:order-2 flex justify-center"
          >
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-secondary/40 to-primary/20 rounded-[2rem] blur-2xl" />
              <img
                src={HERO_IMG}
                alt="Dott.ssa Martina Giovinazzo — Psicologa"
                className="relative rounded-[1.5rem] shadow-2xl w-full max-w-md object-cover aspect-[3/4]"
              />
              <div className="absolute -bottom-4 -left-4 bg-card border border-border rounded-xl p-4 shadow-lg">
                <p className="text-xs text-muted-foreground font-medium">Oltre</p>
                <p className="text-2xl font-heading font-bold text-primary">500+</p>
                <p className="text-xs text-muted-foreground">persone accompagnate</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

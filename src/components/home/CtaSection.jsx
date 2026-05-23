import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Calendar, Phone } from "lucide-react";
import { motion } from "framer-motion";

export default function CtaSection() {
  const studioPhone = import.meta.env.VITE_STUDIO_PHONE;

  return (
    <section className="py-20 md:py-28 px-5 md:px-8 bg-primary/5">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-3xl mx-auto text-center"
      >
        <span className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-accent mb-4">Inizia oggi</span>
        <h2 className="font-heading text-display-sm md:text-display font-semibold text-foreground mb-5">Il primo passo è il più importante</h2>
        <p className="text-muted-foreground text-lg leading-relaxed mb-8 max-w-xl mx-auto">
          Non devi avere tutte le risposte. Basta la volontà di iniziare. Prenota un primo colloquio conoscitivo — senza impegno, completamente riservato.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/contatti">
            <Button
              size="lg"
              className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-full px-8 text-base gap-2 shadow-lg shadow-accent/20 w-full sm:w-auto"
            >
              <Calendar className="w-4 h-4" />
              Prenota il Primo Colloquio
            </Button>
          </Link>
          <a href={`tel:${studioPhone}`}>
            <Button size="lg" variant="outline" className="rounded-full px-8 text-base gap-2 w-full sm:w-auto">
              <Phone className="w-4 h-4" />
              Chiamami
            </Button>
          </a>
        </div>
        <p className="text-xs text-muted-foreground mt-6">Il primo colloquio conoscitivo dura circa 30 minuti ed è gratuito.</p>
      </motion.div>
    </section>
  );
}

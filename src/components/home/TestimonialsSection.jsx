import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";
import SectionHeading from "../shared/SectionHeading";
import { apiFetch } from "@/api/client";

const testimonials = [
  {
    name: "Maria L.",
    text: "La Dott.ssa Sereni ha creato uno spazio dove finalmente mi sono sentita libera di essere me stessa. Dopo mesi di terapia, ho imparato a gestire l'ansia e a vivere con più serenità.",
    rating: 5,
  },
  {
    name: "Marco R.",
    text: "Avevo paura di iniziare un percorso psicologico, ma la delicatezza e la professionalità della Dott.ssa mi hanno fatto sentire subito a mio agio. Un percorso che mi ha cambiato la vita.",
    rating: 5,
  },
  {
    name: "Sara P.",
    text: "Grazie a questo percorso ho ritrovato fiducia in me stessa e nelle mie relazioni. L'approccio della Dott.ssa Sereni è empatico, mai giudicante, e davvero efficace.",
    rating: 5,
  },
  {
    name: "Luca D.",
    text: "Un'esperienza trasformativa. La Dott.ssa Sereni mi ha aiutato ad elaborare un momento molto difficile con grande sensibilità e competenza. La consiglio a chiunque.",
    rating: 5,
  },
];

export default function TestimonialsSection() {
  const [current, setCurrent] = useState(0);
  const { data } = useQuery({
    queryKey: ["testimonials"],
    queryFn: () => apiFetch("/api/testimonials"),
  });

  const visibleTestimonials = data?.length ? data : testimonials;

  const next = () => setCurrent((c) => (c + 1) % visibleTestimonials.length);
  const prev = () => setCurrent((c) => (c - 1 + visibleTestimonials.length) % visibleTestimonials.length);

  const t = visibleTestimonials[current] || visibleTestimonials[0];

  return (
    <section className="py-20 md:py-28 px-5 md:px-8">
      <div className="max-w-4xl mx-auto">
        <SectionHeading label="Testimonianze" title="Le parole di chi ha scelto questo percorso" />

        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className="bg-card border border-border rounded-2xl p-8 md:p-12 text-center"
            >
              <Quote className="w-10 h-10 text-secondary/60 mx-auto mb-6" />
              <p className="font-heading text-lg md:text-xl text-foreground leading-relaxed italic mb-6">"{t.text}"</p>
              <div className="flex justify-center gap-1 mb-3">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-accent text-accent" />
                ))}
              </div>
              <p className="text-sm font-semibold text-foreground">{t.name}</p>
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-center gap-3 mt-6">
            <button
              onClick={prev}
              className="w-10 h-10 rounded-full border border-border bg-card flex items-center justify-center hover:bg-muted transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              {visibleTestimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${i === current ? "bg-primary w-6" : "bg-border"}`}
                />
              ))}
            </div>
            <button
              onClick={next}
              className="w-10 h-10 rounded-full border border-border bg-card flex items-center justify-center hover:bg-muted transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

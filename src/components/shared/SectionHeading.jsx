import React from "react";
import { motion } from "framer-motion";

export default function SectionHeading({ label, title, description, align = "center" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6 }}
      className={`mb-12 md:mb-16 ${align === "center" ? "text-center" : "text-left"}`}
    >
      {label && <span className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-accent mb-3">{label}</span>}
      <h2 className="font-heading text-display-sm md:text-display font-semibold text-foreground">{title}</h2>
      {description && (
        <p className={`mt-4 text-base md:text-lg text-muted-foreground leading-relaxed ${align === "center" ? "max-w-2xl mx-auto" : "max-w-xl"}`}>
          {description}
        </p>
      )}
    </motion.div>
  );
}

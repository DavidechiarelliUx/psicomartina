import React from "react";
import { Link } from "react-router-dom";
import { Heart, Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-foreground text-background/80">
      <div className="max-w-6xl mx-auto px-5 md:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Heart className="w-5 h-5 text-secondary" strokeWidth={2.5} />
              <span className="font-heading text-xl font-semibold text-background">Dott.ssa Giovinazzo</span>
            </div>
            <p className="text-background/60 text-sm leading-relaxed max-w-xs">
              Psicologa e psicoterapeuta. Uno spazio sicuro dove ritrovare il tuo equilibrio e la serenità che meriti.
            </p>
          </div>

          <div>
            <h4 className="font-heading text-lg font-semibold text-background mb-4">Link Utili</h4>
            <div className="space-y-2.5">
              {[
                { label: "Chi Sono", path: "/chi-sono" },
                { label: "Servizi", path: "/servizi" },
                { label: "Blog", path: "/blog" },
                { label: "Prenota", path: "/contatti" },
                { label: "Privacy Policy", path: "/privacy" },
              ].map((link) => (
                <Link key={link.path} to={link.path} className="block text-sm text-background/60 hover:text-secondary transition-colors">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-heading text-lg font-semibold text-background mb-4">Contatti</h4>
            <div className="space-y-3">
              <a
                href="mailto:chiarellidavide99@gmail.com"
                className="flex items-center gap-3 text-sm text-background/60 hover:text-secondary transition-colors"
              >
                <Mail className="w-4 h-4 flex-shrink-0" />
                chiarellidavide99@gmail.com
              </a>
              <a href="tel:+393331234567" className="flex items-center gap-3 text-sm text-background/60 hover:text-secondary transition-colors">
                <Phone className="w-4 h-4 flex-shrink-0" />
                +39 333 123 4567
              </a>
              <div className="flex items-start gap-3 text-sm text-background/60">
                <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                Via della Serenità 42, Roma
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-background/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-background/40">© {new Date().getFullYear()} Dott.ssa Martina Giovinazzo — P.IVA 12345678901 — Albo Psicologi n. 12345</p>
          <p className="text-xs text-background/40">Iscrizione Albo Psicologi del Lazio</p>
        </div>
      </div>
    </footer>
  );
}

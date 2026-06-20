import React from "react";
import { Link } from "react-router-dom";
import { Mail, Phone, MapPin } from "lucide-react";
import { useConsent } from "@/lib/consent";

export default function Footer() {
  const { openPreferences } = useConsent();
  const studioEmail = import.meta.env.VITE_STUDIO_EMAIL;
  const studioPhone = import.meta.env.VITE_STUDIO_PHONE;
  const studioAddress = import.meta.env.VITE_STUDIO_ADDRESS || "Via Tricerro 100, Roma";
  const studioAddress2 = import.meta.env.VITE_STUDIO_ADDRESS_2;
  const legalAddress = import.meta.env.VITE_STUDIO_LEGAL_ADDRESS;
  const studioVat = import.meta.env.VITE_STUDIO_VAT || "18477451001";
  const alboNumber = import.meta.env.VITE_STUDIO_ALBO_NUMBER || "32977";
  const alboRegion = import.meta.env.VITE_STUDIO_ALBO_REGION || "Lazio";

  return (
    <footer className="bg-foreground text-background/80">
      <div className="max-w-6xl mx-auto px-5 md:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <img src="/images/logo_bianco_senza_sfondo.png" alt="Logo Dott.ssa Martina Giovinazzo" className="w-8 h-8" />
              <span className="font-heading text-xl font-semibold text-background">Dott.ssa Martina Giovinazzo</span>
            </div>
            <p className="text-background/50 text-xs leading-relaxed mb-4">
              Psicologa — iscrizione Albo degli Psicologi del {alboRegion} n. {alboNumber}
            </p>
            <p className="text-background/60 text-sm italic leading-relaxed max-w-xs">
              “Uno spazio sicuro in cui ascolto, accoglienza e cambiamento si incontrano.”
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
                { label: "Cookie Policy", path: "/cookie-policy" },
                { label: "Note Legali", path: "/note-legali" },
              ].map((link) => (
                <Link key={link.path} to={link.path} className="block text-sm text-background/60 hover:text-secondary transition-colors">
                  {link.label}
                </Link>
              ))}
              <button
                type="button"
                onClick={openPreferences}
                className="block text-left text-sm text-background/60 hover:text-secondary transition-colors"
              >
                Preferenze cookie
              </button>
            </div>
          </div>

          <div>
            <h4 className="font-heading text-lg font-semibold text-background mb-4">Contatti</h4>
            <div className="space-y-3">
              <a
                href={`mailto:${studioEmail}`}
                className="flex items-center gap-3 text-sm text-background/60 hover:text-secondary transition-colors"
              >
                <Mail className="w-4 h-4 flex-shrink-0" />
                {studioEmail}
              </a>
              <a href={`tel:${studioPhone}`} className="flex items-center gap-3 text-sm text-background/60 hover:text-secondary transition-colors">
                <Phone className="w-4 h-4 flex-shrink-0" />
                {studioPhone}
              </a>
              <div className="flex items-start gap-3 text-sm text-background/60">
                <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p>{studioAddress}</p>
                  {studioAddress2 && <p>{studioAddress2}</p>}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-background/10 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <p className="text-xs text-background/40">
            © {new Date().getFullYear()} Dott.ssa Martina Giovinazzo — P.IVA {studioVat} — Albo Psicologi del {alboRegion} n. {alboNumber}
          </p>
          {legalAddress && <p className="text-xs text-background/30">Sede legale: {legalAddress}</p>}
        </div>
      </div>
    </footer>
  );
}

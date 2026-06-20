import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, X } from "lucide-react";
import { useConsent } from "@/lib/consent";

export default function ConsentNotice() {
  const { bannerOpen, consent, acceptAll, rejectAll, save, closeBanner } = useConsent();
  const [showPrefs, setShowPrefs] = useState(false);
  const [analytics, setAnalytics] = useState(Boolean(consent?.analytics));

  const openPrefsPanel = () => {
    setAnalytics(Boolean(consent?.analytics));
    setShowPrefs(true);
  };

  return (
    <AnimatePresence>
      {bannerOpen && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6"
          role="dialog"
          aria-label="Preferenze cookie"
        >
          <div className="max-w-2xl mx-auto bg-card border border-border rounded-2xl shadow-xl p-5 md:p-6">
            <div className="flex items-start gap-4">
              <Cookie className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-foreground font-medium mb-1">Rispettiamo la tua privacy</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Usiamo cookie tecnici necessari al funzionamento del sito e, solo con il tuo consenso, cookie analitici e
                  contenuti di terze parti (es. mappe e statistiche di navigazione). Puoi accettare, rifiutare o scegliere.
                  Maggiori dettagli nella{" "}
                  <Link to="/cookie-policy" className="underline hover:text-primary">
                    Cookie Policy
                  </Link>{" "}
                  e nella{" "}
                  <Link to="/privacy" className="underline hover:text-primary">
                    Privacy Policy
                  </Link>
                  .
                </p>

                <AnimatePresence>
                  {showPrefs && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 space-y-3 border-t border-border pt-4">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-xs font-medium text-foreground">Cookie necessari</p>
                            <p className="text-[11px] text-muted-foreground">Indispensabili al funzionamento. Sempre attivi.</p>
                          </div>
                          <Switch checked disabled aria-label="Cookie necessari (sempre attivi)" />
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-xs font-medium text-foreground">Cookie analitici e di terze parti</p>
                            <p className="text-[11px] text-muted-foreground">
                              Statistiche di navigazione e contenuti esterni (mappe). Disattivati di default.
                            </p>
                          </div>
                          <Switch checked={analytics} onCheckedChange={setAnalytics} aria-label="Cookie analitici e di terze parti" />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex flex-wrap gap-3 mt-4">
                  {/* Accetta e Rifiuta hanno lo STESSO risalto grafico (pari prominenza, no nudging). */}
                  <Button size="sm" onClick={acceptAll} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-5 text-xs">
                    Accetta tutti
                  </Button>
                  <Button size="sm" onClick={rejectAll} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-5 text-xs">
                    Rifiuta tutti
                  </Button>
                  {showPrefs ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => save({ analytics })}
                      className="rounded-full px-5 text-xs"
                    >
                      Salva preferenze
                    </Button>
                  ) : (
                    <Button size="sm" variant="ghost" onClick={openPrefsPanel} className="rounded-full px-5 text-xs">
                      Personalizza
                    </Button>
                  )}
                </div>
              </div>

              {/* La X chiude il pannello solo se una scelta è già stata salvata in precedenza. */}
              {consent && (
                <button
                  onClick={closeBanner}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Chiudi"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

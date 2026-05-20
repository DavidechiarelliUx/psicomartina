import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, X } from "lucide-react";

export default function ConsentNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie_consent");
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem("cookie_consent", "accepted");
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem("cookie_consent", "declined");
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6"
        >
          <div className="max-w-2xl mx-auto bg-card border border-border rounded-2xl shadow-xl p-5 md:p-6">
            <div className="flex items-start gap-4">
              <Cookie className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-foreground font-medium mb-1">Questo sito utilizza i cookie</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Utilizziamo cookie tecnici e, con il tuo consenso, cookie di analisi per migliorare la tua esperienza. Puoi leggere la nostra{" "}
                  <a href="/privacy" className="underline hover:text-primary">
                    Privacy Policy
                  </a>{" "}
                  per maggiori dettagli.
                </p>
                <div className="flex gap-3 mt-4">
                  <Button size="sm" onClick={accept} className="bg-primary hover:bg-primary/90 rounded-full px-5 text-xs">
                    Accetta tutti
                  </Button>
                  <Button size="sm" variant="outline" onClick={decline} className="rounded-full px-5 text-xs">
                    Solo necessari
                  </Button>
                </div>
              </div>
              <button onClick={decline} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

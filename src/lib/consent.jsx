import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

const STORAGE_KEY = "cookie_consent_v2";
const CONSENT_VERSION = 1;

const ConsentContext = createContext(null);

/**
 * Gestione centralizzata del consenso cookie (GDPR + Provv. Garante cookie 2021).
 * Categorie:
 *  - necessary: sempre attivi (tecnici), non richiedono consenso.
 *  - analytics: cookie/strumenti analitici e contenuti di terze parti (es. Vercel
 *    Speed Insights, embed Google Maps). Caricati SOLO con consenso esplicito.
 *
 * Nessuno strumento non-necessario deve partire prima che `consent.analytics === true`.
 */
export function ConsentProvider({ children }) {
  const [consent, setConsentState] = useState(null); // null = decisione non ancora presa
  const [bannerOpen, setBannerOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.version === CONSENT_VERSION) {
          setConsentState(parsed);
          return;
        }
      }
    } catch {
      /* localStorage non disponibile o valore corrotto */
    }
    setBannerOpen(true);
  }, []);

  const save = useCallback((categories) => {
    const value = {
      necessary: true,
      analytics: Boolean(categories.analytics),
      timestamp: new Date().toISOString(),
      version: CONSENT_VERSION,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    } catch {
      /* ignora errori di storage */
    }
    setConsentState(value);
    setBannerOpen(false);
  }, []);

  const acceptAll = useCallback(() => save({ analytics: true }), [save]);
  const rejectAll = useCallback(() => save({ analytics: false }), [save]);
  const openPreferences = useCallback(() => setBannerOpen(true), []);
  const closeBanner = useCallback(() => setBannerOpen(false), []);

  return (
    <ConsentContext.Provider
      value={{ consent, bannerOpen, save, acceptAll, rejectAll, openPreferences, closeBanner }}
    >
      {children}
    </ConsentContext.Provider>
  );
}

export function useConsent() {
  const ctx = useContext(ConsentContext);
  if (!ctx) throw new Error("useConsent deve essere usato dentro <ConsentProvider>");
  return ctx;
}

/** true solo se l'utente ha dato consenso esplicito agli strumenti analitici/terze parti. */
export function useAnalyticsConsent() {
  return useConsent().consent?.analytics === true;
}

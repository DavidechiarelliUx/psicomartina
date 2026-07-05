export const SITE_URL = (import.meta.env.VITE_SITE_URL || "https://psicologa-martina-giovinazzo.com").replace(/\/$/, "");
export const SITE_NAME = "Dott.ssa Martina Giovinazzo";

export const seoPages = {
  home: {
    title: "Dott.ssa Martina Giovinazzo - Psicologa a Roma",
    path: "/",
    description:
      "Sono la Dott.ssa Martina Giovinazzo, psicologa, e mi occupo di sostegno psicologico rivolto a bambini, adolescenti e adulti. Ricevo a Roma e online.",
  },
  about: {
    title: "Chi Sono",
    path: "/chi-sono",
    description:
      "Conosci Martina Giovinazzo, psicologa a Roma. Scopri approccio, formazione e valori per scegliere il percorso più adatto a te.",
  },
  services: {
    title: "Servizi di Psicologia",
    path: "/servizi",
    description:
      "Scopri servizi e ambiti di intervento psicologico: primo colloquio, sostegno psicologico, potenziamento cognitivo, screening DSA, ansia, età evolutiva e genitorialità.",
  },
  howItWorks: {
    title: "Come Funziona",
    path: "/come-funziona",
    description:
      "Scopri come funziona il percorso di sostegno psicologico, dal primo contatto agli incontri online o in studio. Prenota un colloquio conoscitivo senza impegno.",
  },
  blog: {
    title: "Blog di Psicologia",
    path: "/blog",
    description:
      "Leggi articoli di psicologia su ansia, relazioni, autostima e benessere. Scopri risorse utili per prenderti cura di te ogni giorno con consapevolezza.",
  },
  contact: {
    title: "Contatti e Prenotazioni",
    path: "/contatti",
    description:
      "Contatta lo studio di psicologia per informazioni, disponibilità e prenotazioni. Prenota il primo colloquio e ricevi risposta entro 24 ore lavorative.",
  },
  privacy: {
    title: "Privacy Policy",
    path: "/privacy",
    description:
      "Leggi la privacy policy dello studio e scopri come vengono trattati dati, richieste di contatto e prenotazioni nel rispetto del GDPR e della riservatezza.",
  },
  cookiePolicy: {
    title: "Cookie Policy",
    path: "/cookie-policy",
    description:
      "Scopri quali cookie utilizza questo sito, a cosa servono e come gestire o revocare il consenso in qualsiasi momento, nel rispetto del GDPR.",
  },
  legalNotice: {
    title: "Note Legali e Termini",
    path: "/note-legali",
    description:
      "Note legali, termini di utilizzo del sito e disclaimer professionale dello studio di psicologia: natura dei contenuti, prenotazioni e gestione delle emergenze.",
  },
  dashboard: {
    title: "Dashboard",
    path: "/dashboard",
    description:
      "Accedi alla dashboard privata per gestire appuntamenti, contatti e richieste dello studio in modo ordinato, riservato e sempre aggiornato ogni giorno.",
    noIndex: true,
  },
  notFound: {
    title: "Pagina non trovata",
    path: "/404",
    description:
      "La pagina che cerchi non esiste o è stata spostata. Torna alla Home o visita i Contatti per trovare il supporto psicologico più adatto a te.",
    noIndex: true,
  },
};

export const blogSeoDescriptions = {
  "ansia-respiro-consapevole":
    "Leggi come gestire ansia e respiro con pratiche semplici di presenza. Scopri piccoli gesti per ritrovare calma nei momenti difficili della giornata.",
  "confini-relazioni":
    "Scopri come mettere confini nelle relazioni e dire no con rispetto. Leggi strumenti utili per comunicare bisogni e proteggere il benessere personale.",
  "autostima-gentilezza":
    "Leggi come coltivare autostima e gentilezza verso di sé nei momenti difficili. Scopri un modo più accogliente di parlarti e cambiare con cura.",
};

export function getCanonicalUrl(path = "/") {
  const cleanPath = path === "/" ? "/" : `/${path.replace(/^\/+|\/+$/g, "")}`;
  return `${SITE_URL}${cleanPath}`;
}

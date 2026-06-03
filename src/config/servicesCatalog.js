export const SERVICE_CODES = ["primo_colloquio", "sostegno_psicologico", "potenziamento_cognitivo", "screening_dsa"];
export const INTERVENTION_CODES = ["ansia", "eta_evolutiva", "genitorialita"];

export const DEFAULT_SERVICES = [
  {
    id: "default-primo-colloquio",
    code: "primo_colloquio",
    title: "Primo colloquio",
    subtitle: "Accoglienza e orientamento",
    description: "Un primo incontro per conoscerci, ascoltare la richiesta e capire insieme quale percorso può essere più adatto.",
    icon: "☘️",
  },
  {
    id: "default-sostegno-psicologico",
    code: "sostegno_psicologico",
    title: "Sostegno psicologico",
    subtitle: "Uno spazio di ascolto",
    description: "Percorsi di supporto per affrontare momenti di difficoltà, cambiamento, fatica emotiva o blocchi personali.",
    icon: "🤍",
  },
  {
    id: "default-potenziamento-cognitivo",
    code: "potenziamento_cognitivo",
    title: "Potenziamento cognitivo",
    subtitle: "Risorse e strategie",
    description: "Attività mirate per sostenere attenzione, memoria, funzioni esecutive e metodo di studio in modo graduale e personalizzato.",
    icon: "🧠",
  },
  {
    id: "default-screening-dsa",
    code: "screening_dsa",
    title: "Screening DSA",
    subtitle: "Valutazione iniziale",
    description: "Screening per individuare possibili difficoltà specifiche dell'apprendimento e orientare eventuali approfondimenti diagnostici.",
    icon: "📘",
  },
  {
    id: "default-ansia",
    code: "ansia",
    title: "Ansia e stress",
    subtitle: "Regolazione emotiva",
    description: "Supporto per riconoscere e gestire ansia, stress, tensione, preoccupazioni ricorrenti e sovraccarico quotidiano.",
    icon: "🌿",
  },
  {
    id: "default-eta-evolutiva",
    code: "eta_evolutiva",
    title: "Età evolutiva",
    subtitle: "Infanzia e adolescenza",
    description: "Interventi rivolti a bambini e adolescenti per sostenere sviluppo emotivo, relazionale, scolastico e comportamentale.",
    icon: "🧩",
  },
  {
    id: "default-genitorialita",
    code: "genitorialita",
    title: "Genitorialità",
    subtitle: "Supporto ai genitori",
    description: "Uno spazio per accompagnare i genitori nella comprensione dei bisogni dei figli e nella gestione delle sfide educative.",
    icon: "👥",
  },
];

export function mergeServicesWithDefaults(services = []) {
  return DEFAULT_SERVICES.map((fallback) => {
    const cmsService = services.find((service) => service.code === fallback.code);
    return cmsService ? { ...fallback, ...cmsService } : fallback;
  });
}

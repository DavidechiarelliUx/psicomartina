export const SERVICE_CODES = ["primo_colloquio", "sostegno_psicologico", "potenziamento_cognitivo", "screening_dsa"];
export const INTERVENTION_CODES = ["ansia", "umore", "autostima", "relazioni", "genitorialita", "cambiamento", "eta_evolutiva"];

export const DEFAULT_SERVICES = [
  {
    id: "default-primo-colloquio",
    code: "primo_colloquio",
    title: "Primo colloquio",
    subtitle: "Accoglienza e orientamento",
    description: "Un primo incontro per conoscerci, ascoltare la tua richiesta e capire insieme quale percorso può essere più adatto a te.",
    icon: "☘️",
    content_type: "servizio",
  },
  {
    id: "default-sostegno-psicologico",
    code: "sostegno_psicologico",
    title: "Sostegno psicologico",
    subtitle: "Uno spazio di ascolto",
    description: "Percorsi di supporto per affrontare momenti di difficoltà, cambiamento, fatica emotiva o blocchi personali, rivolti a bambini, adolescenti e adulti.",
    icon: "🫱🏻‍🫲🏼",
    content_type: "servizio",
  },
  {
    id: "default-potenziamento-cognitivo",
    code: "potenziamento_cognitivo",
    title: "Potenziamento cognitivo",
    subtitle: "Risorse e strategie",
    description: "Attività mirate per rafforzare attenzione, memoria, funzioni esecutive e metodo di studio, con strumenti personalizzati e graduali.",
    icon: "🧠",
    content_type: "servizio",
  },
  {
    id: "default-screening-dsa",
    code: "screening_dsa",
    title: "Screening DSA",
    subtitle: "Valutazione iniziale",
    description: "Un primo percorso di valutazione per individuare possibili difficoltà specifiche dell'apprendimento e orientare, se necessario, verso un approfondimento diagnostico.",
    icon: "📚",
    content_type: "servizio",
  },
  {
    id: "default-ansia",
    code: "ansia",
    title: "Ansia, attacchi di panico e stress",
    subtitle: "Regolazione emotiva",
    description: "Imparare a riconoscere e gestire ansia, attacchi di panico, tensione e stress quotidiano, per ritrovare equilibrio e calma.",
    icon: "🫧",
    content_type: "ambito",
  },
  {
    id: "default-umore",
    code: "umore",
    title: "Difficoltà dell'umore",
    subtitle: "Ritrovare energia",
    description: "Supporto nei momenti di tristezza, demotivazione, apatia o calo dell'umore, per riscoprire energia, significato e benessere.",
    icon: "🌙",
    content_type: "ambito",
  },
  {
    id: "default-autostima",
    code: "autostima",
    title: "Autostima e insicurezza personale",
    subtitle: "Fiducia in sé",
    description: "Un percorso per rafforzare la fiducia in te stesso/a, affrontare l'insicurezza e coltivare un rapporto più gentile con te.",
    icon: "🪞",
    content_type: "ambito",
  },
  {
    id: "default-relazioni",
    code: "relazioni",
    title: "Difficoltà relazionali e familiari",
    subtitle: "Legami e comunicazione",
    description: "Strumenti per comprendere e migliorare le relazioni con gli altri e all'interno della famiglia, gestendo conflitti e distanze.",
    icon: "🧩",
    content_type: "ambito",
  },
  {
    id: "default-genitorialita",
    code: "genitorialita",
    title: "Supporto alla genitorialità",
    subtitle: "Accanto ai genitori",
    description: "Uno spazio per accompagnare i genitori nella comprensione dei bisogni dei figli e nella gestione delle sfide educative.",
    icon: "👨‍👩‍👧",
    content_type: "ambito",
  },
  {
    id: "default-cambiamento",
    code: "cambiamento",
    title: "Fasi di cambiamento e crescita",
    subtitle: "Momenti di transizione",
    description: "Affrontare con consapevolezza i momenti di transizione e crescita personale, trasformandoli in occasioni di sviluppo.",
    icon: "🔄",
    content_type: "ambito",
  },
  {
    id: "default-eta-evolutiva",
    code: "eta_evolutiva",
    title: "Supporto a bambini e adolescenti",
    subtitle: "Infanzia e adolescenza",
    description: "Interventi rivolti a bambini e adolescenti per sostenere lo sviluppo emotivo, relazionale e scolastico, in un ambiente accogliente.",
    icon: "🧒🏻",
    content_type: "ambito",
  },
];

export function mergeServicesWithDefaults(services = []) {
  return DEFAULT_SERVICES.map((fallback) => {
    const cmsService = services.find((service) => service.code === fallback.code);
    return cmsService ? { ...fallback, ...cmsService } : fallback;
  });
}

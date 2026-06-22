// Sedi del booking. I codici (sede1/sede2/online) sono stabili e usati dal DB/API;
// le etichette visibili arrivano dalle variabili d'ambiente.
export const LOCATIONS = [
  {
    code: "sede1",
    label: (import.meta.env.VITE_STUDIO_ADDRESS || "Via Tricerro 100, Roma").trim(),
  },
  {
    code: "sede2",
    label: (import.meta.env.VITE_STUDIO_ADDRESS_2 || "Studio Medico Efigyn - Via Bruno Serotini 45, Roma").trim(),
  },
  {
    code: "online",
    label: "Online",
  },
].filter((l) => l.label);

// Etichetta breve per i selettori (chip/tab): solo la VIA.
// Es. "Studio Medico Efigyn - Via Bruno Serotini 45, Roma" -> "Via Bruno Serotini 45".
//     "Via Tricerro 100, Roma" -> "Via Tricerro 100" · "Online" -> "Online".
LOCATIONS.forEach((l) => {
  const afterDash = l.label.includes(" - ") ? l.label.split(" - ").slice(1).join(" - ") : l.label;
  l.short = afterDash.split(",")[0].trim();
});

export const DEFAULT_LOCATION = LOCATIONS[0]?.code || "sede1";

export function locationLabel(code) {
  return LOCATIONS.find((l) => l.code === code)?.label || code;
}

export function locationShort(code) {
  return LOCATIONS.find((l) => l.code === code)?.short || code;
}

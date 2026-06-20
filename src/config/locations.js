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

export const DEFAULT_LOCATION = LOCATIONS[0]?.code || "sede1";

export function locationLabel(code) {
  return LOCATIONS.find((l) => l.code === code)?.label || code;
}

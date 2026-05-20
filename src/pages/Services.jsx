import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Shield, Heart, Sparkles, Brain, Calendar, CheckCircle } from "lucide-react";
import SectionHeading from "../components/shared/SectionHeading";

const services = [
  {
    id: "ansia",
    icon: Shield,
    title: "Ansia e Stress",
    subtitle: "Ritrovare la calma interiore",
    description:
      "L'ansia è una risposta naturale del corpo, ma quando diventa eccessiva può limitare la tua vita. Insieme lavoreremo per comprendere le cause profonde della tua ansia e sviluppare strategie concrete per gestirla.",
    points: ["Attacchi di panico e ansia generalizzata", "Ansia sociale e paura del giudizio", "Stress lavorativo e burnout", "Insonnia e tensione cronica"],
  },
  {
    id: "relazioni",
    icon: Heart,
    title: "Difficoltà Relazionali",
    subtitle: "Costruire legami autentici",
    description:
      "Le relazioni sono al centro del nostro benessere. Che si tratti di coppia, famiglia o amicizie, esplorare le dinamiche relazionali ti aiuterà a comunicare meglio e creare connessioni più profonde.",
    points: ["Conflitti di coppia ricorrenti", "Dipendenza affettiva", "Difficoltà a stabilire confini sani", "Elaborazione di separazioni e perdite"],
  },
  {
    id: "autostima",
    icon: Sparkles,
    title: "Autostima e Identità",
    subtitle: "Riscoprire il proprio valore",
    description:
      "Una bassa autostima influenza ogni aspetto della vita. Ti accompagnerò in un percorso per riconoscere il tuo valore, liberarti dal perfezionismo e sviluppare una relazione più gentile con te stessa/o.",
    points: ["Senso di inadeguatezza cronica", "Perfezionismo paralizzante", "Difficoltà nelle decisioni", "Sindrome dell'impostore"],
  },
  {
    id: "traumi",
    icon: Brain,
    title: "Elaborazione dei Traumi",
    subtitle: "Guarire dalle ferite del passato",
    description:
      "Le esperienze traumatiche possono lasciare segni profondi. Con un approccio delicato e rispettoso dei tuoi tempi, ti aiuterò a rielaborare il dolore e ritrovare il tuo equilibrio.",
    points: [
      "Traumi dell'infanzia e dell'attaccamento",
      "Lutti e perdite significative",
      "Esperienze di abuso o violenza",
      "Disturbo post-traumatico da stress",
    ],
  },
];

export default function Services() {
  return (
    <div className="pt-24 md:pt-28">
      <section className="px-5 md:px-8 pb-8">
        <div className="max-w-6xl mx-auto">
          <SectionHeading
            label="Servizi"
            title="I miei ambiti di intervento"
            description="Ogni percorso è costruito intorno a te, alle tue esigenze e ai tuoi tempi. Ecco le aree in cui posso accompagnarti."
          />
        </div>
      </section>

      <section className="px-5 md:px-8 pb-20 md:pb-28">
        <div className="max-w-5xl mx-auto space-y-8">
          {services.map((s, i) => (
            <motion.div
              key={s.id}
              id={s.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className="bg-card border border-border rounded-2xl p-6 md:p-10 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col md:flex-row gap-6 md:gap-10">
                <div className="flex-shrink-0">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                    <s.icon className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-accent mb-1">{s.subtitle}</p>
                  <h3 className="font-heading text-xl md:text-2xl font-semibold text-foreground mb-3">{s.title}</h3>
                  <p className="text-muted-foreground leading-relaxed mb-5">{s.description}</p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {s.points.map((p) => (
                      <li key={p} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="px-5 md:px-8 py-16 bg-primary/5">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-heading text-display-sm font-semibold text-foreground mb-4">Non sai quale percorso fa per te?</h2>
          <p className="text-muted-foreground mb-8">
            È normale. Il primo colloquio serve proprio a questo: capire insieme di cosa hai bisogno e come posso aiutarti.
          </p>
          <Link to="/contatti">
            <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-full px-8 gap-2">
              <Calendar className="w-4 h-4" /> Prenota un Colloquio Gratuito
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

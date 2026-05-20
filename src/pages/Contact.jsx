import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Mail, Phone, MapPin, Clock, CheckCircle2, Send } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import SectionHeading from "../components/shared/SectionHeading";
import { apiFetch } from "@/api/client";

const timeSlots = ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00", "18:00"];

export default function Contact() {
  const [form, setForm] = useState({
    client_name: "",
    client_email: "",
    client_phone: "",
    date: "",
    time_slot: "",
    service_type: "",
    notes: "",
    privacy_accepted: false,
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.privacy_accepted) {
      toast.error("Devi accettare la privacy policy per procedere.");
      return;
    }
    setSending(true);
    try {
      await apiFetch("/api/appointments", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setSent(true);
      toast.success("Richiesta salvata. Ti ricontatterò entro 24 ore.");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSending(false);
    }
  };

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="pt-24 md:pt-28">
      <section className="px-5 md:px-8 pb-20 md:pb-28">
        <div className="max-w-6xl mx-auto">
          <SectionHeading
            label="Contatti"
            title="Prenota il tuo primo colloquio"
            description="Compila il form per richiedere un appuntamento. Ti ricontatterò entro 24 ore per confermare."
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            {/* Contact Info */}
            <div className="lg:col-span-1 space-y-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-primary/5 rounded-2xl p-6 md:p-8">
                <h3 className="font-heading text-lg font-semibold text-foreground mb-6">Informazioni</h3>
                <div className="space-y-5">
                  <a
                    href="mailto:martinagiovinazzo@gmail.com"
                    className="flex items-start gap-3 text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Mail className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-foreground">Email</p>
                      <p>martinagiovinazzo@gmail.com</p>
                    </div>
                  </a>
                  <a href="tel:+393331234567" className="flex items-start gap-3 text-sm text-muted-foreground hover:text-primary transition-colors">
                    <Phone className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-foreground">Telefono</p>
                      <p>+39 333 123 4567</p>
                    </div>
                  </a>
                  <div className="flex items-start gap-3 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-foreground">Studio</p>
                      <p>Via della Serenità 42, Roma</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-foreground">Orari</p>
                      <p>Lun-Ven: 9:00 – 19:00</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              <div className="bg-card border border-border rounded-2xl p-6">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">Sedute online</strong>
                  <br />
                  Offro anche sedute tramite videochiamata, con la stessa qualità e riservatezza delle sedute in studio.
                </p>
              </div>
            </div>

            {/* Form */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="lg:col-span-2">
              {sent ? (
                <div className="bg-card border border-border rounded-2xl p-8 md:p-12 text-center">
                  <CheckCircle2 className="w-16 h-16 text-primary mx-auto mb-6" />
                  <h3 className="font-heading text-2xl font-semibold text-foreground mb-3">Richiesta inviata!</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Grazie per avermi contattata. Ti ricontatterò entro 24 ore per confermare l'appuntamento.
                  </p>
                  <Button
                    onClick={() => {
                      setSent(false);
                      setForm({
                        client_name: "",
                        client_email: "",
                        client_phone: "",
                        date: "",
                        time_slot: "",
                        service_type: "",
                        notes: "",
                        privacy_accepted: false,
                      });
                    }}
                    variant="outline"
                    className="mt-6 rounded-full"
                  >
                    Invia un'altra richiesta
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 md:p-8 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome e Cognome *</Label>
                      <Input id="name" required value={form.client_name} onChange={(e) => update("client_name", e.target.value)} placeholder="Il tuo nome" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        required
                        value={form.client_email}
                        onChange={(e) => update("client_email", e.target.value)}
                        placeholder="La tua email"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefono</Label>
                      <Input id="phone" value={form.client_phone} onChange={(e) => update("client_phone", e.target.value)} placeholder="+39 ..." />
                    </div>
                    <div className="space-y-2">
                      <Label>Tipo di servizio</Label>
                      <Select value={form.service_type} onValueChange={(v) => update("service_type", v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="primo_colloquio">Primo Colloquio Conoscitivo</SelectItem>
                          <SelectItem value="ansia">Ansia e Stress</SelectItem>
                          <SelectItem value="relazioni">Difficoltà Relazionali</SelectItem>
                          <SelectItem value="autostima">Autostima</SelectItem>
                          <SelectItem value="traumi">Elaborazione Traumi</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="date">Data preferita *</Label>
                      <Input id="date" type="date" required value={form.date} onChange={(e) => update("date", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Orario preferito *</Label>
                      <Select value={form.time_slot} onValueChange={(v) => update("time_slot", v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona orario" />
                        </SelectTrigger>
                        <SelectContent>
                          {timeSlots.map((t) => (
                            <SelectItem key={t} value={t}>
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Messaggio (opzionale)</Label>
                    <Textarea
                      id="notes"
                      value={form.notes}
                      onChange={(e) => update("notes", e.target.value)}
                      placeholder="Raccontami brevemente di cosa hai bisogno..."
                      rows={4}
                    />
                  </div>
                  <div className="flex items-start gap-3">
                    <Checkbox id="privacy" checked={form.privacy_accepted} onCheckedChange={(v) => update("privacy_accepted", v)} />
                    <Label htmlFor="privacy" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                      Ho letto e accetto la{" "}
                      <a href="/privacy" className="underline hover:text-primary">
                        Privacy Policy
                      </a>
                      . Acconsento al trattamento dei miei dati personali ai sensi del GDPR (Reg. UE 2016/679) per la gestione della richiesta di appuntamento.
                    </Label>
                  </div>
                  <Button
                    type="submit"
                    disabled={sending}
                    size="lg"
                    className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-full px-8 gap-2 w-full sm:w-auto"
                  >
                    {sending ? "Invio in corso..." : <><Send className="w-4 h-4" /> Invia Richiesta</>}
                  </Button>
                </form>
              )}
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}

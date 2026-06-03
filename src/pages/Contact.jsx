import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Mail, Phone, MapPin, Clock, CheckCircle2, FileText, Send } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import SectionHeading from "../components/shared/SectionHeading";
import { apiFetch } from "@/api/client";
import SEOHead from "@/components/SEOHead";
import { getCanonicalUrl, seoPages } from "@/config/seo";

const timeSlots = ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00", "18:00"];
const studioEmail = import.meta.env.VITE_STUDIO_EMAIL;
const studioPhone = import.meta.env.VITE_STUDIO_PHONE;

export default function Contact() {
  const [visibleMonth, setVisibleMonth] = useState(new Date());
  const [form, setForm] = useState({
    client_name: "",
    client_email: "",
    client_phone: "",
    date: "",
    time_slot: "",
    service_type: "",
    notes: "",
    privacy_accepted: false,
    informed_consent_accepted: false,
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const monthKey = format(visibleMonth, "yyyy-MM");
  const { data: availability, isFetching: availabilityLoading } = useQuery({
    queryKey: ["availability", monthKey],
    queryFn: () => apiFetch(`/api/availability?month=${monthKey}`),
  });
  const bookedSlots = availability?.booked || {};
  const selectedBookedSlots = form.date ? bookedSlots[form.date] || [] : [];
  const availableSlots = timeSlots.filter((slot) => !selectedBookedSlots.includes(slot));

  useEffect(() => {
    if (form.time_slot && selectedBookedSlots.includes(form.time_slot)) {
      setForm((prev) => ({ ...prev, time_slot: "" }));
    }
  }, [form.time_slot, selectedBookedSlots]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.privacy_accepted) {
      toast.error("Devi accettare la privacy policy per procedere.");
      return;
    }
    if (!form.informed_consent_accepted) {
      toast.error("Devi confermare di aver letto il consenso informato per procedere.");
      return;
    }
    if (!form.date || !form.time_slot) {
      toast.error("Seleziona una data e una fascia oraria disponibile.");
      return;
    }
    if (selectedBookedSlots.includes(form.time_slot)) {
      toast.error("Questa fascia oraria è già confermata. Scegli un altro orario.");
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
  const selectDate = (date) => {
    const value = format(date, "yyyy-MM-dd");
    setForm((prev) => ({
      ...prev,
      date: value,
      time_slot: bookedSlots[value]?.includes(prev.time_slot) ? "" : prev.time_slot,
    }));
  };

  return (
    <div className="pt-24 md:pt-28">
      <SEOHead {...seoPages.contact} canonical={getCanonicalUrl(seoPages.contact.path)} />
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
                    href={`mailto:${studioEmail}`}
                    className="flex items-start gap-3 text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Mail className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-foreground">Email</p>
                      <p>{studioEmail}</p>
                    </div>
                  </a>
                  <a href={`tel:${studioPhone}`} className="flex items-start gap-3 text-sm text-muted-foreground hover:text-primary transition-colors">
                    <Phone className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-foreground">Telefono</p>
                      <p>{studioPhone}</p>
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
                        informed_consent_accepted: false,
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
                          <SelectItem value="primo_colloquio">Primo colloquio</SelectItem>
                          <SelectItem value="sostegno_psicologico">Sostegno psicologico</SelectItem>
                          <SelectItem value="potenziamento_cognitivo">Potenziamento cognitivo</SelectItem>
                          <SelectItem value="screening_dsa">Screening DSA</SelectItem>
                          <SelectItem value="ansia">Ansia e stress</SelectItem>
                          <SelectItem value="eta_evolutiva">Età evolutiva</SelectItem>
                          <SelectItem value="genitorialita">Genitorialità</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(220px,0.85fr)]">
                    <div className="space-y-2">
                      <Label>Data preferita *</Label>
                      <div className="rounded-2xl border border-border bg-background p-2">
                        <Calendar
                          mode="single"
                          selected={form.date ? new Date(`${form.date}T12:00:00`) : undefined}
                          month={visibleMonth}
                          onMonthChange={setVisibleMonth}
                          onSelect={(date) => date && selectDate(date)}
                          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                          locale={it}
                          className="mx-auto"
                        />
                      </div>
                      <input type="hidden" required value={form.date} onChange={() => {}} />
                    </div>
                    <div className="space-y-2">
                      <Label>Fasce orarie *</Label>
                      <div className="rounded-2xl border border-border bg-background p-4">
                        {form.date ? (
                          <>
                            <p className="mb-3 text-sm text-muted-foreground">
                              {format(new Date(`${form.date}T12:00:00`), "EEEE d MMMM yyyy", { locale: it })}
                            </p>
                            {availabilityLoading && <p className="mb-3 text-xs text-muted-foreground">Controllo disponibilità in corso...</p>}
                            <div className="grid grid-cols-2 gap-2">
                              {timeSlots.map((slot) => {
                                const booked = selectedBookedSlots.includes(slot);
                                const disabled = booked || (availabilityLoading && !availability);
                                const selected = form.time_slot === slot;
                                return (
                                  <button
                                    key={slot}
                                    type="button"
                                    disabled={disabled}
                                    onClick={() => update("time_slot", slot)}
                                    className={`rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
                                      selected
                                        ? "border-primary bg-primary text-primary-foreground"
                                        : disabled
                                          ? "cursor-not-allowed border-border bg-muted text-muted-foreground line-through opacity-60"
                                          : "border-border hover:border-primary hover:bg-primary/5"
                                    }`}
                                  >
                                    {slot}
                                  </button>
                                );
                              })}
                            </div>
                            {availableSlots.length === 0 && <p className="mt-3 text-xs text-muted-foreground">Nessuna fascia disponibile in questo giorno.</p>}
                          </>
                        ) : (
                          <p className="text-sm text-muted-foreground">Seleziona un giorno dal calendario per vedere gli orari disponibili.</p>
                        )}
                      </div>
                      <input type="hidden" required value={form.time_slot} onChange={() => {}} />
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
                  <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4 md:p-5">
                    <div className="mb-3 flex items-start gap-3">
                      <FileText className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                      <div>
                        <h3 className="font-heading text-lg font-semibold text-foreground">Consenso informato</h3>
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                          Il primo colloquio è uno spazio conoscitivo e di orientamento. La richiesta inviata tramite il sito non sostituisce una valutazione
                          clinica, non rappresenta una presa in carico automatica e non è un servizio per emergenze. Durante il colloquio verranno chiariti
                          obiettivi, modalità del percorso, durata indicativa, costi, riservatezza professionale e possibilità di interrompere il percorso in
                          qualsiasi momento.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="informed-consent"
                        checked={form.informed_consent_accepted}
                        onCheckedChange={(v) => update("informed_consent_accepted", Boolean(v))}
                      />
                      <Label htmlFor="informed-consent" className="cursor-pointer text-xs leading-relaxed text-muted-foreground">
                        Ho letto e compreso le informazioni preliminari sul consenso informato e chiedo di essere ricontattato/a per fissare il primo
                        colloquio.
                      </Label>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Checkbox id="privacy" checked={form.privacy_accepted} onCheckedChange={(v) => update("privacy_accepted", Boolean(v))} />
                    <Label htmlFor="privacy" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                      Ho letto e accetto la{" "}
                      <Link to="/privacy" className="underline hover:text-primary">
                        Privacy Policy
                      </Link>
                      . Acconsento al trattamento dei miei dati personali ai sensi del GDPR (Reg. UE 2016/679) per la gestione della richiesta di appuntamento.
                    </Label>
                  </div>
                  <Button
                    type="submit"
                    disabled={sending}
                    size="lg"
                    className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-full px-8 gap-2 w-full sm:w-auto"
                  >
                    {sending ? (
                      "Invio in corso..."
                    ) : (
                      <>
                        <Send className="w-4 h-4" /> Invia Richiesta
                      </>
                    )}
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

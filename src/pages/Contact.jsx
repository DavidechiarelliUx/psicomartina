import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Download, Mail, Phone, MapPin, Clock, CheckCircle2, FileText, Send } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import SectionHeading from "../components/shared/SectionHeading";
import { apiFetch } from "@/api/client";
import SEOHead from "@/components/SEOHead";
import { getCanonicalUrl, seoPages } from "@/config/seo";

const studioEmail = import.meta.env.VITE_STUDIO_EMAIL;
const studioPhone = import.meta.env.VITE_STUDIO_PHONE;
const studioAddress = import.meta.env.VITE_STUDIO_ADDRESS || "Via Cairo Montenotte 55, Roma";
const studioMapUrl = `https://www.google.com/maps?q=${encodeURIComponent(studioAddress)}&output=embed`;

const emptyConsent = {
  subject_type: "adult",
  client_full_name: "",
  client_email: "",
  phone: "",
  fiscal_code: "",
  birth_place: "",
  birth_date: "",
  residence_city: "",
  residence_address: "",
  residence_number: "",
  service_kind: "consulenza",
  service_other: "",
  minor_full_name: "",
  tutor_full_name: "",
  second_tutor_full_name: "",
  compensation_amount: "45",
  tax_regime: "Operazione esente IVA ex art.10, comma 1, n.18 del D.P.R. n.633/1972",
  payment_method: "Bonifico bancario",
  signature_box: "adult",
  personal_data_consent_choice: "granted",
  privacy_consent: false,
  terms_accepted: false,
  signed_name: "",
};

function getInitialForm() {
  return {
    client_name: "",
    client_email: "",
    client_phone: "",
    date: "",
    time_slot: "",
    service_type: "",
    notes: "",
    privacy_accepted: false,
    informed_consent_accepted: false,
    consent: { ...emptyConsent },
  };
}

export default function Contact() {
  const [visibleMonth, setVisibleMonth] = useState(new Date());
  const [form, setForm] = useState(getInitialForm);
  const [sending, setSending] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [sent, setSent] = useState(false);
  const monthKey = format(visibleMonth, "yyyy-MM");
  const { data: availability, isFetching: availabilityLoading } = useQuery({
    queryKey: ["availability", monthKey],
    queryFn: () => apiFetch(`/api/availability?month=${monthKey}`),
  });
  const bookedSlots = availability?.booked || {};
  const selectedDay = form.date ? availability?.days?.[form.date] : null;
  const selectedBookedSlots = form.date ? selectedDay?.booked || bookedSlots[form.date] || [] : [];
  const timeSlots = selectedDay?.slots || [];
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

  const openConsentPreview = async () => {
    setPreviewLoading(true);
    try {
      const response = await fetch("/api/consents/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "Non riesco a generare l'anteprima del consenso.");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setPreviewLoading(false);
    }
  };

  const closePreview = () => {
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  };

  const update = (field, value) =>
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "client_name") {
        const isMinor = prev.consent.subject_type === "minor";
        const shouldSyncName = !prev.consent.client_full_name || prev.consent.client_full_name === prev.client_name;
        const shouldSyncMinor = !prev.consent.minor_full_name || prev.consent.minor_full_name === prev.client_name;
        const shouldSyncSignature = !prev.consent.signed_name || prev.consent.signed_name === prev.client_name;
        next.consent = {
          ...next.consent,
          client_full_name: shouldSyncName ? value : next.consent.client_full_name,
          minor_full_name: isMinor && shouldSyncMinor ? value : next.consent.minor_full_name,
          signed_name: shouldSyncSignature ? value : next.consent.signed_name,
        };
      }
      if (field === "client_email") {
        const shouldSyncEmail = !prev.consent.client_email || prev.consent.client_email === prev.client_email;
        next.consent = { ...next.consent, client_email: shouldSyncEmail ? value : next.consent.client_email };
      }
      if (field === "client_phone") {
        const shouldSyncPhone = !prev.consent.phone || prev.consent.phone === prev.client_phone;
        next.consent = { ...next.consent, phone: shouldSyncPhone ? value : next.consent.phone };
      }
      if (field === "privacy_accepted") {
        next.consent = { ...next.consent, privacy_consent: Boolean(value) };
      }
      return next;
    });
  const updateConsent = (field, value) =>
    setForm((prev) => {
      const consent = { ...prev.consent, [field]: value };
      if (field === "subject_type") {
        consent.signature_box = value;
        // Selezionando "Minorenne", precompila il nome del minore con quello dell'assistito digitato.
        if (value === "minor" && !consent.minor_full_name) {
          consent.minor_full_name = prev.consent.client_full_name || prev.client_name || "";
        }
      }
      return { ...prev, consent };
    });
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
            <div className="order-2 space-y-6 lg:order-1 lg:col-span-1">
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
                      <p>{studioAddress}</p>
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

              <div className="overflow-hidden rounded-2xl border border-border bg-card">
                <div className="p-4">
                  <p className="font-heading text-lg font-semibold text-foreground">Dove ricevo</p>
                  <p className="mt-1 text-sm text-muted-foreground">{studioAddress}</p>
                </div>
                <iframe
                  title="Mappa dello studio"
                  src={studioMapUrl}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="h-64 w-full border-0"
                />
              </div>
            </div>

            {/* Form */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="order-1 lg:order-2 lg:col-span-2">
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
                      setForm(getInitialForm());
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
                          disabled={(date) => {
                            const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));
                            const dateKey = format(date, "yyyy-MM-dd");
                            const dayAvailability = availability?.days?.[dateKey];
                            return isPast || (Boolean(availability?.days) && !dayAvailability?.open);
                          }}
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
                            {timeSlots.length === 0 && <p className="mt-3 text-xs text-muted-foreground">Lo studio è chiuso in questo giorno.</p>}
                            {timeSlots.length > 0 && availableSlots.length === 0 && <p className="mt-3 text-xs text-muted-foreground">Nessuna fascia disponibile in questo giorno.</p>}
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
                          Compila i dati necessari per generare il modulo di consenso informato. Il PDF sarà creato automaticamente e allegato alla richiesta
                          nella dashboard dello studio.
                        </p>
                      </div>
                    </div>
                    <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Per chi è il consenso *</Label>
                        <Select value={form.consent.subject_type} onValueChange={(v) => updateConsent("subject_type", v)}>
                          <SelectTrigger className="bg-background">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="adult">Adulto</SelectItem>
                            <SelectItem value="minor">Minorenne</SelectItem>
                            <SelectItem value="protected_person">Persona sotto tutela</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Tipo prestazione *</Label>
                        <Select value={form.consent.service_kind} onValueChange={(v) => updateConsent("service_kind", v)}>
                          <SelectTrigger className="bg-background">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="consulenza">Consulenza</SelectItem>
                            <SelectItem value="sostegno_psicologico">Sostegno psicologico</SelectItem>
                            <SelectItem value="altro">Altro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {form.consent.service_kind === "altro" && (
                        <div className="space-y-2 sm:col-span-2">
                          <Label htmlFor="consent-service-other">Specifica prestazione</Label>
                          <Input
                            id="consent-service-other"
                            value={form.consent.service_other}
                            onChange={(e) => updateConsent("service_other", e.target.value)}
                            placeholder="Es. valutazione, screening, colloquio conoscitivo..."
                            className="bg-background"
                          />
                        </div>
                      )}
                      {(form.consent.subject_type === "minor" || form.consent.subject_type === "protected_person") && (
                        <>
                          {form.consent.subject_type === "minor" && (
                            <div className="space-y-2 sm:col-span-2">
                              <Label htmlFor="minor-name">Nome e cognome del minore *</Label>
                              <Input
                                id="minor-name"
                                value={form.consent.minor_full_name}
                                onChange={(e) => updateConsent("minor_full_name", e.target.value)}
                                placeholder="Nome e cognome"
                                className="bg-background"
                              />
                            </div>
                          )}
                          <div className="space-y-2">
                            <Label htmlFor="tutor-name">
                              {form.consent.subject_type === "minor" ? "Madre (o esercente la responsabilità genitoriale) *" : "Tutore *"}
                            </Label>
                            <Input
                              id="tutor-name"
                              value={form.consent.tutor_full_name}
                              onChange={(e) => updateConsent("tutor_full_name", e.target.value)}
                              placeholder="Nome e cognome"
                              className="bg-background"
                            />
                          </div>
                      {form.consent.subject_type === "minor" && (
                            <div className="space-y-2">
                              <Label htmlFor="second-tutor-name">Padre (o esercente la responsabilità genitoriale) *</Label>
                              <Input
                                id="second-tutor-name"
                                required
                                value={form.consent.second_tutor_full_name}
                                onChange={(e) => updateConsent("second_tutor_full_name", e.target.value)}
                                placeholder="Nome e cognome"
                                className="bg-background"
                              />
                            </div>
                          )}
                        </>
                      )}
                      <div className="space-y-2">
                        <Label htmlFor="consent-name">Nome e cognome assistito/a *</Label>
                        <Input
                          id="consent-name"
                          value={form.consent.client_full_name}
                          onChange={(e) => updateConsent("client_full_name", e.target.value)}
                          placeholder="Nome e cognome"
                          className="bg-background"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="consent-email">Email *</Label>
                        <Input
                          id="consent-email"
                          type="email"
                          value={form.consent.client_email}
                          onChange={(e) => updateConsent("client_email", e.target.value)}
                          placeholder="email@example.com"
                          className="bg-background"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="consent-phone">Telefono</Label>
                        <Input
                          id="consent-phone"
                          value={form.consent.phone}
                          onChange={(e) => updateConsent("phone", e.target.value)}
                          placeholder="+39 ..."
                          className="bg-background"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="fiscal-code">Codice fiscale *</Label>
                        <Input
                          id="fiscal-code"
                          value={form.consent.fiscal_code}
                          onChange={(e) => updateConsent("fiscal_code", e.target.value.toUpperCase())}
                          placeholder="Codice fiscale"
                          className="bg-background uppercase"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="birth-place">Luogo di nascita *</Label>
                        <Input
                          id="birth-place"
                          value={form.consent.birth_place}
                          onChange={(e) => updateConsent("birth_place", e.target.value)}
                          placeholder="Comune di nascita"
                          className="bg-background"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="birth-date">Data di nascita *</Label>
                        <Input
                          id="birth-date"
                          type="date"
                          value={form.consent.birth_date}
                          onChange={(e) => updateConsent("birth_date", e.target.value)}
                          className="bg-background"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="residence-city">Città di residenza *</Label>
                        <Input
                          id="residence-city"
                          value={form.consent.residence_city}
                          onChange={(e) => updateConsent("residence_city", e.target.value)}
                          placeholder="Città"
                          className="bg-background"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="residence-address">Via/Piazza *</Label>
                        <Input
                          id="residence-address"
                          value={form.consent.residence_address}
                          onChange={(e) => updateConsent("residence_address", e.target.value)}
                          placeholder="Indirizzo"
                          className="bg-background"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="residence-number">Numero civico</Label>
                        <Input
                          id="residence-number"
                          value={form.consent.residence_number}
                          onChange={(e) => updateConsent("residence_number", e.target.value)}
                          placeholder="N."
                          className="bg-background"
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label>Modalità di pagamento *</Label>
                        <Select value={form.consent.payment_method} onValueChange={(v) => updateConsent("payment_method", v)}>
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Seleziona la modalità" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Bonifico bancario">Bonifico bancario</SelectItem>
                            <SelectItem value="Carta di credito/Bancomat">Carta di credito/Bancomat</SelectItem>
                            <SelectItem value="Assegno">Assegno</SelectItem>
                            <SelectItem value="Bonifico bancario, carta/bancomat o altro metodo tracciabile concordato con lo studio.">
                              Altro metodo tracciabile concordato con lo studio
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="compensation-amount">Compenso per incontro *</Label>
                        <Input
                          id="compensation-amount"
                          value={form.consent.compensation_amount}
                          onChange={(e) => updateConsent("compensation_amount", e.target.value)}
                          placeholder="45"
                          className="bg-background"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Riquadro sottoscrizione *</Label>
                        <Select value={form.consent.signature_box} onValueChange={(v) => updateConsent("signature_box", v)}>
                          <SelectTrigger className="bg-background">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="adult">Adulti</SelectItem>
                            <SelectItem value="minor">Minorenni</SelectItem>
                            <SelectItem value="protected_person">Persone sotto tutela</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="tax-regime">Regime fiscale / note sul compenso</Label>
                        <Input
                          id="tax-regime"
                          value={form.consent.tax_regime}
                          onChange={(e) => updateConsent("tax_regime", e.target.value)}
                          className="bg-background"
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label>Consenso trattamento dati personali *</Label>
                        <Select value={form.consent.personal_data_consent_choice} onValueChange={(v) => updateConsent("personal_data_consent_choice", v)}>
                          <SelectTrigger className="bg-background">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="granted">Fornisce il consenso</SelectItem>
                            <SelectItem value="denied">Non fornisce il consenso</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="signed-name">Firma digitata *</Label>
                        <Input
                          id="signed-name"
                          value={form.consent.signed_name}
                          onChange={(e) => updateConsent("signed_name", e.target.value)}
                          placeholder="Scrivi nome e cognome per confermare il consenso"
                          className="bg-background"
                        />
                      </div>
                    </div>
                    <div className="mt-5 rounded-xl border border-border bg-background/70 p-4">
                      <p className="text-sm font-medium text-foreground">Controlla il modulo prima dell'invio</p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        Apri il PDF precompilato. Se vuoi cambiare qualcosa, modifica i campi e rigenera il PDF prima di inviare la richiesta.
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={previewLoading}
                        onClick={openConsentPreview}
                        className="mt-3 gap-2 rounded-full"
                      >
                        <Download className="h-4 w-4" />
                        {previewLoading ? "Genero PDF..." : "Apri PDF consenso"}
                      </Button>
                    </div>
                    <Dialog open={Boolean(previewUrl)} onOpenChange={(open) => { if (!open) closePreview(); }}>
                      <DialogContent className="max-w-4xl">
                        <DialogHeader>
                          <DialogTitle>Anteprima consenso informato</DialogTitle>
                        </DialogHeader>
                        {previewUrl && (
                          <iframe
                            title="Anteprima consenso informato"
                            src={previewUrl}
                            className="h-[75vh] w-full rounded-md border border-border"
                          />
                        )}
                      </DialogContent>
                    </Dialog>
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="informed-consent"
                        checked={form.informed_consent_accepted}
                        onCheckedChange={(v) => {
                          update("informed_consent_accepted", Boolean(v));
                          updateConsent("terms_accepted", Boolean(v));
                        }}
                      />
                      <Label htmlFor="informed-consent" className="cursor-pointer text-xs leading-relaxed text-muted-foreground">
                        Dichiaro di aver letto e compreso il consenso informato, accetto le condizioni della prestazione psicologica e chiedo di essere
                        ricontattato/a per fissare il colloquio.
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

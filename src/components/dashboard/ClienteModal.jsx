import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Mail, Phone, Send, X } from "lucide-react";
import { apiFetch } from "@/api/client";

const STATUS_LABELS = {
  pending: "In attesa",
  confirmed: "Confermato",
  completed: "Completato",
  cancelled: "Cancellato",
  new: "Nuovo",
  read: "Letto",
  replied: "Risposto",
};

const SERVICE_LABELS = {
  primo_colloquio: "Primo colloquio",
  sostegno_psicologico: "Sostegno psicologico",
  potenziamento_cognitivo: "Potenziamento cognitivo",
  screening_dsa: "Screening DSA",
  ansia: "Ansia e stress",
  eta_evolutiva: "Età evolutiva",
  genitorialita: "Genitorialità",
  relazioni: "Relazioni",
  autostima: "Autostima",
  traumi: "Traumi",
};

function splitName(value = "") {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  return {
    nome: parts[0] || value || "Cliente",
    cognome: parts.slice(1).join(" "),
  };
}

function normalizeCliente(cliente) {
  const fallbackName = splitName(cliente.client_name || cliente.name || "");

  return {
    id: cliente.id,
    nome: cliente.nome || fallbackName.nome,
    cognome: cliente.cognome || fallbackName.cognome,
    email: cliente.email || cliente.client_email || "",
    telefono: cliente.telefono || cliente.client_phone || cliente.phone || "",
    servizio: cliente.servizio || cliente.service_label || SERVICE_LABELS[cliente.service_type] || cliente.service_type || "Contatto",
    data: cliente.data || cliente.date || cliente.created_at?.slice(0, 10) || "",
    ora: cliente.ora || cliente.time_slot || "",
    messaggio: cliente.messaggio || cliente.message || cliente.notes || "",
    stato: cliente.stato || cliente.status || "pending",
    consensoInformato: Boolean(cliente.informed_consent_accepted),
  };
}

export default function ClienteModal({ cliente, onClose }) {
  const normalized = useMemo(() => (cliente ? normalizeCliente(cliente) : null), [cliente]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [emailStatus, setEmailStatus] = useState("");

  useEffect(() => {
    if (!normalized) return undefined;

    setSubject("Conferma appuntamento - Studio Psicomartina");
    setBody(
      `Gentile ${normalized.nome},\n\nLe scriviamo in merito alla sua richiesta${normalized.data ? ` del ${normalized.data}` : ""}${
        normalized.ora ? ` alle ${normalized.ora}` : ""
      }.\n\nIn caso di necessita non esiti a contattarci.`
    );
    setEmailStatus("");

    const handleKey = (event) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [normalized, onClose]);

  if (!normalized) return null;

  const sendEmail = async () => {
    setEmailStatus("sending");

    try {
      await apiFetch("/api/email/send-to-client", {
        method: "POST",
        body: JSON.stringify({
          toEmail: normalized.email,
          toNome: normalized.nome,
          subject,
          body,
        }),
      });
      setEmailStatus("ok");
    } catch {
      setEmailStatus("error");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="cliente-modal-title"
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Chiudi dettaglio cliente"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="pr-10">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">Dettaglio cliente</p>
          <h2 id="cliente-modal-title" className="mt-2 font-heading text-2xl font-semibold text-foreground">
            {normalized.nome} {normalized.cognome}
          </h2>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <a
            href={`mailto:${normalized.email}`}
            className="rounded-xl border border-border bg-background p-4 text-sm transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Mail className="mb-2 h-4 w-4 text-primary" />
            <span className="block text-xs text-muted-foreground">Email</span>
            <span className="break-all font-medium text-foreground">{normalized.email || "Non indicata"}</span>
          </a>
          <div className="rounded-xl border border-border bg-background p-4 text-sm">
            <Phone className="mb-2 h-4 w-4 text-primary" />
            <span className="block text-xs text-muted-foreground">Telefono</span>
            <span className="font-medium text-foreground">{normalized.telefono || "Non indicato"}</span>
          </div>
          <div className="rounded-xl border border-border bg-background p-4 text-sm">
            <CalendarDays className="mb-2 h-4 w-4 text-primary" />
            <span className="block text-xs text-muted-foreground">Appuntamento</span>
            <span className="font-medium text-foreground">
              {normalized.data || "Data da definire"} {normalized.ora ? `alle ${normalized.ora}` : ""}
            </span>
          </div>
          <div className="rounded-xl border border-border bg-background p-4 text-sm">
            <span className="block text-xs text-muted-foreground">Servizio</span>
            <span className="mt-2 block font-medium text-foreground">{normalized.servizio}</span>
            <span className="mt-2 inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
              {STATUS_LABELS[normalized.stato] || normalized.stato}
            </span>
          </div>
          <div className="rounded-xl border border-border bg-background p-4 text-sm sm:col-span-2">
            <span className="block text-xs text-muted-foreground">Consenso informato</span>
            <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${normalized.consensoInformato ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
              {normalized.consensoInformato ? "Accettato" : "Non registrato"}
            </span>
          </div>
        </div>

        {normalized.messaggio && (
          <div className="mt-4 rounded-xl bg-muted/60 p-4">
            <p className="text-xs font-medium text-foreground">Messaggio originale</p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{normalized.messaggio}</p>
          </div>
        )}

        <div className="mt-6 border-t border-border pt-6">
          <h3 className="font-heading text-lg font-semibold text-foreground">Invia email al cliente</h3>
          <div className="mt-4 space-y-3">
            <label className="block text-sm font-medium text-foreground">
              Oggetto
              <input
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </label>
            <label className="block text-sm font-medium text-foreground">
              Testo email
              <textarea
                value={body}
                onChange={(event) => setBody(event.target.value)}
                rows={6}
                className="mt-1 w-full resize-y rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </label>
            <button
              type="button"
              onClick={sendEmail}
              disabled={emailStatus === "sending" || !normalized.email}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Send className="h-4 w-4" />
              {emailStatus === "sending" ? "Invio in corso..." : "Invia email"}
            </button>
            {emailStatus === "ok" && <p className="text-center text-sm font-medium text-green-700">Email inviata con successo.</p>}
            {emailStatus === "error" && <p className="text-center text-sm font-medium text-red-700">Errore nell'invio. Controlla la configurazione SMTP.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from "react";
import { parseISO, format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, isToday } from "date-fns";
import { it } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ClienteModal from "../dashboard/ClienteModal";
import { apiFetch } from "@/api/client";

const STATUS_DOT = {
  pending: "bg-yellow-400",
  confirmed: "bg-blue-500",
  completed: "bg-gray-400",
  cancelled: "bg-red-400",
};

const STATUS_META = {
  pending: { label: "In attesa", className: "bg-yellow-100 text-yellow-800" },
  confirmed: { label: "Confermata", className: "bg-blue-100 text-blue-800" },
  completed: { label: "Conclusa", className: "bg-gray-100 text-gray-700" },
  cancelled: { label: "Annullata", className: "bg-red-100 text-red-800" },
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

export default function DashboardCalendar({ appointments }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [localAppointments, setLocalAppointments] = useState(appointments);
  const [pendingAction, setPendingAction] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  React.useEffect(() => setLocalAppointments(appointments), [appointments]);

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  // Pad start
  const firstDayOfWeek = (startOfMonth(currentMonth).getDay() + 6) % 7; // Mon=0
  const paddingDays = Array.from({ length: firstDayOfWeek });

  const sortedAppointments = [...localAppointments].sort((a, b) => {
    const aDone = ["completed", "cancelled"].includes(a.status) ? 1 : 0;
    const bDone = ["completed", "cancelled"].includes(b.status) ? 1 : 0;
    if (aDone !== bDone) return aDone - bDone;
    return `${a.date} ${a.time_slot}`.localeCompare(`${b.date} ${b.time_slot}`);
  });
  const filteredAppointments = statusFilter === "all" ? sortedAppointments : sortedAppointments.filter((a) => a.status === statusFilter);
  const getAppts = (day) => filteredAppointments.filter((a) => a.date && isSameDay(parseISO(a.date), day));

  const selectedAppts = selectedDay ? getAppts(selectedDay) : [];
  const counts = {
    all: localAppointments.length,
    pending: localAppointments.filter((a) => a.status === "pending").length,
    confirmed: localAppointments.filter((a) => a.status === "confirmed").length,
    completed: localAppointments.filter((a) => a.status === "completed").length,
    cancelled: localAppointments.filter((a) => a.status === "cancelled").length,
  };

  const patchAppointment = (updated) => {
    setLocalAppointments((items) => items.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)));
  };

  const applyStatus = async (appointment, status, sendConfirmationEmail = false) => {
    setLocalAppointments((items) => items.map((item) => (item.id === appointment.id ? { ...item, status } : item)));
    try {
      const updated = await apiFetch(`/api/bookings/stato?id=${encodeURIComponent(appointment.id)}`, {
        method: "PATCH",
        body: JSON.stringify({ stato: status, send_confirmation_email: sendConfirmationEmail }),
      });
      patchAppointment(updated);
      return updated;
    } catch (error) {
      setLocalAppointments(appointments);
      throw error;
    }
  };

  const updateStatus = async (appointment, status) => {
    if (status === "confirmed" && appointment.status !== "confirmed") {
      setPendingAction({ type: "confirm-status", appointment, status });
      return;
    }
    try {
      await applyStatus(appointment, status);
    } catch (error) {
      setPendingAction({ type: "error", title: "Aggiornamento non riuscito", message: error.message });
    }
  };

  const sendConfirmation = (appointment) => {
    setPendingAction({ type: "send-confirmation", appointment });
  };

  const sendReviewRequest = (appointment) => {
    setPendingAction({ type: "send-review", appointment });
  };

  const runAction = async (mode) => {
    if (!pendingAction || pendingAction.type === "error") return;
    setActionLoading(true);
    try {
      if (pendingAction.type === "confirm-status") {
        await applyStatus(pendingAction.appointment, pendingAction.status, mode === "send");
      }
      if (pendingAction.type === "send-confirmation") {
        const updated = await apiFetch("/api/booking-action", {
          method: "POST",
          body: JSON.stringify({ id: pendingAction.appointment.id, action: "send-confirmation" }),
        });
        patchAppointment(updated);
      }
      if (pendingAction.type === "send-review") {
        const updated = await apiFetch("/api/booking-action", {
          method: "POST",
          body: JSON.stringify({ id: pendingAction.appointment.id, action: "send-review-request" }),
        });
        patchAppointment(updated);
      }
      setPendingAction(null);
    } catch (error) {
      setPendingAction({ type: "error", title: "Operazione non riuscita", message: error.message });
    } finally {
      setActionLoading(false);
    }
  };

  const actionCopy = pendingAction?.type === "confirm-status"
    ? {
        title: "Confermare l'appuntamento?",
        message: pendingAction.appointment.confirmation_email_sent
          ? "Questo cliente ha già ricevuto una conferma. Vuoi aggiornare lo stato e inviare una nuova email di conferma?"
          : "Puoi confermare l'appuntamento e decidere se inviare subito l'email di conferma al cliente.",
      }
    : pendingAction?.type === "send-confirmation"
      ? {
          title: pendingAction.appointment.confirmation_email_sent ? "Reinviare la conferma?" : "Inviare conferma appuntamento?",
          message: pendingAction.appointment.confirmation_email_sent
            ? "La conferma risulta già inviata. Vuoi inviarne un'altra?"
            : "Il cliente riceverà un'email con data, orario e servizio confermati.",
        }
      : pendingAction?.type === "send-review"
        ? {
            title: pendingAction.appointment.review_request_sent ? "Reinviare richiesta recensione?" : "Inviare richiesta recensione?",
            message: pendingAction.appointment.review_request_sent
              ? "La richiesta recensione risulta già inviata. Vuoi inviarne un'altra?"
              : "Il cliente riceverà un link personale per lasciare una recensione, che resterà nascosta finché non verrà approvata.",
          }
        : pendingAction?.type === "error"
          ? { title: pendingAction.title, message: pendingAction.message }
          : null;

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-heading text-lg font-semibold text-foreground">Calendario Appuntamenti</h3>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium text-foreground min-w-[120px] text-center capitalize">{format(currentMonth, "MMMM yyyy", { locale: it })}</span>
          <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {[
          ["all", `Tutte (${counts.all})`, "bg-primary/10 text-primary"],
          ["pending", `In attesa (${counts.pending})`, STATUS_META.pending.className],
          ["confirmed", `Confermate (${counts.confirmed})`, STATUS_META.confirmed.className],
          ["completed", `Concluse (${counts.completed})`, STATUS_META.completed.className],
          ["cancelled", `Annullate (${counts.cancelled})`, STATUS_META.cancelled.className],
        ].map(([value, label, className]) => (
          <button
            key={value}
            type="button"
            onClick={() => setStatusFilter(value)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${statusFilter === value ? className : "border border-border text-muted-foreground hover:bg-muted"}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"].map((d) => (
          <div key={d} className="text-center text-[11px] font-medium text-muted-foreground py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {paddingDays.map((_, i) => (
          <div key={`pad-${i}`} />
        ))}
        {days.map((day) => {
          const dayAppts = getAppts(day);
          const isSelected = selectedDay && isSameDay(day, selectedDay);
          return (
            <button
              key={day.toISOString()}
              onClick={() => setSelectedDay(isSelected ? null : day)}
              className={`
                relative flex flex-col items-center justify-start pt-1.5 pb-1 min-h-[52px] rounded-xl text-xs transition-all
                ${isSelected ? "bg-primary text-primary-foreground" : "hover:bg-muted"}
                ${isToday(day) && !isSelected ? "ring-2 ring-primary" : ""}
                ${!isSameMonth(day, currentMonth) ? "opacity-30" : ""}
              `}
            >
              <span className={`font-medium ${isSelected ? "text-primary-foreground" : "text-foreground"}`}>{format(day, "d")}</span>
              {dayAppts.length > 0 && (
                <div className="flex gap-0.5 mt-1 flex-wrap justify-center">
                  {dayAppts.slice(0, 3).map((a, i) => (
                    <span
                      key={i}
                      className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-primary-foreground/70" : STATUS_DOT[a.status] || "bg-muted-foreground"}`}
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Appuntamenti del giorno selezionato */}
      {selectedDay && (
        <div className="mt-6 border-t border-border pt-5">
          <h4 className="text-sm font-medium text-foreground mb-3">
            {format(selectedDay, "EEEE d MMMM", { locale: it })} — {selectedAppts.length} appuntament{selectedAppts.length === 1 ? "o" : "i"}
          </h4>
          {selectedAppts.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nessun appuntamento in questo giorno.</p>
          ) : (
            <div className="space-y-3">
              {selectedAppts
                .sort((a, b) => a.time_slot?.localeCompare(b.time_slot))
                .map((a) => (
                  <article
                    key={a.id}
                    className="grid w-full gap-4 rounded-xl bg-muted/50 p-4 text-left transition-colors hover:bg-muted sm:grid-cols-[minmax(0,1fr)_190px]"
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedCliente(a)}
                      className="flex min-w-0 items-start gap-3 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${STATUS_DOT[a.status] || "bg-muted-foreground"}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">{a.client_name}</p>
                        <p className="break-words text-xs text-muted-foreground">{a.client_email}</p>
                        {a.client_phone && <p className="text-xs text-muted-foreground">{a.client_phone}</p>}
                        {a.service_type && <p className="text-xs text-primary mt-1">{SERVICE_LABELS[a.service_type] || a.service_type}</p>}
                        {a.notes && <p className="mt-1 break-words text-xs italic text-muted-foreground">"{a.notes}"</p>}
                      </div>
                    </button>
                    <div className="flex w-full flex-col items-stretch gap-2 sm:items-end sm:text-right">
                      <p className="text-sm font-semibold text-foreground">{a.time_slot}</p>
                      <span
                        className={`inline-flex w-fit rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          STATUS_META[a.status]?.className || "bg-muted text-muted-foreground"
                        }`}
                      >
                        {STATUS_META[a.status]?.label || a.status}
                      </span>
                      {a.confirmation_email_sent && (
                        <span className="mt-1 block rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-800">
                          Conferma inviata{a.confirmation_email_count > 1 ? ` x${a.confirmation_email_count}` : ""}
                        </span>
                      )}
                      {a.review_request_sent && (
                        <span className="mt-1 block rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-medium text-accent-foreground">
                          Recensione inviata{a.review_request_count > 1 ? ` x${a.review_request_count}` : ""}
                        </span>
                      )}
                      <select
                        value={a.status}
                        onChange={(event) => updateStatus(a, event.target.value)}
                        className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm sm:h-9 sm:w-[190px] sm:text-xs"
                      >
                        <option value="pending">In attesa</option>
                        <option value="confirmed">Confermata</option>
                        <option value="completed">Conclusa</option>
                        <option value="cancelled">Annullata</option>
                      </select>
                      {a.status === "confirmed" && (
                        <button
                          type="button"
                          onClick={(event) => {
                            sendConfirmation(a);
                          }}
                          className="h-10 w-full rounded-lg border border-primary/30 px-3 text-sm font-medium text-primary hover:bg-primary/5 sm:h-9 sm:w-[190px] sm:text-xs"
                        >
                          {a.confirmation_email_sent ? "Reinvia conferma" : "Invia conferma"}
                        </button>
                      )}
                      {a.status === "completed" && (
                        <button
                          type="button"
                          onClick={(event) => {
                            sendReviewRequest(a);
                          }}
                          className="h-10 w-full rounded-lg border border-accent/50 px-3 text-sm font-medium text-foreground hover:bg-accent/10 sm:h-9 sm:w-[190px] sm:text-xs"
                        >
                          {a.review_request_sent ? "Reinvia recensione" : "Invia recensione"}
                        </button>
                      )}
                    </div>
                  </article>
                ))}
            </div>
          )}
        </div>
      )}
      {selectedCliente && <ClienteModal cliente={selectedCliente} onClose={() => setSelectedCliente(null)} />}
      <Dialog open={Boolean(pendingAction)} onOpenChange={(open) => !open && !actionLoading && setPendingAction(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl text-foreground">{actionCopy?.title}</DialogTitle>
            <DialogDescription className="leading-relaxed">{actionCopy?.message}</DialogDescription>
          </DialogHeader>
          {pendingAction?.appointment && (
            <div className="rounded-xl border border-border bg-muted/50 p-4 text-sm">
              <p className="font-medium text-foreground">{pendingAction.appointment.client_name}</p>
              <p className="mt-1 text-muted-foreground">
                {pendingAction.appointment.date} alle {pendingAction.appointment.time_slot}
              </p>
            </div>
          )}
          <DialogFooter>
            {pendingAction?.type === "error" ? (
              <Button type="button" onClick={() => setPendingAction(null)} className="rounded-full">
                Ho capito
              </Button>
            ) : pendingAction?.type === "confirm-status" ? (
              <>
                <Button type="button" variant="outline" disabled={actionLoading} onClick={() => setPendingAction(null)} className="rounded-full">
                  Annulla
                </Button>
                <Button type="button" variant="outline" disabled={actionLoading} onClick={() => runAction("no-send")} className="rounded-full">
                  Conferma senza email
                </Button>
                <Button type="button" disabled={actionLoading} onClick={() => runAction("send")} className="rounded-full">
                  {actionLoading ? "Invio..." : "Conferma e invia email"}
                </Button>
              </>
            ) : (
              <>
                <Button type="button" variant="outline" disabled={actionLoading} onClick={() => setPendingAction(null)} className="rounded-full">
                  Annulla
                </Button>
                <Button type="button" disabled={actionLoading} onClick={() => runAction("send")} className="rounded-full">
                  {actionLoading ? "Invio..." : "Invia"}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

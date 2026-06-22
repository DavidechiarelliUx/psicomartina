import React, { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, CheckCircle2, Save, CalendarX, Plus, Trash2 } from "lucide-react";
import { apiFetch } from "@/api/client";
import { LOCATIONS, DEFAULT_LOCATION } from "@/config/locations";

const DAYS = ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"];
const DEFAULT_SCHEDULES = DAYS.map((_, day) => ({
  day_of_week: day,
  is_open: day > 0 && day < 6,
  opens_at: "09:00",
  closes_at: "19:00",
  slot_minutes: 60,
}));

export default function BookingHoursSettings() {
  const queryClient = useQueryClient();
  const [location, setLocation] = useState(DEFAULT_LOCATION);
  const { data, isLoading } = useQuery({
    queryKey: ["booking-schedules", location],
    queryFn: () => apiFetch(`/api/booking-schedules?location=${encodeURIComponent(location)}`),
  });
  const [schedules, setSchedules] = useState(DEFAULT_SCHEDULES);
  const [general, setGeneral] = useState({ opens_at: "09:00", closes_at: "19:00", slot_minutes: 60 });
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [newClosure, setNewClosure] = useState("");

  const { data: closuresData } = useQuery({
    queryKey: ["booking-closures"],
    queryFn: () => apiFetch("/api/booking-closures"),
  });
  const closures = closuresData?.closures || [];

  const addClosure = async () => {
    if (!newClosure) return;
    try {
      await apiFetch("/api/booking-closures", { method: "POST", body: JSON.stringify({ date: newClosure }) });
      setNewClosure("");
      queryClient.invalidateQueries({ queryKey: ["booking-closures"] });
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey?.[0] === "availability" });
    } catch (error) {
      setStatus(error.message || "Errore durante l'aggiunta della chiusura.");
    }
  };

  const removeClosure = async (date) => {
    try {
      await apiFetch(`/api/booking-closures?date=${encodeURIComponent(date)}`, { method: "DELETE" });
      queryClient.invalidateQueries({ queryKey: ["booking-closures"] });
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey?.[0] === "availability" });
    } catch (error) {
      setStatus(error.message || "Errore durante la rimozione della chiusura.");
    }
  };

  useEffect(() => {
    if (data?.schedules?.length) {
      setSchedules(data.schedules);
      const firstOpen = data.schedules.find((item) => item.is_open) || data.schedules[0];
      setGeneral({
        opens_at: firstOpen.opens_at,
        closes_at: firstOpen.closes_at,
        slot_minutes: firstOpen.slot_minutes,
      });
    }
  }, [data]);

  const updateDay = (day, patch) => {
    setSchedules((items) => items.map((item) => (item.day_of_week === day ? { ...item, ...patch } : item)));
  };

  const applyGeneralToOpenDays = () => {
    setSchedules((items) => items.map((item) => (item.is_open ? { ...item, ...general } : item)));
  };

  const save = async () => {
    setSaving(true);
    setStatus("");
    try {
      await apiFetch("/api/booking-schedules", {
        method: "PUT",
        body: JSON.stringify({ location, schedules }),
      });
      setStatus("Orari salvati.");
      queryClient.invalidateQueries({ queryKey: ["booking-schedules"] });
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey?.[0] === "availability" });
    } catch (error) {
      setStatus(error.message || "Errore durante il salvataggio.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-primary">
            <CalendarClock className="h-5 w-5" />
            <p className="text-xs font-semibold uppercase tracking-[0.16em]">Prenotazioni</p>
          </div>
          <h3 className="font-heading text-xl font-semibold text-foreground">Orari disponibilità</h3>
          <p className="mt-1 text-sm text-muted-foreground">Gestisci giorni aperti, chiusure e fasce orarie mostrate nella pagina Prenota.</p>
        </div>
        <button
          type="button"
          onClick={save}
          disabled={saving || isLoading}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {saving ? "Salvataggio..." : "Salva orari"}
        </button>
      </div>

      {LOCATIONS.length > 1 && (
        <div className="mb-5 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {LOCATIONS.map((loc) => (
            <button
              key={loc.code}
              type="button"
              title={loc.label}
              onClick={() => {
                setStatus("");
                setLocation(loc.code);
              }}
              className={`w-full rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${
                location === loc.code ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground hover:bg-muted"
              }`}
            >
              {loc.short}
            </button>
          ))}
        </div>
      )}

      <div className="mb-5 rounded-xl border border-border bg-background p-4">
        <p className="mb-3 text-sm font-semibold text-foreground">Orario generale</p>
        <div className="grid gap-3 sm:grid-cols-4">
          <TimeField label="Apre" value={general.opens_at} onChange={(value) => setGeneral((prev) => ({ ...prev, opens_at: value }))} />
          <TimeField label="Chiude" value={general.closes_at} onChange={(value) => setGeneral((prev) => ({ ...prev, closes_at: value }))} />
          <label className="block text-xs font-medium text-muted-foreground">
            Durata slot
            <select
              value={general.slot_minutes}
              onChange={(event) => setGeneral((prev) => ({ ...prev, slot_minutes: Number(event.target.value) }))}
              className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
            >
              {[30, 45, 60, 90].map((value) => (
                <option key={value} value={value}>
                  {value} min
                </option>
              ))}
            </select>
          </label>
          <button type="button" onClick={applyGeneralToOpenDays} className="mt-5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted sm:mt-auto">
            Applica agli aperti
          </button>
        </div>
      </div>

      <div className="grid gap-3">
        {schedules.map((item) => (
          <div key={item.day_of_week} className={`rounded-xl border p-4 ${item.is_open ? "border-border bg-background" : "border-border bg-muted/40"}`}>
            <label className="mb-3 flex items-center gap-3 text-sm font-medium text-foreground">
              <input type="checkbox" checked={item.is_open} onChange={(event) => updateDay(item.day_of_week, { is_open: event.target.checked })} className="h-4 w-4 accent-primary" />
              <span>{DAYS[item.day_of_week]}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs ${item.is_open ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>{item.is_open ? "Aperto" : "Chiuso"}</span>
            </label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <TimeField label="Apre" value={item.opens_at} disabled={!item.is_open} onChange={(value) => updateDay(item.day_of_week, { opens_at: value })} />
              <TimeField label="Chiude" value={item.closes_at} disabled={!item.is_open} onChange={(value) => updateDay(item.day_of_week, { closes_at: value })} />
              <label className="col-span-2 block text-xs font-medium text-muted-foreground sm:col-span-1">
                Durata slot
                <select
                  value={item.slot_minutes}
                  disabled={!item.is_open}
                  onChange={(event) => updateDay(item.day_of_week, { slot_minutes: Number(event.target.value) })}
                  className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground disabled:opacity-60"
                >
                  {[30, 45, 60, 90].map((value) => (
                    <option key={value} value={value}>
                      {value} min
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-xl border border-border bg-background p-4">
        <div className="mb-3 flex items-center gap-2 text-primary">
          <CalendarX className="h-4 w-4" />
          <p className="text-sm font-semibold text-foreground">Chiusure straordinarie</p>
        </div>
        <p className="mb-3 text-xs text-muted-foreground">
          Chiudi un giorno specifico (ferie, festività, imprevisti). Vale per tutte le sedi e nasconde quel giorno dal calendario di prenotazione.
        </p>
        <div className="flex flex-wrap items-end gap-2">
          <label className="block text-xs font-medium text-muted-foreground">
            Giorno da chiudere
            <input
              type="date"
              value={newClosure}
              onChange={(event) => setNewClosure(event.target.value)}
              className="mt-1 block rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
            />
          </label>
          <button
            type="button"
            onClick={addClosure}
            disabled={!newClosure}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" /> Aggiungi
          </button>
        </div>

        {closures.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2">
            {closures.map((c) => (
              <li key={c.date} className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm text-foreground">
                {new Date(`${c.date}T12:00:00`).toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" })}
                <button type="button" onClick={() => removeClosure(c.date)} className="text-muted-foreground hover:text-destructive" aria-label="Rimuovi chiusura">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {status && (
        <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
          <CheckCircle2 className="h-4 w-4" />
          {status}
        </p>
      )}
    </div>
  );
}

function TimeField({ label, value, onChange, disabled = false }) {
  return (
    <label className="block text-xs font-medium text-muted-foreground">
      {label}
      <input
        type="time"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 block w-full min-w-0 box-border rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground disabled:opacity-60"
      />
    </label>
  );
}

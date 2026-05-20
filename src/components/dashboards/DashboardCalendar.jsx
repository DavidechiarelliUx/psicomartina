import React, { useState } from "react";
import { parseISO, format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, isToday } from "date-fns";
import { it } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const STATUS_DOT = {
  pending: "bg-yellow-400",
  confirmed: "bg-green-500",
  cancelled: "bg-red-400",
};

const SERVICE_LABELS = {
  primo_colloquio: "Primo Colloquio",
  ansia: "Ansia e Stress",
  relazioni: "Relazioni",
  autostima: "Autostima",
  traumi: "Traumi",
};

export default function DashboardCalendar({ appointments }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  // Pad start
  const firstDayOfWeek = (startOfMonth(currentMonth).getDay() + 6) % 7; // Mon=0
  const paddingDays = Array.from({ length: firstDayOfWeek });

  const getAppts = (day) => appointments.filter((a) => a.date && isSameDay(parseISO(a.date), day));

  const selectedAppts = selectedDay ? getAppts(selectedDay) : [];

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
                  <div key={a.id} className="flex items-start justify-between gap-4 p-4 bg-muted/50 rounded-xl">
                    <div className="flex items-start gap-3">
                      <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${STATUS_DOT[a.status] || "bg-muted-foreground"}`} />
                      <div>
                        <p className="text-sm font-medium text-foreground">{a.client_name}</p>
                        <p className="text-xs text-muted-foreground">{a.client_email}</p>
                        {a.client_phone && <p className="text-xs text-muted-foreground">{a.client_phone}</p>}
                        {a.service_type && <p className="text-xs text-primary mt-1">{SERVICE_LABELS[a.service_type] || a.service_type}</p>}
                        {a.notes && <p className="text-xs text-muted-foreground mt-1 italic">"{a.notes}"</p>}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-foreground">{a.time_slot}</p>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${
                          a.status === "confirmed"
                            ? "bg-green-100 text-green-700"
                            : a.status === "cancelled"
                              ? "bg-red-100 text-red-700"
                              : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {a.status === "confirmed" ? "Confermato" : a.status === "cancelled" ? "Cancellato" : "In attesa"}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

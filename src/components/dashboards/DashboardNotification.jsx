import React from "react";
import { Calendar, MessageSquare } from "lucide-react";
import { parseISO, format, isAfter } from "date-fns";
import { it } from "date-fns/locale";

const STATUS_LABELS = { pending: "In attesa", confirmed: "Confermato", cancelled: "Cancellato" };
const STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function DashboardNotifications({ appointments, contacts }) {
  const now = new Date();
  const upcoming = appointments
    .filter((a) => isAfter(parseISO(a.date), now) && a.status !== "cancelled")
    .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime())
    .slice(0, 5);

  const newContacts = contacts.filter((c) => c.status === "new").slice(0, 5);

  return (
    <div className="bg-card border border-border rounded-2xl p-6 space-y-6 h-full max-h-[530px] min-h-0 overflow-y-auto">
      <h3 className="font-heading text-lg font-semibold text-foreground">Notifiche</h3>

      {/* Prossimi appuntamenti */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Prossimi appuntamenti</span>
        </div>
        {upcoming.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nessun appuntamento futuro</p>
        ) : (
          <div className="space-y-2.5">
            {upcoming.map((a) => (
              <div key={a.id} className="flex items-start justify-between gap-2 p-3 bg-muted/50 rounded-xl">
                <div>
                  <p className="text-xs font-medium text-foreground">{a.client_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(parseISO(a.date), "d MMM", { locale: it })} • {a.time_slot}
                  </p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[a.status] || "bg-muted text-muted-foreground"}`}>
                  {STATUS_LABELS[a.status] || a.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Nuovi contatti */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare className="w-4 h-4 text-accent" />
          <span className="text-sm font-medium text-foreground">Nuovi messaggi</span>
          {newContacts.length > 0 && (
            <span className="text-[10px] bg-accent text-accent-foreground px-1.5 py-0.5 rounded-full font-medium">{newContacts.length}</span>
          )}
        </div>
        {newContacts.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nessun nuovo messaggio</p>
        ) : (
          <div className="space-y-2.5">
            {newContacts.map((c) => (
              <div key={c.id} className="p-3 bg-muted/50 rounded-xl">
                <p className="text-xs font-medium text-foreground">{c.name}</p>
                <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{c.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

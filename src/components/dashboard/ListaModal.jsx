import { useEffect, useState } from "react";
import { X } from "lucide-react";
import ClienteModal from "./ClienteModal";

function getDisplayName(item) {
  return item.client_name || item.name || `${item.nome || ""} ${item.cognome || ""}`.trim() || "Cliente";
}

function getDisplayDate(item) {
  const date = item.date || item.data || item.created_at?.slice(0, 10) || "Data da definire";
  const time = item.time_slot || item.ora;
  return time ? `${date} alle ${time}` : date;
}

export default function ListaModal({ title, items = [], onClose }) {
  const [selectedCliente, setSelectedCliente] = useState(null);

  useEffect(() => {
    const handleKey = (event) => {
      if (event.key === "Escape" && !selectedCliente) onClose();
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, selectedCliente]);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-foreground/50 p-4 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="lista-modal-title"
    >
      <div
        className="relative w-full max-w-3xl max-h-[86vh] overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Chiudi lista"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="pr-10">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">Elenco</p>
          <h2 id="lista-modal-title" className="mt-2 font-heading text-2xl font-semibold text-foreground">
            {title}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{items.length} elementi trovati</p>
        </div>

        <div className="mt-6 overflow-hidden rounded-xl border border-border">
          {items.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">Nessun elemento disponibile per questo filtro.</p>
          ) : (
            <div className="divide-y divide-border">
              {items.map((item) => (
                <button
                  key={`${item.id}-${item.email || item.client_email || ""}`}
                  type="button"
                  onClick={() => setSelectedCliente(item)}
                  className="grid w-full gap-2 bg-background p-4 text-left text-sm transition-colors hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:grid-cols-[1.4fr_1.4fr_1fr]"
                >
                  <span>
                    <span className="block font-medium text-foreground">{getDisplayName(item)}</span>
                    <span className="block truncate text-xs text-muted-foreground">{item.email || item.client_email || "Email non indicata"}</span>
                  </span>
                  <span className="text-xs text-muted-foreground">{getDisplayDate(item)}</span>
                  <span className="text-xs font-medium text-primary">{item.service_label || item.service_type || item.status || "Dettaglio"}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedCliente && <ClienteModal cliente={selectedCliente} onClose={() => setSelectedCliente(null)} />}
    </div>
  );
}

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Pencil, Star, Trash2 } from "lucide-react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import SEOHead from "@/components/SEOHead";
import { apiFetch } from "@/api/client";

const CONFIG = {
  blog: { title: "Blog", endpoint: "/api/cms/blog", createLabel: "Pubblica articolo" },
  servizi: { title: "Servizi", endpoint: "/api/cms/servizi", createLabel: "Salva servizio" },
  recensioni: { title: "Recensioni", endpoint: "/api/cms/recensioni", createLabel: "Salva recensione" },
};

const today = () => new Date().toISOString().slice(0, 10);
const slugify = (value) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

function initialForm(type) {
  if (type === "blog") return { title: "", slug: "", category: "ansia", cover_image: "", content: "", published_at: today(), published: true };
  if (type === "servizi") return { title: "", short_description: "", description: "", icon: "", price: "", display_order: 0, active: true };
  return { name: "", text: "", rating: 5, date: today(), visible: true };
}

function itemTitle(type, item) {
  if (type === "blog") return item.title;
  if (type === "servizi") return item.title || item.name;
  return item.name;
}

function statusLabel(type, item) {
  if (type === "blog") return item.published ? "Pubblicato" : "Bozza";
  if (type === "servizi") return item.active ? "Attivo" : "Non attivo";
  return item.visible ? "Visibile" : "Nascosta";
}

function CmsForm({ type, initialValue, mode, onSaved, onCancel }) {
  const config = CONFIG[type];
  const [form, setForm] = useState(initialValue || initialForm(type));
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState(null);

  const update = (field, value) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (type === "blog" && field === "title" && !prev.slug) next.slug = slugify(value);
      return next;
    });
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setBanner(null);
    try {
      await apiFetch(mode === "edit" ? `${config.endpoint}/${form.id}` : config.endpoint, {
        method: mode === "edit" ? "PUT" : "POST",
        body: JSON.stringify(form),
      });
      setBanner({ type: "ok", message: "Salvato!" });
      if (mode !== "edit") setForm(initialForm(type));
      onSaved?.();
    } catch (error) {
      setBanner({ type: "error", message: error.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="bg-card border border-border rounded-2xl p-6 space-y-5">
      {banner && (
        <div className={`rounded-xl px-4 py-3 text-sm ${banner.type === "ok" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
          {banner.message}
        </div>
      )}

      {type === "blog" && (
        <>
          <Field label="Titolo" required value={form.title} onChange={(v) => update("title", v)} />
          <Field label="Slug URL" required value={form.slug} onChange={(v) => update("slug", v)} />
          <label className="block text-sm font-medium text-foreground">
            Categoria
            <select value={form.category} onChange={(e) => update("category", e.target.value)} className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2">
              {["ansia", "relazioni", "autostima", "benessere", "altro"].map((value) => (
                <option key={value} value={value}>
                  {value[0].toUpperCase() + value.slice(1)}
                </option>
              ))}
            </select>
          </label>
          <ImageField value={form.cover_image} onChange={(v) => update("cover_image", v)} />
          <TextArea label="Testo articolo" required rows={10} value={form.content} onChange={(v) => update("content", v)} placeholder="Scrivi qui il contenuto dell'articolo..." />
          <Field label="Data pubblicazione" type="date" value={form.published_at || today()} onChange={(v) => update("published_at", v)} />
          <Toggle labelA="Bozza" labelB="Pubblicato" value={form.published} onChange={(v) => update("published", v)} />
        </>
      )}

      {type === "servizi" && (
        <>
          <Field label="Nome servizio" required value={form.title} onChange={(v) => update("title", v)} />
          <TextArea label={`Descrizione breve (${(form.short_description || "").length}/160)`} maxLength={160} rows={3} value={form.short_description} onChange={(v) => update("short_description", v)} />
          <TextArea label="Descrizione estesa" rows={7} value={form.description} onChange={(v) => update("description", v)} />
          <Field label="Icona/emoji rappresentativa" value={form.icon} onChange={(v) => update("icon", v)} placeholder="Es. 🧘" />
          <Field label="Prezzo indicativo" value={form.price} onChange={(v) => update("price", v)} placeholder="€ 70 / seduta" />
          <Field label="Ordine di visualizzazione" type="number" value={form.display_order} onChange={(v) => update("display_order", Number(v))} />
          <Toggle labelA="Non attivo" labelB="Attivo" value={form.active} onChange={(v) => update("active", v)} />
        </>
      )}

      {type === "recensioni" && (
        <>
          <Field label="Nome cliente" required value={form.name} onChange={(v) => update("name", v)} />
          <TextArea label="Testo recensione" required rows={6} value={form.text} onChange={(v) => update("text", v)} />
          <div>
            <p className="mb-2 text-sm font-medium text-foreground">Valutazione</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button key={rating} type="button" onClick={() => update("rating", rating)} className="p-1 text-accent">
                  <Star className={`h-5 w-5 ${rating <= form.rating ? "fill-accent" : ""}`} />
                </button>
              ))}
            </div>
          </div>
          <Field label="Data" type="date" value={form.date || today()} onChange={(v) => update("date", v)} />
          <Toggle labelA="Nascosta" labelB="Visibile" value={form.visible} onChange={(v) => update("visible", v)} />
        </>
      )}

      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={saving} className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
          {saving ? "Salvataggio..." : mode === "edit" ? "Aggiorna" : config.createLabel}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="rounded-full border border-border px-5 py-2.5 text-sm text-muted-foreground hover:bg-muted">
            Annulla
          </button>
        )}
      </div>
    </form>
  );
}

function Field({ label, value, onChange, type = "text", required, placeholder }) {
  return (
    <label className="block text-sm font-medium text-foreground">
      {label}
      <input required={required} type={type} value={value ?? ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2" />
    </label>
  );
}

function TextArea({ label, value, onChange, rows, required, maxLength, placeholder }) {
  return (
    <label className="block text-sm font-medium text-foreground">
      {label}
      <textarea required={required} rows={rows} maxLength={maxLength} value={value || ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full resize-y rounded-xl border border-border bg-background px-3 py-2" />
    </label>
  );
}

function Toggle({ labelA, labelB, value, onChange }) {
  return (
    <div className="inline-flex rounded-full bg-muted p-1 text-sm">
      <button type="button" onClick={() => onChange(false)} className={`rounded-full px-4 py-2 ${!value ? "bg-card font-semibold text-foreground shadow" : "text-muted-foreground"}`}>
        {labelA}
      </button>
      <button type="button" onClick={() => onChange(true)} className={`rounded-full px-4 py-2 ${value ? "bg-card font-semibold text-foreground shadow" : "text-muted-foreground"}`}>
        {labelB}
      </button>
    </div>
  );
}

function ImageField({ value, onChange }) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground">
        Immagine copertina
        <input
          type="file"
          accept="image/*"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => onChange(reader.result);
            reader.readAsDataURL(file);
          }}
          className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2"
        />
      </label>
      {value && <img src={value} alt="Anteprima copertina" className="mt-3 aspect-video w-full max-w-sm rounded-xl object-cover" />}
    </div>
  );
}

export default function CmsPage({ type }) {
  const config = CONFIG[type];
  const queryClient = useQueryClient();
  const [mode, setMode] = useState("add");
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const { data = [], isLoading, error } = useQuery({ queryKey: ["cms", type], queryFn: () => apiFetch(`${config.endpoint}?all=1`) });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["cms", type] });
  const getEditInitial = (item) => {
    if (type === "blog") return { ...item, published_at: item.created_date?.slice(0, 10) || today(), cover_image: item.cover_image || "" };
    if (type === "servizi") return { ...item, title: item.title || item.name, short_description: item.short_description || item.subtitle || "", description: item.description || "", display_order: item.display_order || 0 };
    return { ...item, date: item.date || item.created_at?.slice(0, 10) || today() };
  };

  const confirmDelete = async () => {
    await apiFetch(`${config.endpoint}/${deleting.id}`, { method: "DELETE" });
    setDeleting(null);
    refresh();
  };

  return (
    <DashboardShell>
      <SEOHead title={`CMS ${config.title}`} description={`Gestione ${config.title} dashboard`} noIndex />
      <div className="space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">CMS</p>
          <h1 className="font-heading text-3xl font-semibold text-foreground">{config.title}</h1>
        </div>

        <div className="flex flex-wrap gap-2 rounded-2xl border border-border bg-card p-2">
          {[
            ["add", "Aggiungi"],
            ["update", "Aggiorna"],
            ["delete", "Elimina"],
          ].map(([value, label]) => (
            <button key={value} type="button" onClick={() => { setMode(value); setEditing(null); }} className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${mode === value ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:bg-muted"}`}>
              {label}
            </button>
          ))}
        </div>

        {mode === "add" && <CmsForm type={type} onSaved={refresh} />}

        {mode !== "add" && (
          <div className="space-y-4">
            {isLoading && <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">Caricamento...</div>}
            {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">{error.message}</div>}
            {!isLoading && data.length === 0 && <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">Nessun elemento trovato.</div>}
            <AnimatePresence>
              {data.map((item) => (
                <motion.div key={item.id} layout exit={{ opacity: 0, x: -20 }} className={`rounded-2xl border p-5 ${mode === "delete" ? "border-red-200 bg-red-50/60" : "border-border bg-card"}`}>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="font-heading text-lg font-semibold text-foreground">{itemTitle(type, item)}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {type === "blog" && `${item.created_date?.slice(0, 10) || ""} - ${statusLabel(type, item)}`}
                        {type === "servizi" && `${item.price || "Prezzo non indicato"} - ${statusLabel(type, item)}`}
                        {type === "recensioni" && `${"★".repeat(item.rating || 5)} - ${statusLabel(type, item)}`}
                      </p>
                    </div>
                    {mode === "update" ? (
                      <button
                        type="button"
                        onClick={() => setEditing((current) => (current?.id === item.id ? null : item))}
                        className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted"
                      >
                        <Pencil className="h-4 w-4" /> Modifica
                      </button>
                    ) : (
                      <button type="button" onClick={() => setDeleting(item)} className="inline-flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
                        <Trash2 className="h-4 w-4" /> Elimina
                      </button>
                    )}
                  </div>
                  {mode === "update" && editing?.id === item.id && (
                    <div className="mt-5 border-t border-border pt-5">
                      <p className="mb-3 text-sm font-medium text-primary">Modifica: {itemTitle(type, item)}</p>
                      <CmsForm key={item.id} type={type} mode="edit" initialValue={getEditInitial(item)} onSaved={refresh} onCancel={() => setEditing(null)} />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl">
            <AlertTriangle className="mb-4 h-8 w-8 text-red-600" />
            <h2 className="font-heading text-xl font-semibold text-foreground">Eliminare "{itemTitle(type, deleting)}"?</h2>
            <p className="mt-2 text-sm text-muted-foreground">Questa azione è irreversibile.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setDeleting(null)} className="rounded-full border border-border px-4 py-2 text-sm hover:bg-muted">Annulla</button>
              <button type="button" onClick={confirmDelete} className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">Elimina</button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

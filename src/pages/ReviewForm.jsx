import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { Star } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { apiFetch } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function ReviewForm() {
  const { token } = useParams();
  const [form, setForm] = useState({ name: "", rating: 5, text: "" });
  const [sent, setSent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const { data, isLoading, error: loadError } = useQuery({
    queryKey: ["review-context", token],
    queryFn: () => apiFetch(`/api/reviews/${encodeURIComponent(token)}`),
    enabled: Boolean(token),
  });

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await apiFetch(`/api/reviews/${encodeURIComponent(token)}`, {
        method: "POST",
        body: JSON.stringify({ ...form, name: form.name || data?.client_name }),
      });
      setSent(true);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pt-24 md:pt-28">
      <SEOHead title="Lascia una recensione" description="Lascia una recensione sul tuo appuntamento con lo Studio Psicomartina" noIndex />
      <section className="px-5 md:px-8 py-16 md:py-24">
        <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
          {isLoading ? (
            <p className="text-muted-foreground">Caricamento...</p>
          ) : loadError ? (
            <div className="space-y-4">
              <h1 className="font-heading text-2xl font-semibold text-foreground">Link non disponibile</h1>
              <p className="text-muted-foreground">{loadError.message}</p>
              <Button asChild className="rounded-full">
                <Link to="/">Torna alla Home</Link>
              </Button>
            </div>
          ) : sent ? (
            <div className="space-y-4 text-center">
              <p className="mx-auto inline-flex rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">Recensione inviata</p>
              <h1 className="font-heading text-3xl font-semibold text-foreground">Grazie per il tuo tempo</h1>
              <p className="text-muted-foreground">La recensione verrà letta dallo studio prima della pubblicazione.</p>
              <Button asChild className="rounded-full">
                <Link to="/">Torna alla Home</Link>
              </Button>
            </div>
          ) : (
            <>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">Recensione</p>
              <h1 className="mt-2 font-heading text-3xl font-semibold text-foreground">Com'è andata l'esperienza?</h1>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Se ti fa piacere, lascia una recensione. Verrà inviata alla dashboard e pubblicata solo dopo verifica.
              </p>
              <div className="mt-5 rounded-2xl bg-primary/5 p-4 text-sm text-muted-foreground">
                <strong className="text-foreground">{data?.service_label}</strong>
                <br />
                Appuntamento del {data?.date}
              </div>

              <form onSubmit={submit} className="mt-6 space-y-5">
                <label className="block text-sm font-medium text-foreground">
                  Nome
                  <Input value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} placeholder={data?.client_name || "Il tuo nome"} className="mt-1" />
                </label>

                <div>
                  <p className="mb-2 text-sm font-medium text-foreground">Valutazione</p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button key={rating} type="button" onClick={() => setForm((prev) => ({ ...prev, rating }))} className="rounded-lg p-1 text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                        <Star className={`h-6 w-6 ${rating <= form.rating ? "fill-accent" : ""}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <label className="block text-sm font-medium text-foreground">
                  Testo recensione
                  <Textarea required rows={6} value={form.text} onChange={(event) => setForm((prev) => ({ ...prev, text: event.target.value }))} placeholder="Scrivi qui la tua recensione..." className="mt-1" />
                </label>

                {error && <p className="rounded-xl bg-red-100 px-4 py-3 text-sm text-red-800">{error}</p>}
                <Button type="submit" disabled={saving} className="w-full rounded-full bg-accent text-accent-foreground hover:bg-accent/90">
                  {saving ? "Invio in corso..." : "Invia recensione"}
                </Button>
              </form>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, ExternalLink, FileText, Search } from "lucide-react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import SEOHead from "@/components/SEOHead";
import { apiFetch } from "@/api/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function formatItalianDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value));
}

export default function ConsentsPage() {
  const [search, setSearch] = useState("");
  const query = search.trim();
  const { data, isLoading, error } = useQuery({
    queryKey: ["informed-consents", query],
    queryFn: () => apiFetch(`/api/consents${query ? `?q=${encodeURIComponent(query)}` : ""}`),
  });
  const consents = data?.consents || [];
  const totalLabel = useMemo(() => `${consents.length} modul${consents.length === 1 ? "o" : "i"}`, [consents.length]);

  const getConsentBlobUrl = async (consent) => {
    const token = window.localStorage.getItem("dashboard_token");
    const response = await fetch(`/api/consents?download=${encodeURIComponent(consent.id)}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!response.ok) throw new Error("Download non riuscito.");
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  };

  const openConsent = async (consent) => {
    const url = await getConsentBlobUrl(consent);
    window.open(url, "_blank", "noopener,noreferrer");
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  };

  const downloadConsent = async (consent) => {
    const url = await getConsentBlobUrl(consent);
    const link = document.createElement("a");
    link.href = url;
    link.download = `consenso-${consent.client_name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardShell>
      <SEOHead title="Consensi informati" description="Gestione moduli di consenso informato" noIndex />
      <section className="space-y-6">
        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 md:flex-row md:items-center md:justify-between md:p-6">
          <div>
            <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <h1 className="font-heading text-2xl font-semibold text-foreground md:text-3xl">Consensi informati</h1>
            <p className="mt-1 text-sm text-muted-foreground">Cerca, apri e scarica i PDF compilati durante le richieste di prenotazione.</p>
          </div>
          <Badge variant="secondary" className="w-fit rounded-full px-3 py-1">
            {totalLabel}
          </Badge>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 md:p-5">
          <label htmlFor="search-consents" className="mb-2 block text-sm font-medium text-foreground">
            Cerca per nome, email o codice fiscale
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="search-consents" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Es. Giulia, email, codice fiscale..." className="pl-9" />
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          {isLoading ? (
            <div className="p-8 text-sm text-muted-foreground">Caricamento consensi...</div>
          ) : error ? (
            <div className="p-8 text-sm text-destructive">{error.message}</div>
          ) : consents.length === 0 ? (
            <div className="p-8 text-sm text-muted-foreground">Nessun consenso trovato.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Codice fiscale</TableHead>
                  <TableHead>Appuntamento</TableHead>
                  <TableHead>Tipologia</TableHead>
                  <TableHead>Inviato il</TableHead>
                  <TableHead className="text-right">PDF</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {consents.map((consent) => (
                  <TableRow key={consent.id}>
                    <TableCell>
                      <div className="font-medium text-foreground">{consent.client_name}</div>
                      <div className="text-xs text-muted-foreground">{consent.client_email}</div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{consent.fiscal_code || "-"}</TableCell>
                    <TableCell>
                      <div>{consent.appointment ? `${formatItalianDate(consent.appointment.date)} alle ${consent.appointment.time_slot}` : "-"}</div>
                      <div className="text-xs text-muted-foreground">{consent.appointment?.service_label || consent.service_label}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="rounded-full">
                        {consent.subject_label}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatItalianDate(consent.created_at)}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" size="sm" className="gap-2 rounded-full" onClick={() => openConsent(consent)}>
                          <ExternalLink className="h-3.5 w-3.5" />
                          Apri
                        </Button>
                        <Button type="button" size="sm" className="gap-2 rounded-full" onClick={() => downloadConsent(consent)}>
                          <Download className="h-3.5 w-3.5" />
                          Scarica
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </section>
    </DashboardShell>
  );
}

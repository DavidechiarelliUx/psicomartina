import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import DashboardStats from "../components/dashboards/DashboardStats";
import DashboardCharts from "../components/dashboards/DashboardCharts";
import DashboardNotifications from "../components/dashboards/DashboardNotification";
import DashboardCalendar from "../components/dashboards/DashboardCalendar";
import { BookOpen, CalendarPlus, HeartHandshake, Home, LayoutDashboard, ListChecks, UserRound } from "lucide-react";
import { apiFetch } from "@/api/client";
import SEOHead from "@/components/SEOHead";
import { getCanonicalUrl, seoPages } from "@/config/seo";

const siteLinks = [
  { label: "Home", path: "/", icon: Home },
  { label: "Chi Sono", path: "/chi-sono", icon: UserRound },
  { label: "Servizi", path: "/servizi", icon: HeartHandshake },
  { label: "Come Funziona", path: "/come-funziona", icon: ListChecks },
  { label: "Blog", path: "/blog", icon: BookOpen },
  { label: "Prenota", path: "/contatti", icon: CalendarPlus },
];

export default function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      try {
        return await apiFetch("/api/dashboard");
      } catch {
        return { appointments: [], contacts: [], unavailable: true };
      }
    },
  });

  const appointments = data?.appointments || [];
  const contacts = data?.contacts || [];
  const isApiUnavailable = data?.unavailable;

  return (
    <div className="min-h-screen bg-background pt-20 lg:flex lg:pt-0">
      <SEOHead {...seoPages.dashboard} canonical={getCanonicalUrl(seoPages.dashboard.path)} />
      <aside className="hidden bg-card border-border px-6 py-4 lg:sticky lg:top-0 lg:block lg:h-screen lg:w-64 lg:border-r">
        <div className="flex items-center gap-3 lg:mb-8">
          <LayoutDashboard className="w-5 h-5 text-primary" />
          <span className="font-heading text-lg font-semibold text-foreground">Dashboard</span>
        </div>

        <nav className="hidden lg:block space-y-1">
          {siteLinks.map((link) => {
            const Icon = link.icon;

            return (
              <Link
                key={link.path}
                to={link.path}
                className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Icon className="w-4 h-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden lg:block my-6 border-t border-border" />

        <nav className="hidden lg:block space-y-1">
          <a href="#statistiche" className="block rounded-xl px-3 py-2 text-sm font-medium text-primary bg-primary/10">
            Panoramica
          </a>
          <a href="#grafici" className="block rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
            Grafici
          </a>
          <a href="#calendario" className="block rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
            Calendario
          </a>
        </nav>
      </aside>

      <div className="flex-1 max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-8">
        {isLoading ? (
          <div className="bg-card border border-border rounded-2xl p-8 text-sm text-muted-foreground">Caricamento dati dal database...</div>
        ) : (
          <>
            {isApiUnavailable && (
              <div className="bg-card border border-border rounded-2xl p-5 text-sm text-muted-foreground">
                Dashboard caricata in modalità anteprima. I dati reali saranno disponibili quando il backend e il database saranno configurati in produzione.
              </div>
            )}
            <section id="statistiche">
              <DashboardStats appointments={appointments} contacts={contacts} />
            </section>
            <section id="grafici" className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2">
                <DashboardCharts appointments={appointments} />
              </div>
              <div>
                <DashboardNotifications appointments={appointments} contacts={contacts} />
              </div>
            </section>
            <section id="calendario">
              <DashboardCalendar appointments={appointments} />
            </section>
          </>
        )}
      </div>
    </div>
  );
}

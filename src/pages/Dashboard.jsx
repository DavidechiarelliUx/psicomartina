import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import DashboardStats from "../components/dashboards/DashboardStats";
import DashboardCharts from "../components/dashboards/DashboardCharts";
import DashboardNotifications from "../components/dashboards/DashboardNotification";
import DashboardCalendar from "../components/dashboards/DashboardCalendar";
import BookingHoursSettings from "../components/dashboards/BookingHoursSettings";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { apiFetch } from "@/api/client";
import SEOHead from "@/components/SEOHead";
import { getCanonicalUrl, seoPages } from "@/config/seo";

export default function Dashboard() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      try {
        return await apiFetch("/api/dashboard");
      } catch (error) {
        if (error.message.includes("Non autorizzato")) {
          localStorage.removeItem("dashboard_token");
          navigate("/dashboard/login", { replace: true });
        }
        return { appointments: [], contacts: [], unavailable: true };
      }
    },
  });

  useEffect(() => {
    apiFetch("/api/bookings/auto-concludi", { method: "POST" }).catch(() => {});
  }, []);

  const appointments = data?.appointments || [];
  const contacts = data?.contacts || [];
  const isApiUnavailable = data?.unavailable;

  return (
    <DashboardShell>
      <SEOHead {...seoPages.dashboard} canonical={getCanonicalUrl(seoPages.dashboard.path)} />
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
          <section id="orari-prenotazioni">
            <BookingHoursSettings />
          </section>
        </>
      )}
    </DashboardShell>
  );
}

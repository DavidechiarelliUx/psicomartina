import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { parseISO, format } from "date-fns";
import { apiFetch } from "@/api/client";

const COLORS = ["hsl(180,22%,45%)", "hsl(16,38%,59%)", "hsl(18,52%,77%)", "hsl(164,17%,21%)"];

const SERVICE_LABELS = {
  primo_colloquio: "Primo Colloquio",
  ansia: "Ansia",
  relazioni: "Relazioni",
  autostima: "Autostima",
  traumi: "Traumi",
};

export default function DashboardCharts({ appointments }) {
  const [period, setPeriod] = useState("week");

  const now = new Date();

  const { data: remoteStats } = useQuery({
    queryKey: ["booking-stats", period],
    queryFn: () => apiFetch(`/api/bookings/stats?period=${period}`),
  });

  const dailyData = Array.from({ length: 13 }, (_, i) => {
    const hour = i + 8;
    const label = `${String(hour).padStart(2, "0")}:00`;
    const count = appointments.filter((a) => {
      const appointmentDate = a.date ? parseISO(a.date) : null;
      return appointmentDate && format(appointmentDate, "yyyy-MM-dd") === format(now, "yyyy-MM-dd") && a.time_slot?.startsWith(String(hour).padStart(2, "0"));
    }).length;
    return { label, count };
  });

  const weeklyData = Array.from({ length: 8 }, (_, i) => {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7 * (7 - i));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    const label = `Sett. ${i + 1}`;
    const count = appointments.filter((a) => {
      const d = parseISO(a.date);
      return d >= weekStart && d < weekEnd;
    }).length;
    return { label, count };
  });

  const monthPrefix = format(now, "yyyy-MM");
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const monthlyData = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const label = String(day);
    const datePrefix = `${monthPrefix}-${String(day).padStart(2, "0")}`;
    const count = appointments.filter((a) => a.date?.startsWith(datePrefix)).length;
    return { label, count };
  });

  // Service distribution
  const serviceCounts = {};
  appointments.forEach((a) => {
    const k = a.service_type || "altro";
    serviceCounts[k] = (serviceCounts[k] || 0) + 1;
  });
  const pieData = Object.entries(serviceCounts).map(([k, v]) => ({
    name: SERVICE_LABELS[k] || k,
    value: v,
  }));

  const fallbackData = period === "day" ? dailyData : period === "month" ? monthlyData : weeklyData;
  const chartData = remoteStats?.data || fallbackData;

  return (
    <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="font-heading text-lg font-semibold text-foreground">Andamento Prenotazioni</h3>
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {[
            ["day", "Giorno"],
            ["week", "Settimana"],
            ["month", "Mese"],
          ].map(([v, l]) => (
            <button
              key={v}
              onClick={() => setPeriod(v)}
              className={`text-xs px-3 py-1.5 rounded-md transition-all ${period === v ? "bg-card shadow text-foreground font-medium" : "text-muted-foreground"}`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData} barSize={20}>
          <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid hsl(var(--border))", fontSize: 12 }} cursor={{ fill: "hsl(var(--muted))" }} />
          <Bar dataKey="count" name="Prenotazioni" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      {pieData.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-foreground mb-4">Distribuzione per Servizio</h4>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: "10px", fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {pieData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-2 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="text-muted-foreground">{d.name}</span>
                  <span className="font-medium text-foreground">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

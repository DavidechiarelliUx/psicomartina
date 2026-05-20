import React, { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { parseISO, format, eachMonthOfInterval, subMonths } from "date-fns";
import { it } from "date-fns/locale";

const COLORS = ["hsl(180,22%,45%)", "hsl(16,38%,59%)", "hsl(18,52%,77%)", "hsl(164,17%,21%)"];

const SERVICE_LABELS = {
  primo_colloquio: "Primo Colloquio",
  ansia: "Ansia",
  relazioni: "Relazioni",
  autostima: "Autostima",
  traumi: "Traumi",
};

export default function DashboardCharts({ appointments }) {
  const [period, setPeriod] = useState("year"); // week | month | year

  const now = new Date();

  // Monthly data (last 12 months)
  const months = eachMonthOfInterval({ start: subMonths(now, 11), end: now });
  const monthlyData = months.map((m) => {
    const label = format(m, "MMM", { locale: it });
    const monthStr = format(m, "yyyy-MM");
    const count = appointments.filter((a) => a.date?.startsWith(monthStr)).length;
    return { label, count };
  });

  // Weekly data (last 8 weeks)
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

  const chartData = period === "week" ? weeklyData : monthlyData;

  return (
    <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="font-heading text-lg font-semibold text-foreground">Andamento Prenotazioni</h3>
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {[
            ["week", "Settimane"],
            ["year", "Mensile"],
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

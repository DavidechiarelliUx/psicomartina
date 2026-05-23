import React, { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Users, Clock, TrendingUp } from "lucide-react";
import { startOfWeek, startOfMonth, isAfter, parseISO } from "date-fns";
import ListaModal from "../dashboard/ListaModal";

export default function DashboardStats({ appointments, contacts }) {
  const [selectedList, setSelectedList] = useState(null);
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const monthStart = startOfMonth(now);

  const thisWeekItems = appointments.filter((a) => isAfter(parseISO(a.date), weekStart));
  const thisMonthItems = appointments.filter((a) => isAfter(parseISO(a.date), monthStart));
  const pendingItems = appointments.filter((a) => a.status === "pending");
  const newContactItems = contacts.filter((c) => c.status === "new");

  const stats = [
    { label: "Questa settimana", value: thisWeekItems.length, icon: Calendar, color: "bg-primary/10 text-primary", items: thisWeekItems },
    { label: "Questo mese", value: thisMonthItems.length, icon: TrendingUp, color: "bg-accent/15 text-accent", items: thisMonthItems },
    { label: "In attesa", value: pendingItems.length, icon: Clock, color: "bg-secondary/40 text-foreground", items: pendingItems },
    { label: "Nuovi contatti", value: newContactItems.length, icon: Users, color: "bg-primary/10 text-primary", items: newContactItems },
  ];

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.button
            key={s.label}
            type="button"
            onClick={() => setSelectedList(s)}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="bg-card border border-border rounded-2xl p-5 text-left transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color} mb-3`}>
              <s.icon className="w-4 h-4" />
            </div>
            <p className="text-2xl font-heading font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </motion.button>
        ))}
      </div>
      {selectedList && <ListaModal title={selectedList.label} items={selectedList.items} onClose={() => setSelectedList(null)} />}
    </>
  );
}

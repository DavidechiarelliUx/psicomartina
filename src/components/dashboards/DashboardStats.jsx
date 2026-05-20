import React from "react";
import { motion } from "framer-motion";
import { Calendar, Users, Clock, TrendingUp } from "lucide-react";
import { startOfWeek, startOfMonth, isAfter, parseISO } from "date-fns";

export default function DashboardStats({ appointments, contacts }) {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const monthStart = startOfMonth(now);

  const thisWeek = appointments.filter((a) => isAfter(parseISO(a.date), weekStart)).length;
  const thisMonth = appointments.filter((a) => isAfter(parseISO(a.date), monthStart)).length;
  const pending = appointments.filter((a) => a.status === "pending").length;
  const newContacts = contacts.filter((c) => c.status === "new").length;

  const stats = [
    { label: "Questa settimana", value: thisWeek, icon: Calendar, color: "bg-primary/10 text-primary" },
    { label: "Questo mese", value: thisMonth, icon: TrendingUp, color: "bg-accent/15 text-accent" },
    { label: "In attesa", value: pending, icon: Clock, color: "bg-secondary/40 text-foreground" },
    { label: "Nuovi contatti", value: newContacts, icon: Users, color: "bg-primary/10 text-primary" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.07 }}
          className="bg-card border border-border rounded-2xl p-5"
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color} mb-3`}>
            <s.icon className="w-4 h-4" />
          </div>
          <p className="text-2xl font-heading font-bold text-foreground">{s.value}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
        </motion.div>
      ))}
    </div>
  );
}

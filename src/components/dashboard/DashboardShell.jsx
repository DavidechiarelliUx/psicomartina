import { useMemo, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { BookOpen, CalendarPlus, ChevronDown, HeartHandshake, Home, LayoutDashboard, ListChecks, LogOut, MessageSquareQuote, Plus, UserRound } from "lucide-react";

const siteLinks = [
  { label: "Home", path: "/", icon: Home },
  { label: "Chi Sono", path: "/chi-sono", icon: UserRound },
  { label: "Servizi", path: "/servizi", icon: HeartHandshake },
  { label: "Come Funziona", path: "/come-funziona", icon: ListChecks },
  { label: "Blog", path: "/blog", icon: BookOpen },
  { label: "Prenota", path: "/contatti", icon: CalendarPlus },
];

const cmsLinks = [
  { label: "Blog", path: "/dashboard/cms/blog", icon: BookOpen },
  { label: "Servizi", path: "/dashboard/cms/servizi", icon: HeartHandshake },
  { label: "Recensioni", path: "/dashboard/cms/recensioni", icon: MessageSquareQuote },
];

export default function DashboardShell({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const isCmsPath = location.pathname.startsWith("/dashboard/cms");
  const [cmsOpen, setCmsOpen] = useState(isCmsPath);

  const secondaryLinks = useMemo(
    () => [
      { label: "Panoramica", path: "/dashboard#statistiche" },
      { label: "Grafici", path: "/dashboard#grafici" },
      { label: "Calendario", path: "/dashboard#calendario" },
    ],
    []
  );

  const handleLogout = () => {
    localStorage.removeItem("dashboard_token");
    navigate("/dashboard/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background pt-20 lg:flex lg:pt-0">
      <aside className="hidden bg-card border-border px-6 py-4 lg:sticky lg:top-0 lg:block lg:h-screen lg:w-64 lg:border-r">
        <div className="flex items-center gap-3 lg:mb-8">
          <LayoutDashboard className="w-5 h-5 text-primary" />
          <span className="font-heading text-lg font-semibold text-foreground">Dashboard</span>
        </div>

        <nav className="space-y-1">
          {siteLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link key={link.path} to={link.path} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
                <Icon className="w-4 h-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="my-6 border-t border-border" />

        <nav className="space-y-1">
          {secondaryLinks.map((link) => (
            <Link
              key={link.label}
              to={link.path}
              className={`block rounded-xl px-3 py-2 text-sm ${
                location.pathname === "/dashboard" && location.hash === link.path.split("#")[1] ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}

          <button
            type="button"
            onClick={() => setCmsOpen((open) => !open)}
            className={`mt-2 flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors ${
              cmsOpen || isCmsPath ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
            aria-expanded={cmsOpen}
          >
            <span className="flex items-center gap-3">
              <Plus className="w-4 h-4" />
              Aggiungi
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform ${cmsOpen ? "rotate-180" : ""}`} />
          </button>

          <div className={`overflow-hidden transition-[max-height] duration-300 ease-in-out ${cmsOpen ? "max-h-40" : "max-h-0"}`}>
            <div className="ml-4 mt-1 space-y-1 border-l border-border pl-3">
              {cmsLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <NavLink
                    key={link.path}
                    to={link.path}
                    className={({ isActive }) =>
                      `flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                        isActive ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`
                    }
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {link.label}
                  </NavLink>
                );
              })}
            </div>
          </div>
        </nav>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-8 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <LogOut className="w-4 h-4" />
          Esci
        </button>
      </aside>

      <div className="flex-1 max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-8">
        <div className="flex justify-end lg:hidden">
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <LogOut className="w-4 h-4" />
            Esci
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

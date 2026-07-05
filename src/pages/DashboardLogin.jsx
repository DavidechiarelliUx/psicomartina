import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LockKeyhole } from "lucide-react";
import SEOHead from "@/components/SEOHead";

export default function DashboardLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (event) => {
    event?.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError("Credenziali non valide. Riprova.");
        return;
      }

      localStorage.setItem("dashboard_token", data.token);
      navigate("/dashboard");
    } catch {
      setError("Errore di connessione. Riprova.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-secondary/40 px-5 py-10 flex items-center justify-center">
      <SEOHead title="Accesso Dashboard" description="Accesso riservato dashboard Dott.ssa Martina Giovinazzo" noIndex />
      <form onSubmit={handleLogin} className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-lg p-7">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-5">
          <LockKeyhole className="w-5 h-5" />
        </div>
        <h1 className="font-heading text-2xl font-semibold text-center text-foreground mb-2">Accesso riservato</h1>
        <p className="text-sm text-muted-foreground text-center mb-6">Dashboard Dott.ssa Martina Giovinazzo</p>

        <label className="block text-sm font-medium text-foreground mb-2" htmlFor="dashboard-username">
          Username
        </label>
        <input
          id="dashboard-username"
          type="text"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 mb-4"
          autoComplete="username"
          required
        />

        <label className="block text-sm font-medium text-foreground mb-2" htmlFor="dashboard-password">
          Password
        </label>
        <input
          id="dashboard-password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          autoComplete="current-password"
          required
        />

        {error && <p className="text-sm text-destructive mt-4">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          {loading ? "Accesso..." : "Accedi"}
        </button>
      </form>
    </main>
  );
}

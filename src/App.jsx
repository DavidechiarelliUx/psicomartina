import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClientInstance } from "@/lib/query-client";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

import MainLayout from "./components/layout/MainLayout";
import Home from "./pages/Home";
import About from "./pages/About";
import Services from "./pages/Services";
import HowItWorks from "./pages/HowItWorks";
import Blog from "./pages/Blog";
import BlogPostPage from "./pages/BlogPost";
import Contact from "./pages/Contact";
import Privacy from "./pages/Privacy";
import ReviewForm from "./pages/ReviewForm";
import Dashboard from "./pages/Dashboard";
import DashboardLogin from "./pages/DashboardLogin";
import CmsPage from "./pages/dashboard/CmsPage";
import ConsentsPage from "./pages/dashboard/ConsentsPage";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import ScrollToTop from "./components/ScrollToTop";
import CookiePolicy from "./pages/CookiePolicy";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { ConsentProvider, useAnalyticsConsent } from "@/lib/consent";

// Speed Insights viene caricato solo dopo consenso esplicito agli strumenti analitici.
function AnalyticsGate() {
  const analyticsAllowed = useAnalyticsConsent();
  return analyticsAllowed ? <SpeedInsights /> : null;
}

const AuthenticatedApp = () => {
  return (
    <Routes>
      <Route path="/dashboard/login" element={<DashboardLogin />} />
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/chi-sono" element={<About />} />
        <Route path="/servizi" element={<Services />} />
        <Route path="/come-funziona" element={<HowItWorks />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />
        <Route path="/contatti" element={<Contact />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/cookie-policy" element={<CookiePolicy />} />
        <Route path="/recensione/:token" element={<ReviewForm />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/consensi"
          element={
            <ProtectedRoute>
              <ConsentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/cms/blog"
          element={
            <ProtectedRoute>
              <CmsPage type="blog" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/cms/servizi"
          element={
            <ProtectedRoute>
              <CmsPage type="servizi" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/cms/recensioni"
          element={
            <ProtectedRoute>
              <CmsPage type="recensioni" />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <ConsentProvider>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
        <SonnerToaster position="top-center" />
        <AnalyticsGate />
      </ConsentProvider>
    </QueryClientProvider>
  );
}

export default App;

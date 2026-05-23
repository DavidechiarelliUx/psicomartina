import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import ConsentNotice from "../shared/ConsentNotice";
import WhatsAppButton from "../WhatsAppButton";

export default function MainLayout() {
  const location = useLocation();
  const isDashboard = location.pathname.startsWith("/dashboard");

  return (
    <div className="min-h-screen flex flex-col">
      <div className={isDashboard ? "lg:hidden" : undefined}>
        <Navbar />
      </div>
      <main className="flex-1">
        <Outlet />
      </main>
      {!isDashboard && <Footer />}
      {!isDashboard && <ConsentNotice />}
      {!isDashboard && <WhatsAppButton />}
    </div>
  );
}

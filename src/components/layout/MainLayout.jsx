import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import ConsentNotice from "../shared/ConsentNotice";

export default function MainLayout() {
  const location = useLocation();
  const isDashboard = location.pathname === "/dashboard";

  return (
    <div className="min-h-screen flex flex-col">
      <div className={isDashboard ? "lg:hidden" : undefined}>
        <Navbar />
      </div>
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <ConsentNotice />
    </div>
  );
}

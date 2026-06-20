import React from "react";
import ReactDOM from "react-dom/client";
import App from "@/App.jsx";

// Font self-hostati (no CDN Google -> nessun trasferimento IP a Google, GDPR-friendly).
import "@fontsource/inter/300.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/playfair-display/400.css";
import "@fontsource/playfair-display/500.css";
import "@fontsource/playfair-display/600.css";
import "@fontsource/playfair-display/700.css";
import "@fontsource/playfair-display/400-italic.css";
import "@fontsource/playfair-display/500-italic.css";

import "@/index.css";

ReactDOM.createRoot(document.getElementById("root")).render(<App />);

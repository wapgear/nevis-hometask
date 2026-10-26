import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { ClientsPage } from "./pages/Clients/Clients.page";

import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-500.css";
import "./styles.scss";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ClientsPage />
  </StrictMode>,
);

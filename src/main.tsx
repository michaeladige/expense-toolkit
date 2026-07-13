import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ExpenseProvider } from "./store/ExpenseContext";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ExpenseProvider>
      <App />
    </ExpenseProvider>
  </StrictMode>
);

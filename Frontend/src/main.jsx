import React from "react"; // Importing React explicitly (not needed for JSX transform in React 18)
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

// Using React explicitly even though it's not required in React 18+
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./App.css";

// Avoid injecting twice if the content script runs more than once
if (!document.getElementById("ai-chat-extension-root")) {
  const container = document.createElement("div");
  container.id = "ai-chat-extension-root";

  // Isolate from the host page's stacking context
  container.style.cssText = `
    position: fixed;
    bottom: 0;
    right: 0;
    z-index: 2147483647;
    pointer-events: none;
  `;

  document.body.appendChild(container);

  ReactDOM.createRoot(container).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

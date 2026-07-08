import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./App.css";

function setWidgetVisible(visible) {
  const root = document.getElementById("ai-chat-extension-root");
  if (root) root.style.display = visible ? "" : "none";
}

// Avoid injecting twice if the content script runs more than once
if (!document.getElementById("ai-chat-extension-root")) {
  const container = document.createElement("div");
  container.id = "ai-chat-extension-root";

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

  // Apply persisted enabled state on init
  chrome.storage.local.get("widgetEnabled", ({ widgetEnabled }) => {
    setWidgetVisible(widgetEnabled !== false);
  });

  // React to toggle changes from the popup in real time
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "WIDGET_TOGGLE") {
      const root = document.getElementById("ai-chat-extension-root");
      if (root) {
        root.style.display = message.enabled ? "block" : "none";
      }
    }
  });
}
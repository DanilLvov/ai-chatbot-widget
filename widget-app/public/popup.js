const toggle = document.getElementById("enable-toggle");
const dot = document.getElementById("dot");
const statusText = document.getElementById("status-text");

function applyState(enabled) {
  toggle.checked = enabled;
  dot.classList.toggle("disabled", !enabled);
  statusText.textContent = enabled ? "Extension active" : "Extension disabled";
}

chrome.storage.local.get("widgetEnabled", ({ widgetEnabled }) => {
  const enabled = widgetEnabled !== false;
  applyState(enabled);
});

toggle.addEventListener("change", () => {
  const enabled = toggle.checked;
  applyState(enabled);
  chrome.storage.local.set({ widgetEnabled: enabled });

  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    chrome.tabs.sendMessage(tab.id, { type: "WIDGET_TOGGLE", enabled })
      .catch(() => {});  // ← silences error if no content script on that tab
  });
});

// reloads the current tab so the content script re-injects the widget
document.getElementById("reload-btn").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    chrome.tabs.reload(tab.id);
  });
});





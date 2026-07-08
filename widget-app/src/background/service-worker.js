/**
 * Background Service Worker
 *
 * Receives messages from the content script and makes API calls.
 * Service workers don't have CORS restrictions, so all fetch calls live here.
 *
 * Replace SERVER_URL with your actual backend URL when deploying.
 */

const SERVER_URL = "http://localhost:3000";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Service worker received:", message); // # logging workload sent to server
  if (message.type === "CHAT_MESSAGE") {
    handleChatMessage(message.payload)
      .then(sendResponse)
      .catch((error) =>
        sendResponse({ error: error.message || "Unknown error" })
      );

    // Return true to keep the message channel open for async response
    return true;
  }

  if (message.type === "SUMMARIZE") {
    handleSummarize(message.payload)
      .then(sendResponse)
      .catch((error) =>
        sendResponse({ error: error.message || "Unknown error" })
      );

    return true;
  }
});

async function handleChatMessage({ message, pageContext, recentHistory = [], summary = "" }) {
  const response = await fetch(`${SERVER_URL}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message,
      context: {
        url: pageContext.url,
        title: pageContext.title,
        pageText: pageContext.pageText
      },
      recentHistory,
      summary,
    })
  });

  if (!response.ok) {
    throw new Error(`Server error: ${response.status}`);
  }

  const data = await response.json();
  return { answer: data.answer };
}

async function handleSummarize({ messages }) {
  const response = await fetch(`${SERVER_URL}/summarize`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ messages })
  });

  if (!response.ok) {
    throw new Error(`Server error: ${response.status}`);
  }

  const data = await response.json();
  return { summary: data.summary };
}

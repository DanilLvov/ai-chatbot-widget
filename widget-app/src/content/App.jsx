import { useState } from "react";

function App() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: "Hi! How can I help you with this page?"
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function sendMessage() {
    const text = inputValue.trim();
    if (!text || isLoading) return;

    // Grab the current page's URL and title to give the AI context
    const pageContext = {
      url: window.location.href,
      title: document.title,
      // Optionally send a snippet of the visible page text
      pageText: document.body.innerText.slice(0, 3000)
    };

    setMessages((prev) => [...prev, { role: "user", text }]);
    setInputValue("");
    setIsLoading(true);

    try {
      // Send message to background service worker instead of calling fetch directly.
      // Content scripts have CORS restrictions; the background worker does not.
      const response = await chrome.runtime.sendMessage({
        type: "CHAT_MESSAGE",
        payload: { message: text, pageContext }
      });

      if (response.error) {
        throw new Error(response.error);
      }

      setMessages((prev) => [...prev, { role: "bot", text: response.answer }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "Something went wrong. Please try again." }
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }

  return (
    // pointer-events: all re-enables interaction inside the widget
    // (the container is pointer-events: none to not block the page)
    <div style={{ pointerEvents: "all" }}>
      {isOpen && (
        <div className="chat-widget">
          <div className="chat-header">
            <div>
              <div className="chat-title">AI Assistant</div>
              <div className="chat-status">Online</div>
            </div>
            <button className="chat-close" onClick={() => setIsOpen(false)}>
              ×
            </button>
          </div>

          <div className="chat-messages">
            {messages.map((message, index) => (
              <div
                key={index}
                className={
                  message.role === "user"
                    ? "message message-user"
                    : "message message-bot"
                }
              >
                {message.text}
              </div>
            ))}
            {isLoading && (
              <div className="message message-bot typing-indicator">
                <span /><span /><span />
              </div>
            )}
          </div>

          <div className="chat-input-row">
            <input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about this page..."
              autoFocus
            />
            <button onClick={sendMessage} disabled={isLoading}>
              Send
            </button>
          </div>
        </div>
      )}

      <button className="chat-toggle" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? "×" : "💬"}
      </button>
    </div>
  );
}

export default App;

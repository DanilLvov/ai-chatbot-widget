import { useState, useEffect, useRef } from "react";

const INITIAL_MESSAGE = { role: "bot", text: "Hi! How can I help you with this page?" };
const RECENT_WINDOW = 6;
const SUMMARIZE_THRESHOLD = 10;
const SERVER = "http://localhost:3000";

function App() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [summary, setSummary] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Load persisted history on mount
  useEffect(() => {
    chrome.storage.local.get(["chatMessages", "chatSummary"], ({ chatMessages, chatSummary }) => {
      if (chatMessages?.length) setMessages(chatMessages);
      if (chatSummary) setSummary(chatSummary);
    });
  }, []);

  // Persist whenever messages or summary change
  useEffect(() => {
    chrome.storage.local.set({ chatMessages: messages, chatSummary: summary });
  }, [messages, summary]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  async function maybeCompress(currentMessages) {
    if (currentMessages.length <= SUMMARIZE_THRESHOLD) {
      return { messages: currentMessages, activeSummary: summary };
    }

    const toSummarize = currentMessages.slice(0, -RECENT_WINDOW);
    const toKeep = currentMessages.slice(-RECENT_WINDOW);

    try {
      const res = await fetch(`${SERVER}/summarize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: toSummarize }),
      });
      const data = await res.json();
      const newSummary = [summary, data.summary].filter(Boolean).join(" ");
      setSummary(newSummary);
      return { messages: toKeep, activeSummary: newSummary };
    } catch {
      return { messages: toKeep, activeSummary: summary };
    }
  }

  async function sendMessage() {
    const text = inputValue.trim();
    if (!text || isLoading) return;

    const pageContext = {
      url: window.location.href,
      title: document.title,
      pageText: document.body.innerText.slice(0, 3000),
    };

    const updatedMessages = [...messages, { role: "user", text }];
    setMessages(updatedMessages);
    setInputValue("");
    setIsLoading(true);

    try {
      const { messages: compressedMessages, activeSummary } = await maybeCompress(updatedMessages);
      // recentHistory excludes the just-added user message (server appends it itself)
      const recentHistory = compressedMessages.slice(-(RECENT_WINDOW + 1), -1);

      const response = await chrome.runtime.sendMessage({
        type: "CHAT_MESSAGE",
        payload: { message: text, pageContext, recentHistory, summary: activeSummary },
      });

      if (response.error) throw new Error(response.error);

      setMessages([...compressedMessages, { role: "bot", text: response.answer }]);
    } catch {
      setMessages((prev) => [...prev, { role: "bot", text: "Something went wrong. Please try again." }]);
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

  function newChat() {
    setMessages([INITIAL_MESSAGE]);
    setSummary("");
  }

  return (
    <div style={{ pointerEvents: "all" }}>
      {isOpen && (
        <div className="chat-widget">
          <div className="chat-header">
            <div>
              <div className="chat-title">AI Assistant</div>
              <div className="chat-status">Online</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <button className="chat-new" onClick={newChat} title="New chat">
                ✏️
              </button>
              <button className="chat-close" onClick={() => setIsOpen(false)}>
                ×
              </button>
            </div>
          </div>

          <div className="chat-messages">
            {messages.map((message, index) => (
              <div
                key={index}
                className={message.role === "user" ? "message message-user" : "message message-bot"}
              >
                {message.text}
              </div>
            ))}
            {isLoading && (
              <div className="message message-bot typing-indicator">
                <span /><span /><span />
              </div>
            )}
            <div ref={messagesEndRef} />
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

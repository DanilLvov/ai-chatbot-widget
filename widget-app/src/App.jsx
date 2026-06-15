import { useState } from "react";
import "./App.css";

function App() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: "Hi! How can I help?"
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function sendMessage() {
    const text = inputValue.trim();

    if (!text || isLoading) return;

    const userMessage = {
      role: "user",
      text
    };

    setMessages((currentMessages) => [...currentMessages, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:3000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: text
        })
      });

      const data = await response.json();

      const botMessage = {
        role: "bot",
        text: data.answer
      };

      setMessages((currentMessages) => [...currentMessages, botMessage]);
    } catch (error) {
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          role: "bot",
          text: "Browser request error"
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(event) {
    if (event.key === "Enter") {
      sendMessage();
    }
  }

  return (
    <>
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

            {isLoading && <div className="message message-bot">Typing...</div>}
          </div>

          <div className="chat-input-row">
            <input
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="insert your message..."
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
    </>
  );
}

export default App;
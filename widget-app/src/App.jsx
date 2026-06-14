import { useState } from "react";
import "./App.css";

function App() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function sendMessage() {
    if (!inputValue.trim()) return;

    const userMessage = {
      role: "user",
      text: inputValue
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
          message: userMessage.text
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
          text: "browser request error"
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
    <div className="chat-page">
      <div className="chat-window">
        <div className="chat-header">AI Chat Widget</div>

        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="empty-state">Write your first message</div>
          )}

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

          <button onClick={sendMessage}>Send</button>
        </div>
      </div>
    </div>
  );
}

export default App;
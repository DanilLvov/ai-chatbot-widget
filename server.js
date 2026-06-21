import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Anthropic from "@anthropic-ai/sdk";

dotenv.config();

const app = express();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Chat API is running" });
});

app.post("/chat", async (req, res) => {
  const { message, context } = req.body;

  if (!message) {
    return res.status(400).json({ error: "message is required" });
  }

  let systemPrompt = "You are a helpful assistant embedded in a Chrome extension. Answer the user's questions concisely.";

  if (context) {
    const { url, title, pageText } = context;
    systemPrompt += `\n\nThe user is currently on the following page:\nURL: ${url ?? "unknown"}\nTitle: ${title ?? "unknown"}`;
    if (pageText) {
      systemPrompt += `\n\nPage content (truncated):\n${pageText.slice(0, 3000)}`;
    }
  }

  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: message }],
    });

    const answer = response.content[0]?.text ?? "";
    res.json({ answer });
  } catch (err) {
    console.error("Anthropic API error:", err);
    res.status(502).json({ error: "Failed to get response from AI" });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

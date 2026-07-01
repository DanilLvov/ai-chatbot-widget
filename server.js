import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Anthropic from "@anthropic-ai/sdk";

dotenv.config();

const DEBUG = process.env.DEBUG === "true";

const app = express();
// Only instantiate Anthropic client when not in debug mode
const anthropic = DEBUG ? null : new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Chat API is running", mode: DEBUG ? "debug" : "live" });
});

// ---------------------------------------------------------------------------
// Debug helpers
// ---------------------------------------------------------------------------

/** Echoes back what the server received so you can inspect context plumbing. */
function buildDebugAnswer(message, context) {
  const lines = [
    `[DEBUG MODE — no API call made]`,
    ``,
    `📨 Message received: "${message}"`,
  ];

  if (context) {
    const { url, title, pageText } = context;
    lines.push(``, `🌐 Page context:`);
    lines.push(`  URL   : ${url ?? "—"}`);
    lines.push(`  Title : ${title ?? "—"}`);
    if (pageText) {
      const preview = pageText.slice(0, 200).replace(/\n+/g, " ").trim();
      lines.push(`  Text  : ${preview}${pageText.length > 200 ? " …" : ""}`);
    } else {
      lines.push(`  Text  : (none sent)`);
    }
  } else {
    lines.push(``, `⚠️  No page context received.`);
  }

  lines.push(``, `✅ Server is wired up correctly. Set DEBUG=false to go live.`);
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Chat endpoint
// ---------------------------------------------------------------------------

app.post("/chat", async (req, res) => {
  const { message, context, recentHistory = [], summary = "" } = req.body;

  if (!message) {
    return res.status(400).json({ error: "message is required" });
  }

  if (DEBUG) {
    console.log("[debug] /chat hit — returning mock response");
    return res.json({ answer: buildDebugAnswer(message, context) });
  }

  let systemPrompt = "You are a helpful assistant embedded in a Chrome extension. Answer the user's questions concisely.";

  if (summary) {
    systemPrompt += `\n\nSummary of the conversation so far:\n${summary}`;
  }

  if (context) {
    const { url, title, pageText } = context;
    systemPrompt += `\n\nThe user is currently on the following page:\nURL: ${url ?? "unknown"}\nTitle: ${title ?? "unknown"}`;
    if (pageText) {
      systemPrompt += `\n\nPage content (truncated):\n${pageText.slice(0, 3000)}`;
    }
  }

  // Build multi-turn messages array from recent history + new message
  const messages = [
    ...recentHistory.map((m) => ({
      role: m.role === "user" ? "user" : "assistant",
      content: m.text,
    })),
    { role: "user", content: message },
  ];

  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    });

    const answer = response.content[0]?.text ?? "";
    res.json({ answer });
  } catch (err) {
    console.error("Anthropic API error:", err);
    res.status(502).json({ error: "Failed to get response from AI" });
  }
});

// ---------------------------------------------------------------------------
// Summarize endpoint
// ---------------------------------------------------------------------------

app.post("/summarize", async (req, res) => {
  const { messages } = req.body;

  if (!messages?.length) {
    return res.status(400).json({ error: "messages is required" });
  }

  if (DEBUG) {
    return res.json({ summary: "[DEBUG] Summary would be generated here." });
  }

  const transcript = messages
    .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.text}`)
    .join("\n");

  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 256,
      messages: [
        {
          role: "user",
          content: `Summarize the following conversation in 2-3 sentences, preserving key facts and decisions:\n\n${transcript}`,
        },
      ],
    });

    res.json({ summary: response.content[0]?.text ?? "" });
  } catch (err) {
    console.error("Summarize error:", err);
    res.status(502).json({ error: "Failed to summarize" });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  const modeLabel = DEBUG ? "DEBUG (no API calls)" : "LIVE";
  console.log(`Server running on http://localhost:${PORT}  [${modeLabel}]`);
});
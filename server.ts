import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize server-side Gemini client
  const apiKey = process.env.GEMINI_API_KEY;
  const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

  // Real-time server-side streaming API proxy for Dante Chief of Staff
  app.post("/api/dante", async (req, res) => {
    try {
      if (!ai) {
        return res.status(500).json({ error: "GEMINI_API_KEY environment variable is not configured." });
      }

      const { messages, context } = req.body;
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Dante AI demands a proper message array query." });
      }

      // Grab user query
      const lastMsg = messages[messages.length - 1];
      const userInput = lastMsg?.content || "";

      // Extract preceding chat memory limit to last 10 messages for prompt efficiency and context depth
      const historySegment = messages.slice(Math.max(0, messages.length - 11), messages.length - 1);
      const historyContents = historySegment.map((m: any) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

      // Gather telemetry metrics for prompt injection
      const tasksList = context?.tasks || [];
      const upcomingMeetings = context?.meetings || [];
      const googleEvents = context?.googleEvents || [];
      const vaultItems = context?.vault || [];
      const dbCategories = context?.categories || [];
      const currentStreak = context?.streak || 0;
      const completionRate = context?.completionRate || 0;
      const productivityScore = context?.productivityScore || 0;

      // Identify today's tasks
      const todayStr = new Date().toISOString().split("T")[0];
      const todayTasks = tasksList.filter((t: any) => t.date === todayStr);

      const systemInstruction = `You are Dante, the personal AI chief of staff inside ZEN OS.
You have complete access to [USER]'s productivity data:

TASKS: ${JSON.stringify(tasksList)}
TODAY'S TASKS: ${JSON.stringify(todayTasks)}
MEETINGS: ${JSON.stringify(upcomingMeetings)}
CALENDAR EVENTS: ${JSON.stringify(googleEvents)}
VAULT: ${JSON.stringify(vaultItems)}
CATEGORIES: ${JSON.stringify(dbCategories)}
STREAK: ${currentStreak}
ANALYTICS: Completion rate: ${completionRate}%, Productivity score: ${productivityScore}%

You know everything about their work and schedule. Be proactive, specific, and personal. Reference their actual data in every response.
You are not a generic assistant — you are their dedicated chief of staff. Be concise, direct, and brilliant. Use their name when you know it.

QUICK ACTIONS DISPATCHER:
If the user indicates they want to add a task, toggle/complete a task, make or schedule a meeting, or change views, you MUST return a structured JSON action output in your response. Put this JSON output inside a single, dedicated markdown code block at the absolute end of your response. 

The JSON schema must be strictly valid like this:
\`\`\`json
{
  "action": "create_task" | "toggle_task" | "create_meeting" | "switch_view",
  "data": { ... },
  "message": "A brief, dynamic, high-iq confirmation of the action."
}
\`\`\`

Action specifications:
1. "create_task": data contains { "title": string, "cat": string (one of the existing categories, or 'other'), "date": string (format: YYYY-MM-DD), "note": string }
2. "toggle_task": data contains { "title": string } (or "id" if known). Best to supply the title of the task so the UI can match it.
3. "create_meeting": data contains { "personName": string, "date": string (YYYY-MM-DD), "time": string (HH:MM), "subject": string }
4. "switch_view": data contains { "view": "dashboard" | "kanban" | "calendar" | "meetings" | "analytics" | "vault" | "dante" }

Be extremely proactive! If someone says "add a task to write emails", output some brilliant text confirming first, then output the JSON codeblock doing indeed exactly that. Do both. Ensure that the JSON is fully compliant and matches the keys.`;

      const contents = [
        ...historyContents,
        { role: 'user', parts: [{ text: userInput }] }
      ];

      // Stream response using gemini-3.5-flash as per skill.md guidelines
      const stream = await ai.models.generateContentStream({
        model: "gemini-3.5-flash",
        contents: contents,
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      for await (const chunk of stream) {
        if (chunk.text) {
          res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
        }
      }

      res.write("data: [DONE]\n\n");
      res.end();

    } catch (err: any) {
      console.error("Dante Gemini Proxy Fatal:", err);
      res.status(500).json({ error: err.message || "Failed to prompt Dante's synapses" });
    }
  });

  // Hot-mount Vite development middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ZEN_OS Core listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();

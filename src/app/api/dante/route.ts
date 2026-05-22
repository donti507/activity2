import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

// Reference Next.js App Router streaming endpoint for Dante AI
export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing GEMINI_API_KEY" }, { status: 500 });
    }

    const { messages, context } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Messages array required" }, { status: 400 });
    }

    const ai = new GoogleGenAI({ apiKey });

    // Grab user input
    const lastMsg = messages[messages.length - 1];
    const userInput = lastMsg?.content || "";

    const historyBits = messages.slice(Math.max(0, messages.length - 11), messages.length - 1);
    const contents = [
      ...historyBits.map((m: any) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      })),
      { role: "user", parts: [{ text: userInput }] }
    ];

    const systemPrompt = `You are Dante, the personal AI chief of staff inside ZEN OS.
You have complete access to [USER]'s productivity data:

TASKS: ${JSON.stringify(context?.tasks || [])}
MEETINGS: ${JSON.stringify(context?.meetings || [])}
STREAK: ${context?.streak || 0}
ANALYTICS: Completion rate: ${context?.completionRate || 0}%

Provide a brilliant, contextualized response. Use action JSON blocks at the end if actions are requested.`;

    const responseStream = await ai.models.generateContentStream({
      model: "gemini-3.5-flash",
      contents,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7
      }
    });

    // Create readable stream for Next.js client consumption
    const encoder = new TextEncoder();
    const customReadable = new ReadableStream({
      async start(controller) {
        for await (const chunk of responseStream) {
          if (chunk.text) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk.text })}\n\n`));
          }
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      }
    });

    return new Response(customReadable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
      }
    });

  } catch (err: any) {
    console.error("Next Dante Router Error:", err);
    return NextResponse.json({ error: err.message || "Synapse misfire" }, { status: 500 });
  }
}

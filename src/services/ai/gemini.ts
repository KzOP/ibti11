export interface ChatMessage {
  role: "user" | "model";
  text: string;
}

let currentSessionMessages: ChatMessage[] = [];

export function resetChat(): void {
  console.log("[Groq] Chat session reset");
  currentSessionMessages = [];
}

export function restoreChat(history: ChatMessage[]): void {
  console.log("[Groq] Restoring chat with", history.length, "messages");
  currentSessionMessages = [...history];
}

export async function sendMessage(userMessage: string): Promise<string> {
  console.log("[Groq] Sending message via /api/chat");

  const history = currentSessionMessages.map((m) => ({
    role: m.role === "model" ? "assistant" : "user",
    content: m.text,
  }));

  let response: Response;
  try {
    response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userMessage, history }),
    });
  } catch {
    throw new Error("GROQ_NETWORK_ERROR");
  }

  const data = await response.json();

  if (!response.ok) {
    const errCode = data.error || "GROQ_API_ERROR";
    console.error("[Groq] Server error:", errCode);
    throw new Error(errCode);
  }

  console.log("[Groq] Response received, length:", data.reply?.length ?? 0);
  currentSessionMessages.push({ role: "user", text: userMessage });
  currentSessionMessages.push({ role: "model", text: data.reply });
  return data.reply;
}

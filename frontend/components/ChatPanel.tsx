"use client";

import { useState, useRef, useEffect } from "react";
import { Send, ThumbsUp, ThumbsDown, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { IngestionStatus } from "@/app/page";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface Props {
  status: IngestionStatus;
}

export default function ChatPanel({ status }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || loading || status !== "ready") return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:8000/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: userMessage.content }),
      });

      const data = await response.json();

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.answer ?? "No answer found in memory.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Something went wrong reaching the backend. Is it running?",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function handleFeedback(message: Message, wasHelpful: boolean) {
    const lastUserMessage = [...messages]
      .reverse()
      .find((m) => m.role === "user");
    if (!lastUserMessage) return;

    await fetch("http://localhost:8000/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: lastUserMessage.content,
        answer: message.content,
        was_helpful: wasHelpful,
      }),
    }).catch(() => null);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <section className="flex flex-col flex-1 overflow-hidden">
      <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <Bot className="w-10 h-10 text-muted-foreground opacity-40" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {status === "ready"
                  ? "Memory is ready. Ask anything about the codebase."
                  : "Load a codebase on the left to get started."}
              </p>
              {status === "ready" && (
                <p className="text-xs text-muted-foreground mt-1 opacity-60">
                  Try: "Why does this project use a custom auth middleware?" or
                  "What changed in the payment module last year?"
                </p>
              )}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${
              message.role === "user" ? "flex-row-reverse" : "flex-row"
            }`}
          >
            <div className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center bg-muted">
              {message.role === "user" ? (
                <User className="w-3.5 h-3.5" />
              ) : (
                <Bot className="w-3.5 h-3.5 text-emerald-400" />
              )}
            </div>

            <div
              className={`flex flex-col gap-1 max-w-[75%] ${
                message.role === "user" ? "items-end" : "items-start"
              }`}
            >
              <div
                className={`rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                {message.content}
              </div>

              {message.role === "assistant" && (
                <div className="flex items-center gap-1 px-1">
                  <button
                    onClick={() => handleFeedback(message, true)}
                    className="p-1 rounded hover:bg-muted transition-colors"
                    title="This was helpful"
                  >
                    <ThumbsUp className="w-3 h-3 text-muted-foreground hover:text-emerald-400" />
                  </button>
                  <button
                    onClick={() => handleFeedback(message, false)}
                    className="p-1 rounded hover:bg-muted transition-colors"
                    title="This was not helpful"
                  >
                    <ThumbsDown className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center bg-muted">
              <Bot className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="bg-muted rounded-xl px-4 py-3 flex gap-1 items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="border-t border-border px-6 py-4">
        <div className="flex gap-3 items-end">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              status === "ready"
                ? "Ask anything about the codebase... (Enter to send)"
                : "Load a codebase first..."
            }
            disabled={status !== "ready" || loading}
            rows={2}
            className="resize-none text-sm"
          />
          <Button
            onClick={handleSend}
            disabled={status !== "ready" || loading || !input.trim()}
            size="icon"
            className="shrink-0 h-[68px] w-10"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2">
          Shift+Enter for new line · Enter to send · Thumbs up/down to improve memory
        </p>
      </div>
    </section>
  );
}
"use client";

import { useState } from "react";
import IngestionPanel from "@/components/IngestionPanel";
import ChatPanel from "@/components/ChatPanel";
import { Badge } from "@/components/ui/badge";

export type IngestionStatus = "idle" | "ingesting" | "ready";

export default function Home() {
  const [status, setStatus] = useState<IngestionStatus>("idle");
  const [repoPath, setRepoPath] = useState("");

  return (
    <main className="flex flex-col h-screen">
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold tracking-tight">Codekeeper</h1>
          <span className="text-xs text-muted-foreground font-mono">
            legacy code intelligence
          </span>
        </div>
        <div className="flex items-center gap-2">
          {status === "idle" && (
            <Badge variant="secondary">No codebase loaded</Badge>
          )}
          {status === "ingesting" && (
            <Badge variant="outline" className="animate-pulse">
              Building memory...
            </Badge>
          )}
          {status === "ready" && (
            <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white">
              Memory ready
            </Badge>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <IngestionPanel
          status={status}
          repoPath={repoPath}
          setRepoPath={setRepoPath}
          setStatus={setStatus}
        />
        <ChatPanel status={status} />
      </div>
    </main>
  );
}
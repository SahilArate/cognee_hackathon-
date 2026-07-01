"use client";

import { useState } from "react";
import { FolderOpen, Brain, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { IngestionStatus } from "@/app/page";

interface Props {
  status: IngestionStatus;
  repoPath: string;
  setRepoPath: (path: string) => void;
  setStatus: (status: IngestionStatus) => void;
}

interface IngestionResult {
  files_remembered: number;
  commits_remembered: number;
  docs_remembered: number;
}

export default function IngestionPanel({
  status,
  repoPath,
  setRepoPath,
  setStatus,
}: Props) {
  const [result, setResult] = useState<IngestionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleIngest() {
    if (!repoPath.trim()) return;

    setStatus("ingesting");
    setError(null);
    setResult(null);

    try {
      const response = await fetch("http://localhost:8000/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo_path: repoPath.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail ?? "Ingestion failed");
      }

      const data: IngestionResult = await response.json();
      setResult(data);
      setStatus("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStatus("idle");
    }
  }

  return (
    <aside className="w-80 border-r border-border flex flex-col gap-6 p-6 shrink-0">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Brain className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-sm font-medium">Load Codebase</h2>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Point Codekeeper at a local repository. It will read every source
          file, git commit, and doc into memory so you can ask questions about
          the whole system — not just the files you have open.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="repo-path" className="text-xs">
            Repository path
          </Label>
          <div className="flex gap-2">
            <Input
              id="repo-path"
              placeholder="D:\projects\legacy-app"
              value={repoPath}
              onChange={(e) => setRepoPath(e.target.value)}
              disabled={status === "ingesting"}
              className="font-mono text-xs"
            />
          </div>
        </div>

        <Button
          onClick={handleIngest}
          disabled={status === "ingesting" || !repoPath.trim()}
          className="w-full"
        >
          {status === "ingesting" ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Building memory...
            </>
          ) : (
            <>
              <FolderOpen className="w-4 h-4 mr-2" />
              Load into memory
            </>
          )}
        </Button>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2">
          <p className="text-xs text-destructive">{error}</p>
        </div>
      )}

      {result && (
        <div className="rounded-md bg-emerald-950/40 border border-emerald-800/30 px-4 py-3 flex flex-col gap-2">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-medium text-emerald-400">
              Memory built successfully
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="flex flex-col">
              <span className="text-lg font-bold text-emerald-300">
                {result.files_remembered}
              </span>
              <span className="text-[10px] text-muted-foreground">files</span>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-emerald-300">
                {result.commits_remembered}
              </span>
              <span className="text-[10px] text-muted-foreground">commits</span>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-emerald-300">
                {result.docs_remembered}
              </span>
              <span className="text-[10px] text-muted-foreground">docs</span>
            </div>
          </div>
        </div>
      )}

      <div className="mt-auto flex flex-col gap-1.5">
        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
          What gets remembered
        </p>
        <ul className="flex flex-col gap-1">
          {[
            "Python source files",
            "Git commit messages",
            "README and docs",
          ].map((item) => (
            <li key={item} className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="w-1 h-1 rounded-full bg-muted-foreground shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
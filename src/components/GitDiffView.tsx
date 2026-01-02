import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { X, Copy, Check } from "lucide-react";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
interface GitDiff {
  file: string;
  content: string;
  staged: boolean;
}
interface GitDiffViewProps {
  projectPath: string;
  file: string;
  staged: boolean;
  onClose: () => void;
}
export default function GitDiffView({
  projectPath,
  file,
  staged,
  onClose,
}: GitDiffViewProps) {
  const [diff, setDiff] = useState<GitDiff | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const isCommandNotFoundError = (err: unknown) => {
    const msg = String(err);
    return msg.includes("Command") && msg.toLowerCase().includes("not found");
  };
  const invokeWithFallback = async <T,>(
    names: string[],
    args: Record<string, unknown>
  ): Promise<T> => {
    let lastErr: unknown;
    for (const name of names) {
      try {
        return await invoke<T>(name, args);
      } catch (err) {
        lastErr = err;
        if (!isCommandNotFoundError(err)) throw err;
      }
    }
    throw lastErr;
  };
  useEffect(() => {
    const fetchDiff = async () => {
      setIsLoading(true);
      try {
        const gitDiff = await invokeWithFallback<GitDiff>(
          ["git_diff", "git::git_diff"],
          { cwd: projectPath, file, staged }
        );
        setDiff(gitDiff);
      } catch (err) {
        console.error("Diff error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDiff();
  }, [projectPath, file, staged]);
  const handleCopy = () => {
    if (diff) {
      navigator.clipboard.writeText(diff.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  const parseDiff = (diffContent: string) => {
    const lines = diffContent.split("\n");
    const parsed: Array<{
      type: "header" | "add" | "remove" | "context" | "hunk";
      content: string;
    }> = [];
    for (const line of lines) {
      if (line.startsWith("diff --git") || line.startsWith("index ")) {
        parsed.push({ type: "header", content: line });
      } else if (line.startsWith("@@")) {
        parsed.push({ type: "hunk", content: line });
      } else if (line.startsWith("+")) {
        parsed.push({ type: "add", content: line });
      } else if (line.startsWith("-")) {
        parsed.push({ type: "remove", content: line });
      } else {
        parsed.push({ type: "context", content: line });
      }
    }
    return parsed;
  };
  const getLineStyle = (
    type: "header" | "add" | "remove" | "context" | "hunk"
  ) => {
    switch (type) {
      case "header":
        return "text-gray-500 bg-[#1e1e1e]";
      case "hunk":
        return "text-blue-400 bg-[#1e3a5f]";
      case "add":
        return "text-green-400 bg-[#1a2f1a]";
      case "remove":
        return "text-red-400 bg-[#2f1a1a]";
      case "context":
        return "text-gray-300 bg-[#1e1e1e]";
      default:
        return "text-gray-300 bg-[#1e1e1e]";
    }
  };
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
      <div className="bg-[#1e1e1e] border border-[#333] rounded-lg w-[90%] h-[90%] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#333]">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCopy}
              className="h-8 w-8 text-gray-400 hover:text-white"
              title="Copy Diff"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </Button>
            <div className="flex flex-col">
              <h2 className="text-sm font-semibold text-white">{file}</h2>
              <span className="text-xs text-gray-400">
                {staged ? "Staged Changes" : "Unstaged Changes"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 text-gray-400 hover:text-white"
              title="Close"
            >
              <X size={16} />
            </Button>
          </div>
        </div>
        {/* Diff Content */}
        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-400 text-sm">Loading diff...</div>
            </div>
          ) : diff && diff.content ? (
            <div className="font-mono text-xs">
              {parseDiff(diff.content).map((line, index) => (
                <div
                  key={index}
                  className={`px-4 py-0.5 ${getLineStyle(
                    line.type
                  )} whitespace-pre`}
                >
                  {line.content}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-400 text-sm">No changes to display</div>
            </div>
          )}
        </ScrollArea>
        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-[#333] bg-[#252526]">
          <div className="text-xs text-gray-400">
            Use <kbd className="px-1 py-0.5 bg-[#3c3c3c] rounded">Esc</kbd> to
            close
          </div>
          <Button
            onClick={onClose}
            className="h-7 px-3 text-xs bg-[#007fd4] hover:bg-[#006bb3]"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useEditorStore } from "../lib/store";
import { RefreshCw, Check, Play, GitCommit } from "lucide-react";
import { Button } from "./ui/button";

interface GitFile {
  status: string;
  path: string;
}

export default function GitView() {
  const { projectPath } = useEditorStore();
  const [files, setFiles] = useState<GitFile[]>([]);
  const [commitMessage, setCommitMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    if (!projectPath) return;
    setIsLoading(true);
    setError(null);
    try {
      const parsedFiles = await invoke<GitFile[]>("git_status", {
        cwd: projectPath,
      });

      setFiles(parsedFiles);
    } catch (err) {
      console.error("Git status error:", err);
      setError("Failed to get git status. Is this a git repo?");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCommit = async () => {
    if (!projectPath || !commitMessage) return;
    setIsLoading(true);
    try {
      await invoke("git_add", {
        cwd: projectPath,
        files: ["."],
      });

      await invoke("git_commit", {
        cwd: projectPath,
        message: commitMessage,
      });

      setCommitMessage("");
      await fetchStatus();
    } catch (err) {
      console.error("Commit error:", err);
      setError("Failed to commit changes.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [projectPath]);

  if (!projectPath) {
    return (
      <div className="p-4 text-gray-400 text-sm text-center">
        Open a folder to use Source Control
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] border-r border-[#333] w-64">
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#333]">
        <span className="text-xs font-bold text-gray-400 uppercase">
          Source Control
        </span>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchStatus}
            className="h-6 w-6 text-gray-400 hover:text-white"
            title="Refresh"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
          </Button>
        </div>
      </div>

      <div className="p-2 border-b border-[#333] space-y-2">
        <textarea
          className="w-full bg-[#3c3c3c] text-white text-sm p-2 rounded border border-[#333] focus:border-[#007fd4] outline-none resize-none h-20"
          placeholder="Message (Ctrl+Enter to commit)"
          value={commitMessage}
          onChange={(e) => setCommitMessage(e.target.value)}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
              handleCommit();
            }
          }}
        />
        <Button
          onClick={handleCommit}
          disabled={isLoading || files.length === 0 || !commitMessage}
          className="w-full bg-[#007fd4] hover:bg-[#006bb3] text-white h-8 text-xs"
        >
          <GitCommit size={14} className="mr-2" /> Commit
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {error ? (
          <div className="p-4 text-red-400 text-xs">{error}</div>
        ) : files.length === 0 ? (
          <div className="p-4 text-gray-500 text-xs text-center">
            No changes detected.
          </div>
        ) : (
          <div className="py-2">
            <div className="px-4 pb-2 text-xs font-bold text-gray-400 uppercase flex justify-between">
              <span>Changes</span>
              <span className="bg-[#333] px-1.5 rounded-full text-[10px]">
                {files.length}
              </span>
            </div>
            {files.map((file) => (
              <div
                key={file.path}
                className="px-4 py-1 hover:bg-[#2a2d2e] cursor-pointer flex items-center gap-2 group"
              >
                <span
                  className={`text-[10px] font-bold w-4 text-center ${
                    file.status.includes("M")
                      ? "text-yellow-500"
                      : file.status.includes("A") || file.status.includes("??")
                      ? "text-green-500"
                      : "text-red-500"
                  }`}
                >
                  {file.status.includes("??") ? "U" : file.status[0]}
                </span>
                <span
                  className="text-sm text-gray-300 truncate flex-1"
                  title={file.path}
                >
                  {file.path}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

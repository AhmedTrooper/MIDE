import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useEditorStore } from "../lib/store";
import {
  RefreshCw,
  GitCommit,
  GitBranch,
  GitPullRequest,
  Plus,
  Minus,
  RotateCcw,
  Upload,
  Download,
  History,
  FolderGit,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Check,
  X,
  Archive,
  FileText,
} from "lucide-react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { ScrollArea } from "./ui/scroll-area";
import { Badge } from "./ui/badge";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from "./ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";
import GitDiffView from "./GitDiffView";

interface GitFile {
  status: string;
  path: string;
}

interface GitStatus {
  branch: string;
  files: GitFile[];
  ahead: number;
  behind: number;
}

interface GitBranch {
  name: string;
  current: boolean;
  remote: string;
}

interface GitCommitInfo {
  hash: string;
  author: string;
  email: string;
  timestamp: number;
  message: string;
  body: string;
}


type ViewMode =
  | "changes"
  | "history"
  | "branches"
  | "pullrequests"
  | "issues"
  | "actions"
  | "releases";

export default function GitView() {
  const { projectPath } = useEditorStore();
  const [status, setStatus] = useState<GitStatus | null>(null);
  const [branches, setBranches] = useState<GitBranch[]>([]);
  const [commits, setCommits] = useState<GitCommitInfo[]>([]);
  const [commitMessage, setCommitMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("changes");
  const [useGitHubCLI, setUseGitHubCLI] = useState(false);
  const [ghAuthenticated, setGhAuthenticated] = useState(false);
  const [pullRequests, setPullRequests] = useState<any[]>([]);
  const [issues, setIssues] = useState<any[]>([]);
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [releases, setReleases] = useState<any[]>([]);
  const [expandedSections, setExpandedSections] = useState({
    staged: true,
    unstaged: true,
  });
  const [newBranchName, setNewBranchName] = useState("");
  const [showBranchInput, setShowBranchInput] = useState(false);
  // Tag management removed
  const [diffView, setDiffView] = useState<{
    file: string;
    staged: boolean;
  } | null>(null);

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

  const fetchStatus = async () => {
    if (!projectPath) return;
    setIsLoading(true);
    setError(null);
    try {
      const gitStatus = await invokeWithFallback<GitStatus>(
        ["git_status_full", "git::git_status_full"],
        { cwd: projectPath }
      );
      setStatus(gitStatus);
    } catch (err) {
      console.error("Git status error:", err);
      setError(`Git Error: ${err}`);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBranches = async () => {
    if (!projectPath) return;
    try {
      const branchList = await invokeWithFallback<GitBranch[]>(
        ["git_branches", "git::git_branches"],
        { cwd: projectPath }
      );
      setBranches(branchList);
    } catch (err) {
      console.error("Branches error:", err);
    }
  };

  const fetchCommits = async () => {
    if (!projectPath) return;
    try {
      const commitList = await invokeWithFallback<GitCommitInfo[]>(
        ["git_log", "git::git_log"],
        { cwd: projectPath, limit: 50 }
      );
      setCommits(commitList);
    } catch (err) {
      console.error("Log error:", err);
    }
  };

  const handleStageFile = async (file: string) => {
    if (!projectPath) return;
    try {
      await invokeWithFallback<void>(["git_add", "git::git_add"], {
        cwd: projectPath,
        files: [file],
      });
      await fetchStatus();
    } catch (err) {
      setError(`Failed to stage: ${err}`);
    }
  };

  const handleUnstageFile = async (file: string) => {
    if (!projectPath) return;
    try {
      await invokeWithFallback<void>(["git_unstage", "git::git_unstage"], {
        cwd: projectPath,
        files: [file],
      });
      await fetchStatus();
    } catch (err) {
      setError(`Failed to unstage: ${err}`);
    }
  };

  const handleDiscardFile = async (file: string) => {
    if (!projectPath || !confirm(`Discard changes to ${file}?`)) return;
    try {
      await invokeWithFallback<void>(["git_discard", "git::git_discard"], {
        cwd: projectPath,
        files: [file],
      });
      await fetchStatus();
    } catch (err) {
      setError(`Failed to discard: ${err}`);
    }
  };

  const handleStageAll = async () => {
    if (!projectPath) return;
    try {
      await invokeWithFallback<void>(["git_add", "git::git_add"], {
        cwd: projectPath,
        files: ["."],
      });
      await fetchStatus();
    } catch (err) {
      setError(`Failed to stage all: ${err}`);
    }
  };

  const handleUnstageAll = async () => {
    if (!projectPath) return;
    try {
      await invokeWithFallback<void>(["git_unstage", "git::git_unstage"], {
        cwd: projectPath,
        files: ["."],
      });
      await fetchStatus();
    } catch (err) {
      setError(`Failed to unstage all: ${err}`);
    }
  };

  const handleCommit = async () => {
    if (!projectPath || !commitMessage) return;
    setIsLoading(true);
    try {
      await invokeWithFallback<string>(["git_commit", "git::git_commit"], {
        cwd: projectPath,
        message: commitMessage,
      });
      setCommitMessage("");
      await fetchStatus();
      if (viewMode === "history") await fetchCommits();
    } catch (err) {
      console.error("Commit error:", err);
      setError(`Commit failed: ${err}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePull = async () => {
    if (!projectPath) return;
    setIsLoading(true);
    try {
      await invokeWithFallback<string>(["git_pull", "git::git_pull"], {
        cwd: projectPath,
      });
      await fetchStatus();
      setError(null);
    } catch (err) {
      setError(`Pull failed: ${err}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePush = async () => {
    if (!projectPath || !status) return;
    setIsLoading(true);
    try {
      await invokeWithFallback<string>(["git_push", "git::git_push"], {
        cwd: projectPath,
        setUpstream: false,
        branch: status.branch,
      });
      await fetchStatus();
      setError(null);
    } catch (err) {
      setError(`Push failed: ${err}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCommitAndPush = async () => {
    if (!projectPath || !commitMessage || stagedFiles.length === 0) return;
    setIsLoading(true);
    try {
      await invokeWithFallback<string>(["git_commit", "git::git_commit"], {
        cwd: projectPath,
        message: commitMessage,
      });
      setCommitMessage("");

      await invokeWithFallback<string>(["git_push", "git::git_push"], {
        cwd: projectPath,
        setUpstream: false,
        branch: status?.branch || "main",
      });

      await fetchStatus();
      if (viewMode === "history") await fetchCommits();
      setError(null);
    } catch (err) {
      console.error("Commit & Push error:", err);
      setError(`Commit & Push failed: ${err}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCommitAndSync = async () => {
    if (!projectPath || !commitMessage || stagedFiles.length === 0) return;
    setIsLoading(true);
    try {
      // Pull first
      await invokeWithFallback<string>(["git_pull", "git::git_pull"], {
        cwd: projectPath,
      });

      // Then commit
      await invokeWithFallback<string>(["git_commit", "git::git_commit"], {
        cwd: projectPath,
        message: commitMessage,
      });
      setCommitMessage("");

      // Then push
      await invokeWithFallback<string>(["git_push", "git::git_push"], {
        cwd: projectPath,
        setUpstream: false,
        branch: status?.branch || "main",
      });

      await fetchStatus();
      if (viewMode === "history") await fetchCommits();
      setError(null);
    } catch (err) {
      console.error("Commit & Sync error:", err);
      setError(`Commit & Sync failed: ${err}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAmendCommit = async () => {
    if (!projectPath || !commitMessage) return;
    if (!confirm("Amend the last commit? This will rewrite history.")) return;

    setIsLoading(true);
    try {
      await invokeWithFallback<string>(
        ["git_commit_amend", "git::git_commit_amend"],
        {
          cwd: projectPath,
          message: commitMessage,
        }
      );
      setCommitMessage("");
      await fetchStatus();
      if (viewMode === "history") await fetchCommits();
      setError(null);
    } catch (err) {
      console.error("Amend error:", err);
      setError(`Amend failed: ${err}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStageAllAndCommit = async () => {
    if (!projectPath || !commitMessage) return;
    setIsLoading(true);
    try {
      // Stage all changes
      await invokeWithFallback<void>(["git_add", "git::git_add"], {
        cwd: projectPath,
        files: ["."],
      });

      // Then commit
      await invokeWithFallback<string>(["git_commit", "git::git_commit"], {
        cwd: projectPath,
        message: commitMessage,
      });
      setCommitMessage("");
      await fetchStatus();
      if (viewMode === "history") await fetchCommits();
      setError(null);
    } catch (err) {
      console.error("Stage All & Commit error:", err);
      setError(`Stage All & Commit failed: ${err}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBranch = async () => {
    if (!projectPath || !newBranchName) return;
    try {
      await invokeWithFallback<void>(
        ["git_create_branch", "git::git_create_branch"],
        { cwd: projectPath, name: newBranchName }
      );
      await invokeWithFallback<void>(
        ["git_checkout_branch", "git::git_checkout_branch"],
        { cwd: projectPath, name: newBranchName }
      );
      setNewBranchName("");
      setShowBranchInput(false);
      await fetchBranches();
      await fetchStatus();
    } catch (err) {
      setError(`Failed to create branch: ${err}`);
    }
  };

  const handleCheckoutBranch = async (name: string) => {
    if (!projectPath) return;
    setIsLoading(true);
    try {
      await invokeWithFallback<void>(
        ["git_checkout_branch", "git::git_checkout_branch"],
        { cwd: projectPath, name }
      );
      await fetchBranches();
      await fetchStatus();
    } catch (err) {
      setError(`Failed to checkout: ${err}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteBranch = async (name: string) => {
    if (!projectPath || !confirm(`Delete branch ${name}?`)) return;
    try {
      await invokeWithFallback<void>(
        ["git_delete_branch", "git::git_delete_branch"],
        { cwd: projectPath, name, force: false }
      );
      await fetchBranches();
    } catch (err) {
      setError(`Failed to delete branch: ${err}`);
    }
  };

  const handleFetch = async () => {
    if (!projectPath) return;
    setIsLoading(true);
    try {
      await invokeWithFallback<string>(["git_fetch", "git::git_fetch"], {
        cwd: projectPath,
      });
      await fetchStatus();
      await fetchBranches();
      setError(null);
    } catch (err) {
      setError(`Fetch failed: ${err}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === "changes") fetchStatus();
    else if (viewMode === "history") fetchCommits();
    else if (viewMode === "branches") fetchBranches();
    else if (viewMode === "pullrequests" && useGitHubCLI) fetchPullRequests();
    else if (viewMode === "issues" && useGitHubCLI) fetchIssues();
    else if (viewMode === "actions" && useGitHubCLI) fetchWorkflows();
    else if (viewMode === "releases" && useGitHubCLI) fetchReleases();
  }, [projectPath, viewMode, useGitHubCLI]);

  useEffect(() => {
    if (useGitHubCLI && projectPath) {
      checkGhAuth();
    }
  }, [useGitHubCLI, projectPath]);

  // GitHub CLI functions
  const checkGhAuth = async () => {
    if (!projectPath) return;
    try {
      const result = await invoke<string>("gh_auth_status", {
        cwd: projectPath,
      });
      setGhAuthenticated(result.includes("Logged in"));
    } catch {
      setGhAuthenticated(false);
    }
  };

  const handleGhLogin = async () => {
    if (!projectPath) return;
    try {
      await invoke<string>("gh_auth_login", { cwd: projectPath });
      await checkGhAuth();
    } catch (err) {
      setError(`GitHub login failed: ${err}`);
    }
  };

  const fetchPullRequests = async () => {
    if (!projectPath) return;
    setIsLoading(true);
    try {
      const result = await invoke<string>("gh_pr_list", {
        cwd: projectPath,
        state: "open",
      });
      setPullRequests(JSON.parse(result));
    } catch (err) {
      setError(`Failed to fetch PRs: ${err}`);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchIssues = async () => {
    if (!projectPath) return;
    setIsLoading(true);
    try {
      const result = await invoke<string>("gh_issue_list", {
        cwd: projectPath,
        state: "open",
      });
      setIssues(JSON.parse(result));
    } catch (err) {
      setError(`Failed to fetch issues: ${err}`);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWorkflows = async () => {
    if (!projectPath) return;
    setIsLoading(true);
    try {
      const result = await invoke<string>("gh_workflow_list", {
        cwd: projectPath,
      });
      setWorkflows(JSON.parse(result));
    } catch (err) {
      setError(`Failed to fetch workflows: ${err}`);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReleases = async () => {
    if (!projectPath) return;
    setIsLoading(true);
    try {
      const result = await invoke<string>("gh_release_list", {
        cwd: projectPath,
      });
      setReleases(JSON.parse(result));
    } catch (err) {
      setError(`Failed to fetch releases: ${err}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePR = async () => {
    if (!projectPath) return;
    const title = prompt("PR Title:");
    if (!title) return;
    const body = prompt("PR Description:");
    try {
      await invoke<string>("gh_pr_create", {
        cwd: projectPath,
        title,
        body: body || "",
        base: "main",
      });
      await fetchPullRequests();
    } catch (err) {
      setError(`Failed to create PR: ${err}`);
    }
  };

  const handleCreateIssue = async () => {
    if (!projectPath) return;
    const title = prompt("Issue Title:");
    if (!title) return;
    const body = prompt("Issue Description:");
    try {
      await invoke<string>("gh_issue_create", {
        cwd: projectPath,
        title,
        body: body || "",
      });
      await fetchIssues();
    } catch (err) {
      setError(`Failed to create issue: ${err}`);
    }
  };

  useEffect(() => {
    if (viewMode === "changes") fetchStatus();
    else if (viewMode === "history") fetchCommits();
    else if (viewMode === "branches") fetchBranches();
  }, [projectPath, viewMode]);

  const getStatusIcon = (status: string) => {
    if (status.includes("M")) return { icon: "M", color: "text-blue-400" };
    if (status.includes("A") || status.includes("??"))
      return { icon: "U", color: "text-green-400" };
    if (status.includes("D")) return { icon: "D", color: "text-red-400" };
    if (status.includes("R")) return { icon: "R", color: "text-purple-400" };
    return { icon: status[0], color: "text-gray-400" };
  };

  const stagedFiles =
    status?.files.filter((f) => f.status[0] !== " " && f.status[0] !== "?") ||
    [];
  const unstagedFiles =
    status?.files.filter(
      (f) => f.status[1] !== " " || f.status.includes("??")
    ) || [];

  if (!projectPath) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-gray-400 text-sm text-center">
        <FolderGit size={48} className="mb-4 opacity-50" />
        <p>Open a folder to use Source Control</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] border-r border-[#333] w-80">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#333]">
        <span className="text-xs font-bold text-gray-400 uppercase">
          {useGitHubCLI ? "GitHub" : "Source Control"}
        </span>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setUseGitHubCLI(!useGitHubCLI)}
            className={`h-6 w-6 ${
              useGitHubCLI
                ? "text-white bg-[#3e3e42]"
                : "text-gray-400 hover:text-white"
            }`}
            title={useGitHubCLI ? "Switch to Git" : "Switch to GitHub CLI"}
          >
            <GitBranch size={14} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (viewMode === "changes") fetchStatus();
              else if (viewMode === "history") fetchCommits();
              else if (viewMode === "branches") fetchBranches();
              else if (viewMode === "pullrequests") fetchPullRequests();
              else if (viewMode === "issues") fetchIssues();
              else if (viewMode === "actions") fetchWorkflows();
              else if (viewMode === "releases") fetchReleases();
            }}
            className="h-6 w-6 text-gray-400 hover:text-white"
            title="Refresh"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-gray-400 hover:text-white"
              >
                <MoreHorizontal size={14} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-[#2d2d30] border-[#454545] text-white">
              <DropdownMenuItem
                onClick={handlePull}
                className="hover:bg-[#3e3e42]"
              >
                <Download size={14} className="mr-2" /> Pull
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handlePush}
                className="hover:bg-[#3e3e42]"
              >
                <Upload size={14} className="mr-2" /> Push
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleFetch}
                className="hover:bg-[#3e3e42]"
              >
                <RefreshCw size={14} className="mr-2" /> Fetch
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Branch Info */}
      {status && (
        <div className="px-4 py-2 border-b border-[#333] bg-[#252526]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GitBranch size={14} className="text-gray-400" />
              <span className="text-xs text-gray-300">{status.branch}</span>
            </div>
            <div className="flex items-center gap-2">
              {status.ahead > 0 && (
                <Badge className="bg-blue-500/20 text-blue-400 text-[10px] h-4 px-1">
                  ↑{status.ahead}
                </Badge>
              )}
              {status.behind > 0 && (
                <Badge className="bg-orange-500/20 text-orange-400 text-[10px] h-4 px-1">
                  ↓{status.behind}
                </Badge>
              )}
            </div>
          </div>
        </div>
      )}

      {/* View Mode Tabs */}
      <div className="flex border-b border-[#333] bg-[#252526] overflow-x-auto">
        {!useGitHubCLI ? (
          <>
            <button
              onClick={() => setViewMode("changes")}
              className={`px-3 py-2 text-xs font-medium whitespace-nowrap ${
                viewMode === "changes"
                  ? "text-white border-b-2 border-blue-500"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <GitCommit size={12} className="inline mr-1" /> Changes
            </button>
            <button
              onClick={() => setViewMode("history")}
              className={`px-3 py-2 text-xs font-medium whitespace-nowrap ${
                viewMode === "history"
                  ? "text-white border-b-2 border-blue-500"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <History size={12} className="inline mr-1" /> History
            </button>
            <button
              onClick={() => setViewMode("branches")}
              className={`px-3 py-2 text-xs font-medium whitespace-nowrap ${
                viewMode === "branches"
                  ? "text-white border-b-2 border-blue-500"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <GitBranch size={12} className="inline mr-1" /> Branches
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setViewMode("pullrequests")}
              className={`px-3 py-2 text-xs font-medium whitespace-nowrap ${
                viewMode === "pullrequests"
                  ? "text-white border-b-2 border-blue-500"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <GitPullRequest size={12} className="inline mr-1" /> Pull Requests
            </button>
            <button
              onClick={() => setViewMode("issues")}
              className={`px-3 py-2 text-xs font-medium whitespace-nowrap ${
                viewMode === "issues"
                  ? "text-white border-b-2 border-blue-500"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <FileText size={12} className="inline mr-1" /> Issues
            </button>
            <button
              onClick={() => setViewMode("actions")}
              className={`px-3 py-2 text-xs font-medium whitespace-nowrap ${
                viewMode === "actions"
                  ? "text-white border-b-2 border-blue-500"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <RefreshCw size={12} className="inline mr-1" /> Actions
            </button>
            <button
              onClick={() => setViewMode("releases")}
              className={`px-3 py-2 text-xs font-medium whitespace-nowrap ${
                viewMode === "releases"
                  ? "text-white border-b-2 border-blue-500"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Archive size={12} className="inline mr-1" /> Releases
            </button>
          </>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mx-2 mt-2 p-2 bg-red-500/10 border border-red-500/30 rounded text-xs text-red-400">
          {error}
          <button
            onClick={() => setError(null)}
            className="float-right text-red-400 hover:text-red-300"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* Content Area */}
      {viewMode === "changes" && (
        <>
          {/* Commit Section */}
          {(stagedFiles.length > 0 || unstagedFiles.length > 0) && (
            <div className="p-2 border-b border-[#333] space-y-2">
              <Textarea
                className="min-h-20 bg-[#3c3c3c] border-[#333] focus-visible:ring-[#007fd4] resize-none text-xs text-white placeholder:text-gray-500"
                placeholder="Commit message (Ctrl+Enter to commit)"
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                    handleCommit();
                  }
                }}
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleCommit}
                  disabled={
                    isLoading || stagedFiles.length === 0 || !commitMessage
                  }
                  className="flex-1 bg-[#007fd4] hover:bg-[#006bb3] text-white h-7 text-xs"
                >
                  <GitCommit size={14} className="mr-2" /> Commit
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-gray-400 hover:text-white hover:bg-[#3e3e42]"
                      disabled={
                        isLoading || stagedFiles.length === 0 || !commitMessage
                      }
                    >
                      <ChevronDown size={14} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="bg-[#2d2d30] border-[#454545] text-white min-w-50"
                    align="end"
                  >
                    <DropdownMenuItem
                      onClick={handleCommitAndPush}
                      className="hover:bg-[#3e3e42] cursor-pointer text-gray-300 focus:bg-[#3e3e42] focus:text-white"
                    >
                      <Upload size={14} className="mr-2" /> Commit & Push
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleCommitAndSync}
                      className="hover:bg-[#3e3e42] cursor-pointer text-gray-300 focus:bg-[#3e3e42] focus:text-white"
                    >
                      <RefreshCw size={14} className="mr-2" /> Commit & Sync
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-[#454545]" />
                    <DropdownMenuItem
                      onClick={handleStageAllAndCommit}
                      disabled={unstagedFiles.length === 0}
                      className="hover:bg-[#3e3e42] cursor-pointer text-gray-300 focus:bg-[#3e3e42] focus:text-white"
                    >
                      <Plus size={14} className="mr-2" /> Stage All & Commit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleAmendCommit}
                      className="hover:bg-[#3e3e42] cursor-pointer text-gray-300 focus:bg-[#3e3e42] focus:text-white"
                    >
                      <GitCommit size={14} className="mr-2" /> Amend Last Commit
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )}

          <ScrollArea className="flex-1">
            {/* Staged Files */}
            {stagedFiles.length > 0 && (
              <div className="py-2">
                <div
                  className="px-4 pb-2 flex items-center justify-between cursor-pointer hover:bg-[#2a2d2e]"
                  onClick={() =>
                    setExpandedSections((prev) => ({
                      ...prev,
                      staged: !prev.staged,
                    }))
                  }
                >
                  <div className="flex items-center gap-2">
                    {expandedSections.staged ? (
                      <ChevronDown size={14} className="text-gray-400" />
                    ) : (
                      <ChevronRight size={14} className="text-gray-400" />
                    )}
                    <span className="text-xs font-bold text-gray-400 uppercase">
                      Staged Changes
                    </span>
                    <Badge className="h-5 px-1.5 text-[10px] bg-[#333] hover:bg-[#333] text-gray-300 rounded-full">
                      {stagedFiles.length}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUnstageAll();
                    }}
                    className="h-5 w-5"
                    title="Unstage All"
                  >
                    <Minus size={12} />
                  </Button>
                </div>
                {expandedSections.staged &&
                  stagedFiles.map((file, index) => {
                    const { icon, color } = getStatusIcon(file.status);
                    return (
                      <ContextMenu key={file.path || `staged-${index}`}>
                        <ContextMenuTrigger asChild>
                          <div className="px-4 py-1 hover:bg-[#2a2d2e] cursor-pointer flex items-center gap-2 group">
                            <Badge
                              className={`h-5 w-5 p-0 flex items-center justify-center border-none text-[10px] font-bold ${color}`}
                            >
                              {icon}
                            </Badge>
                            <span className="text-sm text-gray-300 truncate flex-1">
                              {file.path}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleUnstageFile(file.path)}
                              className="h-5 w-5 opacity-0 group-hover:opacity-100"
                              title="Unstage"
                            >
                              <Minus size={12} />
                            </Button>
                          </div>
                        </ContextMenuTrigger>
                        <ContextMenuContent className="bg-[#2d2d30] border-[#454545] text-white">
                          <ContextMenuItem
                            onClick={() => handleUnstageFile(file.path)}
                            className="hover:bg-[#3e3e42]"
                          >
                            <Minus size={14} className="mr-2" /> Unstage Changes
                          </ContextMenuItem>
                          <ContextMenuSeparator className="bg-[#454545]" />
                          <ContextMenuItem className="hover:bg-[#3e3e42]">
                            Open File
                          </ContextMenuItem>
                          <ContextMenuItem
                            onClick={() =>
                              setDiffView({ file: file.path, staged: true })
                            }
                            className="hover:bg-[#3e3e42]"
                          >
                            <FileText size={14} className="mr-2" /> View Changes
                          </ContextMenuItem>
                        </ContextMenuContent>
                      </ContextMenu>
                    );
                  })}
              </div>
            )}

            {/* Unstaged Files */}
            {unstagedFiles.length > 0 && (
              <div className="py-2">
                <div
                  className="px-4 pb-2 flex items-center justify-between cursor-pointer hover:bg-[#2a2d2e]"
                  onClick={() =>
                    setExpandedSections((prev) => ({
                      ...prev,
                      unstaged: !prev.unstaged,
                    }))
                  }
                >
                  <div className="flex items-center gap-2">
                    {expandedSections.unstaged ? (
                      <ChevronDown size={14} className="text-gray-400" />
                    ) : (
                      <ChevronRight size={14} className="text-gray-400" />
                    )}
                    <span className="text-xs font-bold text-gray-400 uppercase">
                      Changes
                    </span>
                    <Badge className="h-5 px-1.5 text-[10px] bg-[#333] hover:bg-[#333] text-gray-300 rounded-full">
                      {unstagedFiles.length}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStageAll();
                    }}
                    className="h-5 w-5"
                    title="Stage All"
                  >
                    <Plus size={12} />
                  </Button>
                </div>
                {expandedSections.unstaged &&
                  unstagedFiles.map((file, index) => {
                    const { icon, color } = getStatusIcon(file.status);
                    return (
                      <ContextMenu key={file.path || `unstaged-${index}`}>
                        <ContextMenuTrigger asChild>
                          <div className="px-4 py-1 hover:bg-[#2a2d2e] cursor-pointer flex items-center gap-2 group">
                            <Badge
                              className={`h-5 w-5 p-0 flex items-center justify-center border-none text-[10px] font-bold ${color}`}
                            >
                              {icon}
                            </Badge>
                            <span className="text-sm text-gray-300 truncate flex-1">
                              {file.path}
                            </span>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDiscardFile(file.path)}
                                className="h-5 w-5"
                                title="Discard"
                              >
                                <RotateCcw size={12} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleStageFile(file.path)}
                                className="h-5 w-5"
                                title="Stage"
                              >
                                <Plus size={12} />
                              </Button>
                            </div>
                          </div>
                        </ContextMenuTrigger>
                        <ContextMenuContent className="bg-[#2d2d30] border-[#454545] text-white">
                          <ContextMenuItem
                            onClick={() => handleStageFile(file.path)}
                            className="hover:bg-[#3e3e42]"
                          >
                            <Plus size={14} className="mr-2" /> Stage Changes
                          </ContextMenuItem>
                          <ContextMenuItem
                            onClick={() => handleDiscardFile(file.path)}
                            className="hover:bg-[#3e3e42]"
                          >
                            <RotateCcw size={14} className="mr-2" /> Discard
                            Changes
                          </ContextMenuItem>
                          <ContextMenuSeparator className="bg-[#454545]" />
                          <ContextMenuItem className="hover:bg-[#3e3e42]">
                            Open File
                          </ContextMenuItem>
                          <ContextMenuItem
                            onClick={() =>
                              setDiffView({ file: file.path, staged: false })
                            }
                            className="hover:bg-[#3e3e42]"
                          >
                            <FileText size={14} className="mr-2" /> View Changes
                          </ContextMenuItem>
                        </ContextMenuContent>
                      </ContextMenu>
                    );
                  })}
              </div>
            )}

            {stagedFiles.length === 0 && unstagedFiles.length === 0 && (
              <div className="p-4 text-gray-500 text-xs text-center">
                <Check size={24} className="mx-auto mb-2 text-green-500" />
                No changes detected.
              </div>
            )}
          </ScrollArea>
        </>
      )}

      {viewMode === "history" && (
        <ScrollArea className="flex-1">
          {commits.length === 0 ? (
            <div className="p-4 text-gray-500 text-xs text-center">
              No commits yet.
            </div>
          ) : (
            <div className="py-2">
              {commits.map((commit, index) => (
                <div
                  key={commit.hash || `commit-${index}`}
                  className="px-4 py-3 hover:bg-[#2a2d2e] border-b border-[#333] cursor-pointer"
                >
                  <div className="flex items-start gap-2">
                    <GitCommit size={14} className="text-gray-400 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white mb-1 truncate">
                        {commit.message}
                      </div>
                      <div className="text-xs text-gray-400">
                        {commit.author} •{" "}
                        {new Date(commit.timestamp * 1000).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500 mt-1 font-mono">
                        {commit.hash.substring(0, 7)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      )}

      {viewMode === "branches" && (
        <>
          <div className="p-2 border-b border-[#333]">
            {showBranchInput ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreateBranch();
                    if (e.key === "Escape") {
                      setShowBranchInput(false);
                      setNewBranchName("");
                    }
                  }}
                  placeholder="Branch name..."
                  className="flex-1 px-2 py-1 bg-[#3c3c3c] border border-[#333] rounded text-xs text-white"
                  autoFocus
                />
                <Button
                  onClick={handleCreateBranch}
                  className="h-7 px-2 bg-[#007fd4] hover:bg-[#006bb3]"
                >
                  <Check size={14} />
                </Button>
                <Button
                  onClick={() => {
                    setShowBranchInput(false);
                    setNewBranchName("");
                  }}
                  variant="ghost"
                  className="h-7 px-2"
                >
                  <X size={14} />
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => setShowBranchInput(true)}
                className="w-full h-7 text-xs bg-[#007fd4] hover:bg-[#006bb3]"
              >
                <Plus size={14} className="mr-2" /> New Branch
              </Button>
            )}
          </div>
          <ScrollArea className="flex-1">
            {branches.map((branch, index) => (
              <ContextMenu key={branch.name || `branch-${index}`}>
                <ContextMenuTrigger asChild>
                  <div
                    className={`px-4 py-2 hover:bg-[#2a2d2e] cursor-pointer flex items-center gap-2 ${
                      branch.current ? "bg-[#2a2d2e]" : ""
                    }`}
                    onClick={() =>
                      !branch.current && handleCheckoutBranch(branch.name)
                    }
                  >
                    <GitBranch
                      size={14}
                      className={
                        branch.current ? "text-blue-400" : "text-gray-400"
                      }
                    />
                    <span
                      className={`text-sm flex-1 ${
                        branch.current
                          ? "text-blue-400 font-semibold"
                          : "text-gray-300"
                      }`}
                    >
                      {branch.name}
                    </span>
                    {branch.current && (
                      <Check size={14} className="text-blue-400" />
                    )}
                  </div>
                </ContextMenuTrigger>
                <ContextMenuContent className="bg-[#2d2d30] border-[#454545] text-white">
                  {!branch.current && (
                    <>
                      <ContextMenuItem
                        onClick={() => handleCheckoutBranch(branch.name)}
                        className="hover:bg-[#3e3e42]"
                      >
                        <GitBranch size={14} className="mr-2" /> Checkout
                      </ContextMenuItem>
                      <ContextMenuSeparator className="bg-[#454545]" />
                    </>
                  )}
                  <ContextMenuItem
                    onClick={() => handleDeleteBranch(branch.name)}
                    disabled={branch.current}
                    className="hover:bg-[#3e3e42]"
                  >
                    <X size={14} className="mr-2" /> Delete
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            ))}
          </ScrollArea>
        </>
      )}

      {/* GitHub CLI Pull Requests View */}
      {viewMode === "pullrequests" && useGitHubCLI && (
        <>
          {!ghAuthenticated ? (
            <div className="flex flex-col items-center justify-center h-full p-4">
              <p className="text-gray-400 text-sm mb-4">
                Not authenticated with GitHub
              </p>
              <Button
                onClick={handleGhLogin}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Login to GitHub
              </Button>
            </div>
          ) : (
            <>
              <div className="p-2 border-b border-[#333]">
                <Button
                  onClick={handleCreatePR}
                  className="w-full text-xs bg-blue-600 hover:bg-blue-700"
                >
                  <Plus size={14} className="mr-2" /> Create Pull Request
                </Button>
              </div>
              <ScrollArea className="flex-1">
                {pullRequests.length === 0 ? (
                  <div className="p-4 text-center text-gray-400 text-xs">
                    No open pull requests
                  </div>
                ) : (
                  <div className="py-2">
                    {pullRequests.map((pr, index) => (
                      <div
                        key={pr.number || index}
                        className="px-4 py-3 hover:bg-[#2a2d2e] border-b border-[#333] cursor-pointer"
                      >
                        <div className="flex items-start gap-2">
                          <GitPullRequest
                            size={14}
                            className="text-green-400 mt-0.5"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-white mb-1">
                              #{pr.number} {pr.title}
                            </div>
                            <div className="text-xs text-gray-400">
                              by {pr.author?.login} •{" "}
                              {new Date(pr.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </>
          )}
        </>
      )}

      {/* GitHub CLI Issues View */}
      {viewMode === "issues" && useGitHubCLI && (
        <>
          {!ghAuthenticated ? (
            <div className="flex flex-col items-center justify-center h-full p-4">
              <p className="text-gray-400 text-sm mb-4">
                Not authenticated with GitHub
              </p>
              <Button
                onClick={handleGhLogin}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Login to GitHub
              </Button>
            </div>
          ) : (
            <>
              <div className="p-2 border-b border-[#333]">
                <Button
                  onClick={handleCreateIssue}
                  className="w-full text-xs bg-blue-600 hover:bg-blue-700"
                >
                  <Plus size={14} className="mr-2" /> Create Issue
                </Button>
              </div>
              <ScrollArea className="flex-1">
                {issues.length === 0 ? (
                  <div className="p-4 text-center text-gray-400 text-xs">
                    No open issues
                  </div>
                ) : (
                  <div className="py-2">
                    {issues.map((issue, index) => (
                      <div
                        key={issue.number || index}
                        className="px-4 py-3 hover:bg-[#2a2d2e] border-b border-[#333] cursor-pointer"
                      >
                        <div className="flex items-start gap-2">
                          <FileText
                            size={14}
                            className="text-green-400 mt-0.5"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-white mb-1">
                              #{issue.number} {issue.title}
                            </div>
                            <div className="text-xs text-gray-400">
                              by {issue.author?.login} •{" "}
                              {new Date(issue.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </>
          )}
        </>
      )}

      {/* GitHub CLI Actions View */}
      {viewMode === "actions" && useGitHubCLI && (
        <>
          {!ghAuthenticated ? (
            <div className="flex flex-col items-center justify-center h-full p-4">
              <p className="text-gray-400 text-sm mb-4">
                Not authenticated with GitHub
              </p>
              <Button
                onClick={handleGhLogin}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Login to GitHub
              </Button>
            </div>
          ) : (
            <ScrollArea className="flex-1">
              {workflows.length === 0 ? (
                <div className="p-4 text-center text-gray-400 text-xs">
                  No workflows found
                </div>
              ) : (
                <div className="py-2">
                  {workflows.map((workflow, index) => (
                    <div
                      key={workflow.id || index}
                      className="px-4 py-3 hover:bg-[#2a2d2e] border-b border-[#333] cursor-pointer"
                    >
                      <div className="flex items-start gap-2">
                        <RefreshCw size={14} className="text-blue-400 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-white mb-1">
                            {workflow.name}
                          </div>
                          <div className="text-xs text-gray-400">
                            {workflow.state}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          )}
        </>
      )}

      {/* GitHub CLI Releases View */}
      {viewMode === "releases" && useGitHubCLI && (
        <>
          {!ghAuthenticated ? (
            <div className="flex flex-col items-center justify-center h-full p-4">
              <p className="text-gray-400 text-sm mb-4">
                Not authenticated with GitHub
              </p>
              <Button
                onClick={handleGhLogin}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Login to GitHub
              </Button>
            </div>
          ) : (
            <ScrollArea className="flex-1">
              {releases.length === 0 ? (
                <div className="p-4 text-center text-gray-400 text-xs">
                  No releases found
                </div>
              ) : (
                <div className="py-2">
                  {releases.map((release, index) => (
                    <div
                      key={release.tagName || index}
                      className="px-4 py-3 hover:bg-[#2a2d2e] border-b border-[#333] cursor-pointer"
                    >
                      <div className="flex items-start gap-2">
                        <Archive size={14} className="text-yellow-400 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-white mb-1">
                            {release.name || release.tagName}
                          </div>
                          <div className="text-xs text-gray-400">
                            {release.tagName} •{" "}
                            {new Date(
                              release.publishedAt || release.createdAt
                            ).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          )}
        </>
      )}

      {/* Diff Viewer Modal */}
      {diffView && projectPath && (
        <GitDiffView
          projectPath={projectPath}
          file={diffView.file}
          staged={diffView.staged}
          onClose={() => setDiffView(null)}
        />
      )}
    </div>
  );
}

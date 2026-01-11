import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useEditorStore } from "../lib/store";

import {
  GitBranch as GitBranchIcon,
  RefreshCw,
  MoreHorizontal,
  Plus,
  Check,
  X,
  ChevronRight,
  ChevronDown,
  GitCommit,
  Upload,
  Download,
  FolderGit,
  GitPullRequest,
  FileText,
  Archive,
  RotateCcw,
  Minus,
  History as HistoryIcon
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import GitDiffView from "./GitDiffView";

type ViewMode =
  | "changes"
  | "history"
  | "branches"
  | "remotes"
  | "pullrequests"
  | "issues"
  | "actions"
  | "releases";

export default function GitView() {
  const {
    projectPath,
    gitStatus: status,
    gitBranches: branches,
    gitCommits: commits,
    gitRemotes: remotes,
    isGitLoading,
    checkIfGitRepo: checkGitRepoStore,
    refreshGitStatus,
    refreshGitBranches,
    refreshGitCommits,
    refreshGitRemotes,
    stageFile,
    unstageFile,
    commitChanges,
    pushChanges,
    pullChanges,
    switchBranch,
    createBranch: createBranchStore,
    fetchChanges,
    amendCommit
  } = useEditorStore();

  const [commitMessage, setCommitMessage] = useState("");
  const isLoading = isGitLoading;
  const [error, setError] = useState<string | null>(null);
  const [isGitRepo, setIsGitRepo] = useState<boolean | null>(null);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [showInitDialog, setShowInitDialog] = useState(false);
  const [showRemoteDialog, setShowRemoteDialog] = useState(false);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [newRemoteName, setNewRemoteName] = useState("origin");
  const [newRemoteUrl, setNewRemoteUrl] = useState("");
  // const [editingRemote, setEditingRemote] = useState<GitRemote | null>(null);
  const [syncBranch, setSyncBranch] = useState("");
  const [syncRemote, setSyncRemote] = useState("origin");
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
  // const [newTagName, setNewTagName] = useState("");
  // const [showTagInput, setShowTagInput] = useState(false);
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
  const checkIfGitRepo = async () => {
    if (!projectPath) return;
    try {
      const isRepo = await checkGitRepoStore();
      setIsGitRepo(isRepo);
      if (isRepo) {
        await loadGitConfig();
      }
    } catch (err) {
      setIsGitRepo(false);
    }
  };
  const loadGitConfig = async () => {
    if (!projectPath) return;
    try {
      const name = await invokeWithFallback<string>(
        ["git_config_get", "git::git_config_get"],
        { cwd: projectPath, key: "user.name" }
      );
      setUserName(name.trim());
    } catch {
      setUserName("");
    }
    try {
      const email = await invokeWithFallback<string>(
        ["git_config_get", "git::git_config_get"],
        { cwd: projectPath, key: "user.email" }
      );
      setUserEmail(email.trim());
    } catch {
      setUserEmail("");
    }
  };
  const handleInitGit = async () => {
    if (!projectPath) return;
    try {
      await invokeWithFallback<void>(["git_init", "git::git_init"], {
        cwd: projectPath,
      });
      setIsGitRepo(true);
      setShowInitDialog(false);
      await fetchStatus();
      setError(null);
    } catch (err) {
      setError(`Failed to initialize Git: ${err}`);
    }
  };
  const handleSaveConfig = async () => {
    if (!projectPath) return;
    try {
      if (userName) {
        await invokeWithFallback<void>(
          ["git_config_set", "git::git_config_set"],
          { cwd: projectPath, key: "user.name", value: userName }
        );
      }
      if (userEmail) {
        await invokeWithFallback<void>(
          ["git_config_set", "git::git_config_set"],
          { cwd: projectPath, key: "user.email", value: userEmail }
        );
      }
      setShowConfigDialog(false);
      setError(null);
    } catch (err) {
      setError(`Failed to save config: ${err}`);
    }
  };
  const handleAddRemote = async () => {
    if (!projectPath || !newRemoteName || !newRemoteUrl) return;
    try {
      await invokeWithFallback<void>(
        ["git_add_remote", "git::git_add_remote"],
        { cwd: projectPath, name: newRemoteName, url: newRemoteUrl }
      );
      await fetchRemotes();
      setShowRemoteDialog(false);
      setNewRemoteName("origin");
      setNewRemoteUrl("");
      setError(null);
    } catch (err) {
      setError(`Failed to add remote: ${err}`);
    }
  };
  const handleRemoveRemote = async (name: string) => {
    if (!projectPath || !confirm(`Remove remote '${name}'?`)) return;
    try {
      await invokeWithFallback<void>(
        ["git_remove_remote", "git::git_remove_remote"],
        { cwd: projectPath, name }
      );
      await fetchRemotes();
      setError(null);
    } catch (err) {
      setError(`Failed to remove remote: ${err}`);
    }
  };
  const handleSyncFromRemote = async () => {
    if (!projectPath || !syncRemote || !syncBranch) return;
    try {
      await invokeWithFallback<string>(["git_fetch", "git::git_fetch"], {
        cwd: projectPath,
      });
      await invokeWithFallback<string>(["git_pull", "git::git_pull"], {
        cwd: projectPath,
      });
      await fetchStatus();
      await fetchBranches();
      setError(null);
    } catch (err) {
      setError(`Failed to sync: ${err}`);
    }
  };
  const fetchStatus = async () => {
    if (!projectPath) return;
    setError(null);
    try {
      await refreshGitStatus();
    } catch (err: any) {
      console.error("Git status error:", err);
      setError(`Git Error: ${err.message || err}`);
    }
  };
  const fetchBranches = async () => {
    if (!projectPath) return;
    try {
      await refreshGitBranches();
    } catch (err) {
      console.error("Branches error:", err);
    }
  };
  const fetchCommits = async () => {
    if (!projectPath) return;
    try {
      await refreshGitCommits();
    } catch (err) {
      console.error("Log error:", err);
    }
  };
  const fetchRemotes = async () => {
    if (!projectPath) return;
    try {
      await refreshGitRemotes();
    } catch (err) {
      console.error("Remotes error:", err);
    }
  };
  const handleStageFile = async (file: string) => {
    if (!projectPath) return;
    try {
      await stageFile(file);
    } catch (err) {
      setError(`Failed to stage: ${err}`);
    }
  };
  const handleUnstageFile = async (file: string) => {
    if (!projectPath) return;
    try {
      await unstageFile(file);
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
      await refreshGitStatus();
    } catch (err) {
      setError(`Failed to discard: ${err}`);
    }
  };
  const handleStageAll = async () => {
    if (!projectPath) return;
    try {
      await stageFile(".");
    } catch (err) {
      setError(`Failed to stage all: ${err}`);
    }
  };
  const handleUnstageAll = async () => {
    if (!projectPath) return;
    try {
      await unstageFile(".");
    } catch (err) {
      setError(`Failed to unstage all: ${err}`);
    }
  };
  const handleCommit = async () => {
    if (!projectPath || !commitMessage) return;
    try {
      await commitChanges(commitMessage);
      setCommitMessage("");
    } catch (err) {
      console.error("Commit error:", err);
      setError(`Commit failed: ${err}`);
    }
  };
  const handlePull = async () => {
    if (!projectPath) return;
    try {
      await pullChanges();
      setError(null);
    } catch (err) {
      setError(`Pull failed: ${err}`);
    }
  };
  const handlePush = async () => {
    if (!projectPath || !status) return;
    try {
      await pushChanges();
      setError(null);
    } catch (err) {
      setError(`Push failed: ${err}`);
    }
  };
  const handleCommitAndPush = async () => {
    if (!projectPath || !commitMessage) return;
    try {
      await commitChanges(commitMessage);
      setCommitMessage("");
      await pushChanges();
      setError(null);
    } catch (err) {
      console.error("Commit & Push error:", err);
      setError(`Commit & Push failed: ${err}`);
    }
  };
  const handleCommitAndSync = async () => {
    if (!projectPath || !commitMessage) return;
    try {
      await pullChanges();
      await commitChanges(commitMessage);
      setCommitMessage("");
      await pushChanges();
      setError(null);
    } catch (err) {
      console.error("Commit & Sync error:", err);
      setError(`Commit & Sync failed: ${err}`);
    }
  };
  const handleAmendCommit = async () => {
    if (!projectPath || !commitMessage) return;
    if (!confirm("Amend the last commit? This will rewrite history.")) return;
    try {
      await amendCommit(commitMessage);
      setCommitMessage("");
      setError(null);
    } catch (err) {
      console.error("Amend error:", err);
      setError(`Amend failed: ${err}`);
    }
  };
  const handleStageAllAndCommit = async () => {
    if (!projectPath || !commitMessage) return;
    try {
      await stageFile(".");
      await commitChanges(commitMessage);
      setCommitMessage("");
      setError(null);
    } catch (err) {
      console.error("Stage All & Commit error:", err);
      setError(`Stage All & Commit failed: ${err}`);
    }
  };
  const handleCreateBranch = async () => {
    if (!projectPath || !newBranchName) return;
    try {
      await createBranchStore(newBranchName);
      await switchBranch(newBranchName);
      setNewBranchName("");
      setShowBranchInput(false);
    } catch (err) {
      setError(`Failed to create branch: ${err}`);
    }
  };
  const handleCheckoutBranch = async (name: string) => {
    if (!projectPath) return;
    try {
      await switchBranch(name);
    } catch (err) {
      setError(`Failed to checkout: ${err}`);
    }
  };
  const handleDeleteBranch = async (name: string) => {
    if (!projectPath || !confirm(`Delete branch ${name}?`)) return;
    try {
      await invokeWithFallback<void>(
        ["git_delete_branch", "git::git_delete_branch"],
        { cwd: projectPath, name, force: false }
      );
      await refreshGitBranches();
    } catch (err) {
      setError(`Failed to delete branch: ${err}`);
    }
  };
  const handleFetch = async () => {
    if (!projectPath) return;
    try {
      await fetchChanges();
      setError(null);
    } catch (err) {
      setError(`Fetch failed: ${err}`);
    }
  };
  useEffect(() => {
    if (projectPath) {
      checkIfGitRepo();
    }
  }, [projectPath]);
  useEffect(() => {
    if (isGitRepo && viewMode === "changes") refreshGitStatus();
    else if (isGitRepo && viewMode === "history") refreshGitCommits();
    else if (isGitRepo && viewMode === "branches") refreshGitBranches();
    else if (isGitRepo && viewMode === "remotes") refreshGitRemotes();
    else if (viewMode === "pullrequests" && useGitHubCLI) fetchPullRequests();
    else if (viewMode === "issues" && useGitHubCLI) fetchIssues();
    else if (viewMode === "actions" && useGitHubCLI) fetchWorkflows();
    else if (viewMode === "releases" && useGitHubCLI) fetchReleases();
  }, [projectPath, viewMode, useGitHubCLI, isGitRepo]);
  useEffect(() => {
    if (useGitHubCLI && projectPath) {
      checkGhAuth();
    }
  }, [useGitHubCLI, projectPath]);
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
    try {
      const result = await invoke<string>("gh_pr_list", {
        cwd: projectPath,
        state: "open",
      });
      setPullRequests(JSON.parse(result));
    } catch (err) {
      setError(`Failed to fetch PRs: ${err}`);
    }
  };
  const fetchIssues = async () => {
    if (!projectPath) return;
    try {
      const result = await invoke<string>("gh_issue_list", {
        cwd: projectPath,
        state: "open",
      });
      setIssues(JSON.parse(result));
    } catch (err) {
      setError(`Failed to fetch issues: ${err}`);
    }
  };
  const fetchWorkflows = async () => {
    if (!projectPath) return;
    try {
      const result = await invoke<string>("gh_workflow_list", {
        cwd: projectPath,
      });
      setWorkflows(JSON.parse(result));
    } catch (err) {
      setError(`Failed to fetch workflows: ${err}`);
    }
  };
  const fetchReleases = async () => {
    if (!projectPath) return;
    try {
      const result = await invoke<string>("gh_release_list", {
        cwd: projectPath,
      });
      setReleases(JSON.parse(result));
    } catch (err) {
      setError(`Failed to fetch releases: ${err}`);
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
    else if (viewMode === "remotes") fetchRemotes();
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
  if (isGitRepo === false) {
    return (
      <div className="flex flex-col h-full bg-[#1e1e1e]">
        <div className="flex items-center justify-between px-4 py-2 border-b border-[#333]">
          <span className="text-xs font-bold text-gray-400 uppercase">
            Source Control
          </span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <FolderGit size={64} className="mb-6 text-gray-600" />
          <h2 className="text-lg font-semibold text-white mb-2">
            No Git Repository
          </h2>
          <p className="text-sm text-gray-400 mb-6 max-w-md">
            This folder is not a Git repository. Initialize Git to start version
            control.
          </p>
          <Button
            onClick={() => setShowInitDialog(true)}
            className="bg-blue-600 hover:bg-blue-700 mb-4"
          >
            <GitBranchIcon size={16} className="mr-2" />
            Initialize Repository
          </Button>
          <Button
            variant="ghost"
            onClick={checkIfGitRepo}
            className="text-gray-400 hover:text-white text-xs"
          >
            <RefreshCw size={14} className="mr-2" />
            Refresh
          </Button>
        </div>
        {/* Init Dialog */}
        {showInitDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-[500px] bg-[#252526] rounded-lg shadow-2xl border border-[#454545] flex flex-col">
              <div className="px-4 py-3 border-b border-[#333]">
                <h2 className="text-sm font-medium text-white">
                  Initialize Git Repository
                </h2>
              </div>
              <div className="p-4 space-y-4">
                <p className="text-sm text-gray-400">
                  This will create a new Git repository in:
                </p>
                <div className="bg-[#1e1e1e] p-2 rounded text-xs text-white font-mono">
                  {projectPath}
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-gray-400">User Name</label>
                  <Input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Your Name"
                    className="bg-[#3c3c3c] border-[#555] text-white placeholder:text-gray-500 h-8"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-gray-400">User Email</label>
                  <Input
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    className="bg-[#3c3c3c] border-[#555] text-white placeholder:text-gray-500 h-8"
                  />
                </div>
              </div>
              <div className="px-4 py-3 border-t border-[#333] flex justify-end gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setShowInitDialog(false)}
                  className="bg-[#3c3c3c] hover:bg-[#4c4c4c] text-white"
                >
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    await handleInitGit();
                    if (userName || userEmail) {
                      await handleSaveConfig();
                    }
                  }}
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? (
                    <RefreshCw size={14} className="mr-2 animate-spin" />
                  ) : (
                    <GitBranchIcon size={14} className="mr-2" />
                  )}
                  Initialize
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
  if (isGitRepo === null) {
    return (
      <div className="flex items-center justify-center h-full">
        <RefreshCw size={24} className="animate-spin text-gray-400" />
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
            className={`h-6 w-6 ${useGitHubCLI
              ? "text-white bg-[#3e3e42]"
              : "text-gray-400 hover:text-white"
              }`}
            title={useGitHubCLI ? "Switch to Git" : "Switch to GitHub CLI"}
          >
            <GitBranchIcon size={14} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (viewMode === "changes") fetchStatus();
              else if (viewMode === "history") fetchCommits();
              else if (viewMode === "branches") fetchBranches();
              else if (viewMode === "remotes") fetchRemotes();
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
              <DropdownMenuSeparator className="bg-[#454545]" />
              <DropdownMenuItem
                onClick={() => setShowConfigDialog(true)}
                className="hover:bg-[#3e3e42]"
              >
                <GitBranchIcon size={14} className="mr-2" /> Configure User
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
              <GitBranchIcon size={16} className="text-gray-400" />
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
      <div className="flex border-b border-[#333] bg-[#252526] overflow-x-auto flex-shrink-0 pb-3 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#424242] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-[#4e4e4e]">
        {!useGitHubCLI ? (
          <>
            <button
              onClick={() => setViewMode("changes")}
              className={`px-4 py-3 text-xs font-medium whitespace-nowrap ${viewMode === "changes"
                ? "text-white border-b-2 border-blue-500"
                : "text-gray-400 hover:text-white"
                }`}
            >
              <GitCommit size={12} className="inline mr-1" /> Changes
            </button>
            <button
              onClick={() => setViewMode("history")}
              className={`px-4 py-3 text-xs font-medium whitespace-nowrap ${viewMode === "history"
                ? "text-white border-b-2 border-blue-500"
                : "text-gray-400 hover:text-white"
                }`}
            >
              <HistoryIcon size={12} className="inline mr-1" /> History
            </button>
            <button
              onClick={() => setViewMode("branches")}
              className={`px-4 py-3 text-xs font-medium whitespace-nowrap ${viewMode === "branches"
                ? "text-white border-b-2 border-blue-500"
                : "text-gray-400 hover:text-white"
                }`}
            >
              <GitBranchIcon size={12} className="inline mr-1" /> Branches
            </button>
            <button
              onClick={() => setViewMode("remotes")}
              className={`px-4 py-3 text-xs font-medium whitespace-nowrap ${viewMode === "remotes"
                ? "text-white border-b-2 border-blue-500"
                : "text-gray-400 hover:text-white"
                }`}
            >
              <Upload size={12} className="inline mr-1" /> Remotes
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setViewMode("pullrequests")}
              className={`px-4 py-3 text-xs font-medium whitespace-nowrap ${viewMode === "pullrequests"
                ? "text-white border-b-2 border-blue-500"
                : "text-gray-400 hover:text-white"
                }`}
            >
              <GitPullRequest size={12} className="inline mr-1" /> Pull Requests
            </button>
            <button
              onClick={() => setViewMode("issues")}
              className={`px-4 py-3 text-xs font-medium whitespace-nowrap ${viewMode === "issues"
                ? "text-white border-b-2 border-blue-500"
                : "text-gray-400 hover:text-white"
                }`}
            >
              <FileText size={12} className="inline mr-1" /> Issues
            </button>
            <button
              onClick={() => setViewMode("actions")}
              className={`px-4 py-3 text-xs font-medium whitespace-nowrap ${viewMode === "actions"
                ? "text-white border-b-2 border-blue-500"
                : "text-gray-400 hover:text-white"
                }`}
            >
              <RefreshCw size={12} className="inline mr-1" /> Actions
            </button>
            <button
              onClick={() => setViewMode("releases")}
              className={`px-4 py-3 text-xs font-medium whitespace-nowrap ${viewMode === "releases"
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
        <div className="flex-1 flex flex-col min-h-0">
          {/* Commit Section */}
          {(stagedFiles.length > 0 || unstagedFiles.length > 0) && (
            <div className="p-2 border-b border-[#333] space-y-2 flex-shrink-0">
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
          <ScrollArea className="flex-1 min-h-0">
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
        </div>
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
                <Input
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
                  className="flex-1 bg-[#3c3c3c] border-[#555] text-white placeholder:text-gray-500 h-7 text-xs"
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
                    className={`px-4 py-2 hover:bg-[#2a2d2e] cursor-pointer flex items-center gap-2 ${branch.current ? "bg-[#2a2d2e]" : ""
                      }`}
                    onClick={() =>
                      !branch.current && handleCheckoutBranch(branch.name)
                    }
                  >
                    <GitBranchIcon
                      size={14}
                      className={
                        branch.current ? "text-blue-400" : "text-gray-400"
                      }
                    />
                    <span
                      className={`text-sm flex-1 ${branch.current
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
                        <GitBranchIcon size={14} className="mr-2" /> Checkout
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
      {/* Remotes View */}
      {viewMode === "remotes" && (
        <>
          <div className="p-2 border-b border-[#333] space-y-2">
            <Button
              onClick={() => setShowRemoteDialog(true)}
              className="w-full h-7 text-xs bg-[#007fd4] hover:bg-[#006bb3]"
            >
              <Plus size={14} className="mr-2" /> Add Remote
            </Button>
            {remotes.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs text-gray-400 block">
                  Quick Sync
                </label>
                <div className="flex gap-2">
                  <Select
                    value={syncRemote}
                    onValueChange={(value) => setSyncRemote(value)}
                  >
                    <SelectTrigger className="flex-1 bg-[#3c3c3c] border-[#555] text-white h-7 text-xs w-full">
                      <SelectValue placeholder="Select remote" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#2d2d30] border-[#454545] text-white">
                      {remotes.map((r) => (
                        <SelectItem
                          key={r.name}
                          value={r.name}
                          className="hover:bg-[#3e3e42] focus:bg-[#3e3e42] cursor-pointer"
                        >
                          {r.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="text"
                    value={syncBranch}
                    onChange={(e) => setSyncBranch(e.target.value)}
                    placeholder="branch"
                    className="flex-1 bg-[#3c3c3c] border-[#555] text-white placeholder:text-gray-500 h-7 text-xs"
                  />
                  <Button
                    onClick={handleSyncFromRemote}
                    disabled={!syncBranch || isLoading}
                    className="h-7 px-2 text-xs bg-blue-600 hover:bg-blue-700"
                    title="Fetch and pull from remote branch"
                  >
                    <Download size={14} />
                  </Button>
                </div>
              </div>
            )}
          </div>
          <ScrollArea className="flex-1">
            {remotes.length === 0 ? (
              <div className="p-4 text-center text-gray-400 text-xs">
                No remotes configured
              </div>
            ) : (
              <div className="py-2">
                {remotes.map((remote, index) => (
                  <ContextMenu key={remote.name || `remote-${index}`}>
                    <ContextMenuTrigger asChild>
                      <div className="px-4 py-3 hover:bg-[#2a2d2e] border-b border-[#333] cursor-pointer">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-white">
                            {remote.name}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveRemote(remote.name);
                            }}
                            className="h-6 w-6 text-gray-400 hover:text-red-400 opacity-0 group-hover:opacity-100"
                          >
                            <X size={12} />
                          </Button>
                        </div>
                        <div className="text-xs text-gray-400 font-mono break-all">
                          {remote.url}
                        </div>
                      </div>
                    </ContextMenuTrigger>
                    <ContextMenuContent className="bg-[#2d2d30] border-[#454545] text-white">
                      <ContextMenuItem
                        onClick={() =>
                          navigator.clipboard.writeText(remote.url)
                        }
                        className="hover:bg-[#3e3e42]"
                      >
                        Copy URL
                      </ContextMenuItem>
                      <ContextMenuSeparator className="bg-[#454545]" />
                      <ContextMenuItem
                        onClick={() => handleRemoveRemote(remote.name)}
                        className="hover:bg-[#3e3e42] text-red-400"
                      >
                        <X size={14} className="mr-2" /> Remove
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                ))}
              </div>
            )}
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
      {/* Config Dialog */}
      {showConfigDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-[500px] bg-[#252526] rounded-lg shadow-2xl border border-[#454545] flex flex-col">
            <div className="px-4 py-3 border-b border-[#333]">
              <h2 className="text-sm font-medium text-white">
                Git User Configuration
              </h2>
            </div>
            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <label className="text-xs text-gray-400">User Name</label>
                <Input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Your Name"
                  className="bg-[#3c3c3c] border-[#555] text-white placeholder:text-gray-500 h-8"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-gray-400">User Email</label>
                <Input
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="bg-[#3c3c3c] border-[#555] text-white placeholder:text-gray-500 h-8"
                />
              </div>
              <p className="text-xs text-gray-500">
                These settings will be saved for this repository.
              </p>
            </div>
            <div className="px-4 py-3 border-t border-[#333] flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => setShowConfigDialog(false)}
                className="bg-[#3c3c3c] hover:bg-[#4c4c4c] text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveConfig}
                disabled={isLoading || (!userName && !userEmail)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? (
                  <RefreshCw size={14} className="mr-2 animate-spin" />
                ) : (
                  <Check size={14} className="mr-2" />
                )}
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Add Remote Dialog */}
      {showRemoteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-[500px] bg-[#252526] rounded-lg shadow-2xl border border-[#454545] flex flex-col">
            <div className="px-4 py-3 border-b border-[#333]">
              <h2 className="text-sm font-medium text-white">
                Add Remote Repository
              </h2>
            </div>
            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <label className="text-xs text-gray-400">Remote Name</label>
                <Input
                  type="text"
                  value={newRemoteName}
                  onChange={(e) => setNewRemoteName(e.target.value)}
                  placeholder="origin"
                  className="bg-[#3c3c3c] border-[#555] text-white placeholder:text-gray-500 h-8"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-gray-400">Remote URL</label>
                <Input
                  type="text"
                  value={newRemoteUrl}
                  onChange={(e) => setNewRemoteUrl(e.target.value)}
                  placeholder="https://github.com/user/repo.git"
                  className="bg-[#3c3c3c] border-[#555] text-white placeholder:text-gray-500 h-8 font-mono"
                />
              </div>
              <div className="bg-[#1e1e1e] p-3 rounded text-xs space-y-1">
                <div className="text-gray-400">Examples:</div>
                <div className="text-gray-500 font-mono">
                  https://github.com/user/repo.git
                </div>
                <div className="text-gray-500 font-mono">
                  git@github.com:user/repo.git
                </div>
              </div>
            </div>
            <div className="px-4 py-3 border-t border-[#333] flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowRemoteDialog(false);
                  setNewRemoteName("origin");
                  setNewRemoteUrl("");
                }}
                className="bg-[#3c3c3c] hover:bg-[#4c4c4c] text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddRemote}
                disabled={isLoading || !newRemoteName || !newRemoteUrl}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? (
                  <RefreshCw size={14} className="mr-2 animate-spin" />
                ) : (
                  <Plus size={14} className="mr-2" />
                )}
                Add Remote
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
import { useEffect, useRef, useState } from "react";
import { useEditorStore } from "../lib/store";
import {
  X,
  Plus,
  Trash2,
  Copy,
  Settings,
  SplitSquareHorizontal,
  ChevronDown,
  Terminal as TerminalIcon,
  Play,
  RefreshCw,
  Check,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

interface VirtualEnv {
  path: string;
  type: "venv" | "virtualenv" | "conda";
}

export default function TerminalView() {
  const {
    terminals,
    activeTerminalId,
    projectPath,
    addTerminal,
    removeTerminal,
    setActiveTerminal,
    appendToTerminal,
    clearTerminal,
    activateVenvInTerminal,
    setTerminalRunning,
  } = useEditorStore();

  const [command, setCommand] = useState("");
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [detectedVenvs, setDetectedVenvs] = useState<VirtualEnv[]>([]);
  const [showVenvMenu, setShowVenvMenu] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const outputRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const listenersRef = useRef<Set<string>>(new Set());

  const activeTerminal = terminals.find((t) => t.id === activeTerminalId);

  // Auto-scroll to bottom when output changes
  useEffect(() => {
    if (activeTerminalId && outputRefs.current[activeTerminalId]) {
      outputRefs.current[activeTerminalId]?.scrollIntoView({
        behavior: "smooth",
      });
    }
  }, [activeTerminal?.output, activeTerminalId]);

  // Detect virtual environments when terminal opens
  useEffect(() => {
    if (projectPath && terminals.length > 0) {
      detectVirtualEnvironments();
    }
  }, [projectPath, terminals.length]);

  // Listen for command output from ALL terminals (only create listeners once per terminal)
  useEffect(() => {
    const setupListeners = async () => {
      for (const terminal of terminals) {
        // Skip if listeners already set up for this terminal
        if (listenersRef.current.has(terminal.id)) {
          continue;
        }

        listenersRef.current.add(terminal.id);

        // Listen for data
        listen<string>(`term-data-${terminal.id}`, (event) => {
          appendToTerminal(terminal.id, event.payload);
          setTerminalRunning(terminal.id, true);
        });

        // Listen for exit
        listen<number | null>(`term-exit-${terminal.id}`, (event) => {
          const exitCode = event.payload;
          appendToTerminal(terminal.id, ``);
          appendToTerminal(
            terminal.id,
            `Process exited with code: ${exitCode ?? 0}`
          );
          appendToTerminal(terminal.id, ``);
          setTerminalRunning(terminal.id, false);
        });

        // Listen for errors
        listen<string>(`term-error-${terminal.id}`, (event) => {
          appendToTerminal(terminal.id, `Error: ${event.payload}`);
          appendToTerminal(terminal.id, ``);
          setTerminalRunning(terminal.id, false);
        });
      }

      // Clean up listeners for removed terminals
      const currentIds = new Set(terminals.map((t) => t.id));
      listenersRef.current.forEach((id) => {
        if (!currentIds.has(id)) {
          listenersRef.current.delete(id);
        }
      });
    };

    setupListeners();
  }, [terminals.length]); // Only re-run when terminal count changes

  const detectVirtualEnvironments = async () => {
    if (!projectPath) return;

    try {
      const venvs = await invoke<VirtualEnv[]>("detect_virtual_environments", {
        projectPath,
      });
      setDetectedVenvs(venvs);

      // Auto-activate if single venv found
      if (
        venvs.length === 1 &&
        activeTerminalId &&
        activeTerminal &&
        !activeTerminal.venvActivated
      ) {
        activateVirtualEnvironment(venvs[0]);
      }
    } catch (err) {
      console.error("Failed to detect virtual environments:", err);
    }
  };

  const activateVirtualEnvironment = async (venv: VirtualEnv) => {
    if (!activeTerminalId || !activeTerminal) return;

    const activationScript = getActivationScript(venv);
    appendToTerminal(activeTerminalId, `$ ${activationScript}`);
    appendToTerminal(
      activeTerminalId,
      `✓ Activated virtual environment: ${venv.path}`
    );
    appendToTerminal(activeTerminalId, "");

    activateVenvInTerminal(activeTerminalId, venv.path);
    setShowVenvMenu(false);
  };

  const getActivationScript = (venv: VirtualEnv): string => {
    if (venv.type === "conda") {
      return `conda activate ${venv.path}`;
    }

    // For venv/virtualenv
    const isWindows = navigator.platform.toLowerCase().includes("win");
    if (isWindows) {
      return `${venv.path}\\Scripts\\activate.bat`;
    }
    return `source ${venv.path}/bin/activate`;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && command.trim()) {
      executeCommand(command);
      setCommandHistory((prev) => [...prev, command]);
      setHistoryIndex(-1);
      setCommand("");
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex =
          historyIndex === -1
            ? commandHistory.length - 1
            : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setCommand(commandHistory[newIndex]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1;
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1);
          setCommand("");
        } else {
          setHistoryIndex(newIndex);
          setCommand(commandHistory[newIndex]);
        }
      }
    } else if (e.key === "c" && e.ctrlKey) {
      e.preventDefault();
      appendToTerminal(activeTerminalId!, "^C");
    }
  };

  const executeCommand = async (cmd: string) => {
    if (!activeTerminal) return;

    // Display command with proper prompt
    appendToTerminal(activeTerminal.id, `$ ${cmd}`);

    // Parse command and args
    const parts = cmd.trim().split(/\s+/);
    const mainCmd = parts[0];
    const args = parts.slice(1);

    // Handle special commands
    if (mainCmd === "clear" || mainCmd === "cls") {
      clearTerminal(activeTerminal.id);
      return;
    } else if (mainCmd === "cd" && args.length > 0) {
      // Handle directory change (would need backend support for real terminal)
      appendToTerminal(activeTerminal.id, `Changed directory to: ${args[0]}`);
      appendToTerminal(activeTerminal.id, "");
      return;
    } else if (mainCmd === "exit") {
      handleCloseTerminal(activeTerminal.id);
      return;
    }

    try {
      // If venv is activated, prepend activation to command
      let finalCmd = mainCmd;
      let finalArgs = args;
      const cwd = activeTerminal.cwd;

      if (activeTerminal.venvActivated && activeTerminal.venvPath) {
        // Prepend venv python path for python commands
        if (
          mainCmd === "python" ||
          mainCmd === "python3" ||
          mainCmd === "pip"
        ) {
          const isWindows = navigator.platform.toLowerCase().includes("win");
          const pythonPath = isWindows
            ? `${activeTerminal.venvPath}\\Scripts\\${mainCmd}.exe`
            : `${activeTerminal.venvPath}/bin/${mainCmd}`;
          finalCmd = pythonPath;
        }
      }

      // Execute command via backend (don't await - let it run async)
      setTerminalRunning(activeTerminal.id, true);
      invoke("run_command", {
        id: activeTerminal.id,
        command: finalCmd,
        args: finalArgs,
        cwd: cwd,
      }).catch((err) => {
        appendToTerminal(
          activeTerminal.id,
          `Error executing command: ${
            err instanceof Error ? err.message : String(err)
          }`
        );
        setTerminalRunning(activeTerminal.id, false);
      });
    } catch (err) {
      appendToTerminal(
        activeTerminal.id,
        `Error: ${err instanceof Error ? err.message : String(err)}`
      );
      appendToTerminal(activeTerminal.id, "");
      setTerminalRunning(activeTerminal.id, false);
    }
  };

  const handleNewTerminal = () => {
    addTerminal(projectPath || undefined);
  };

  const handleCloseTerminal = async (id: string) => {
    // Kill any running processes in this terminal
    try {
      await invoke("kill_terminal_process", { id });
    } catch (err) {
      console.error("Failed to kill terminal process:", err);
    }
    removeTerminal(id);
  };

  const handleClearTerminal = () => {
    if (activeTerminalId) {
      clearTerminal(activeTerminalId);
    }
  };

  const handleCopyOutput = () => {
    if (activeTerminal) {
      const text = activeTerminal.output.join("\n");
      navigator.clipboard.writeText(text);
    }
  };

  const handleSplitTerminal = () => {
    addTerminal(activeTerminal?.cwd || projectPath || undefined);
  };

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e]">
      {terminals.length > 0 ? (
        <>
          {/* Terminal Tabs */}
          <div className="flex items-center bg-[#252526] border-b border-[#333] overflow-x-auto">
            {terminals.map((terminal) => (
              <div
                key={terminal.id}
                onClick={() => setActiveTerminal(terminal.id)}
                className={`
              flex items-center gap-2 px-3 py-2 cursor-pointer border-r border-[#333]
              hover:bg-[#2d2d2d] transition-colors min-w-0 group
              ${terminal.isActive ? "bg-[#1e1e1e] text-white" : "text-gray-400"}
            `}
              >
                <TerminalIcon size={14} className="shrink-0" />
                <span className="text-xs font-medium truncate max-w-30">
                  {terminal.name}
                </span>
                {terminal.isRunning && (
                  <span
                    className="text-blue-400 shrink-0 animate-pulse"
                    title="Process running"
                  >
                    ●
                  </span>
                )}
                {terminal.venvActivated && (
                  <span
                    className="text-green-500 shrink-0"
                    title="Virtual environment activated"
                  >
                    <Check size={12} />
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCloseTerminal(terminal.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 hover:bg-[#333] h-5 w-5 p-0.5 transition-opacity shrink-0"
                >
                  <X size={12} />
                </Button>
              </div>
            ))}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNewTerminal}
              className="h-8 w-8 p-1 hover:bg-[#2d2d2d] rounded text-gray-400 hover:text-white shrink-0"
              title="New Terminal"
            >
              <Plus size={16} />
            </Button>
          </div>

          {/* Terminal Toolbar */}
          <div className="flex items-center justify-between px-3 py-1.5 bg-[#252526] border-b border-[#333]">
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-400">
                {activeTerminal?.cwd || "~"}
              </span>
              {detectedVenvs.length > 0 && (
                <div className="relative ml-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowVenvMenu(!showVenvMenu)}
                    className="h-6 px-2 text-xs hover:bg-[#333] rounded text-gray-400 hover:text-white flex items-center gap-1"
                  >
                    <Play size={12} />
                    {activeTerminal?.venvActivated
                      ? "Venv Active"
                      : "Activate Venv"}
                    <ChevronDown size={12} />
                  </Button>
                  {showVenvMenu && (
                    <div className="absolute top-full left-0 mt-1 bg-[#2d2d2d] border border-[#444] rounded shadow-lg z-50 min-w-50">
                      {detectedVenvs.map((venv, idx) => (
                        <button
                          key={idx}
                          onClick={() => activateVirtualEnvironment(venv)}
                          className="w-full px-3 py-2 text-xs text-left hover:bg-[#333] text-gray-300 hover:text-white flex items-center gap-2"
                        >
                          <TerminalIcon size={12} />
                          <div className="flex-1 truncate">
                            {venv.type}: {venv.path.split(/[/\\]/).pop()}
                          </div>
                          {activeTerminal?.venvPath === venv.path && (
                            <Check size={12} className="text-green-500" />
                          )}
                        </button>
                      ))}
                      <div className="border-t border-[#444]">
                        <button
                          onClick={detectVirtualEnvironments}
                          className="w-full px-3 py-2 text-xs text-left hover:bg-[#333] text-gray-400 hover:text-white flex items-center gap-2"
                        >
                          <RefreshCw size={12} />
                          Refresh
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSplitTerminal}
                className="h-6 w-6 p-1 hover:bg-[#333] rounded text-gray-400 hover:text-white"
                title="Split Terminal"
              >
                <SplitSquareHorizontal size={14} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopyOutput}
                className="h-6 w-6 p-1 hover:bg-[#333] rounded text-gray-400 hover:text-white"
                title="Copy Output"
              >
                <Copy size={14} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClearTerminal}
                className="h-6 w-6 p-1 hover:bg-[#333] rounded text-gray-400 hover:text-white"
                title="Clear"
              >
                <Trash2 size={14} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 p-1 hover:bg-[#333] rounded text-gray-400 hover:text-white"
                title="Settings"
              >
                <Settings size={14} />
              </Button>
            </div>
          </div>

          {/* Terminal Output */}
          {activeTerminal ? (
            <div className="flex-1 overflow-y-auto p-3 font-mono text-sm text-gray-300 bg-[#1e1e1e]">
              {activeTerminal.output.map((line, i) => (
                <div
                  key={i}
                  className="whitespace-pre-wrap wrap-break-word leading-relaxed"
                >
                  {line}
                </div>
              ))}
              <div
                ref={(el) => {
                  outputRefs.current[activeTerminal.id] = el;
                }}
              />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <TerminalIcon size={48} className="mx-auto mb-3 opacity-50" />
                <p className="text-sm">No terminal open</p>
                <Button
                  onClick={handleNewTerminal}
                  className="mt-3 bg-blue-600 hover:bg-blue-500"
                  size="sm"
                >
                  <Plus size={14} className="mr-1" />
                  New Terminal
                </Button>
              </div>
            </div>
          )}

          {/* Command Input */}
          {activeTerminal && (
            <div className="flex items-center gap-2 px-3 py-2 bg-[#252526] border-t border-[#333]">
              <span className="text-green-400 font-mono text-sm">$</span>
              <Input
                ref={inputRef}
                type="text"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a command..."
                className="flex-1 bg-transparent border-0 shadow-none text-sm text-white placeholder:text-gray-500 h-7 focus-visible:ring-0 font-mono"
                autoFocus
              />
            </div>
          )}
        </>
      ) : (
        /* Empty State - No Terminals */
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <TerminalIcon size={64} className="mx-auto mb-4 opacity-30" />
            <p className="text-base mb-2">No terminal sessions</p>
            <p className="text-sm text-gray-600 mb-6">
              Create a new terminal to get started
            </p>
            <Button
              onClick={handleNewTerminal}
              className="bg-blue-600 hover:bg-blue-500 text-white"
              size="default"
            >
              <Plus size={16} className="mr-2" />
              New Terminal
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

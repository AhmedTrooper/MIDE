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
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import XtermTerminal from "./ui/XtermTerminal";
import type { XtermTerminalHandle } from "./ui/XtermTerminal";

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
    updateTerminalCwd,
    activateVenvInTerminal,
    setTerminalRunning,
  } = useEditorStore();

  const [detectedVenvs, setDetectedVenvs] = useState<VirtualEnv[]>([]);
  const [showVenvMenu, setShowVenvMenu] = useState(false);

  // Refs to access xterm instances
  const terminalRefs = useRef<{ [key: string]: XtermTerminalHandle | null }>(
    {}
  );
  const listenersRef = useRef<Set<string>>(new Set());

  const activeTerminal = terminals.find((t) => t.id === activeTerminalId);

  // Detect virtual environments when terminal opens
  useEffect(() => {
    if (projectPath && terminals.length > 0) {
      detectVirtualEnvironments();
    }
  }, [projectPath, terminals.length]);

  // Listen for command output from ALL terminals
  useEffect(() => {
    const unlisteners: (() => void)[] = [];

    const setupListeners = async () => {
      for (const terminal of terminals) {
        if (listenersRef.current.has(terminal.id)) {
          continue;
        }

        listenersRef.current.add(terminal.id);

        // Listen for data
        const unlistenData = await listen<string>(
          `term-data-${terminal.id}`,
          (event) => {
            // Update store (for persistence/restoration)
            appendToTerminal(terminal.id, event.payload);
            setTerminalRunning(terminal.id, true);

            // Write to xterm
            const term = terminalRefs.current[terminal.id];
            if (term) {
              term.writeln(event.payload);
            }
          }
        );
        unlisteners.push(unlistenData);

        // Listen for exit
        const unlistenExit = await listen<number | null>(
          `term-exit-${terminal.id}`,
          (event) => {
            const exitCode = event.payload;

            // Only show exit code if non-zero (error)
            let msg = "$ ";
            if (exitCode !== 0) {
              msg = `\r\nProcess exited with code: ${exitCode}\r\n$ `;
            }

            appendToTerminal(terminal.id, msg);
            setTerminalRunning(terminal.id, false);

            const term = terminalRefs.current[terminal.id];
            if (term) {
              term.write(msg);
            }
          }
        );
        unlisteners.push(unlistenExit);

        // Listen for errors
        const unlistenError = await listen<string>(
          `term-error-${terminal.id}`,
          (event) => {
            const msg = `\r\nError: ${event.payload}\r\n$ `;
            appendToTerminal(terminal.id, msg);
            setTerminalRunning(terminal.id, false);

            const term = terminalRefs.current[terminal.id];
            if (term) {
              term.write(msg);
            }
          }
        );
        unlisteners.push(unlistenError);
      }
    };

    setupListeners();

    return () => {
      unlisteners.forEach((fn) => fn());
      listenersRef.current.clear();
    };
  }, [terminals.length]);

  const detectVirtualEnvironments = async () => {
    if (!projectPath) return;
    try {
      const venvs = await invoke<VirtualEnv[]>("detect_virtual_environments", {
        projectPath,
      });
      setDetectedVenvs(venvs);
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
    // We just execute it as a command
    executeCommand(activeTerminalId, activationScript);
    activateVenvInTerminal(activeTerminalId, venv.path);
    setShowVenvMenu(false);
  };

  const getActivationScript = (venv: VirtualEnv): string => {
    if (venv.type === "conda") {
      return `conda activate ${venv.path}`;
    }
    const isWindows = navigator.platform.toLowerCase().includes("win");
    if (isWindows) {
      return `${venv.path}\\Scripts\\activate.bat`;
    }
    return `source ${venv.path}/bin/activate`;
  };

  const executeCommand = async (terminalId: string, cmd: string) => {
    const terminal = terminals.find((t) => t.id === terminalId);
    if (!terminal) return;

    // Parse command and args
    const parts = cmd.trim().split(/\s+/);
    const mainCmd = parts[0];
    const args = parts.slice(1);

    // Handle special commands
    if (mainCmd === "clear" || mainCmd === "cls") {
      clearTerminal(terminalId);
      terminalRefs.current[terminalId]?.clear();
      terminalRefs.current[terminalId]?.write("$ ");
      return;
    } else if (mainCmd === "exit") {
      handleCloseTerminal(terminalId);
      return;
    } else if (mainCmd === "cd") {
      // Handle cd specially to update cwd
      if (args.length > 0) {
        const newPath = args[0];
        // We need to resolve this path relative to current cwd
        // Since we don't have path.resolve in browser, we'll rely on backend or simple logic
        // For now, let's just update the store and let the next command fail if invalid
        // Ideally we should verify it exists via backend

        // Simple heuristic for now:
        let nextCwd = terminal.cwd;
        if (newPath === "..") {
          // Go up one level
          const parts = nextCwd.split(/[/\\]/);
          parts.pop();
          nextCwd = parts.join("/") || "/";
        } else if (newPath.startsWith("/") || newPath.match(/^[a-zA-Z]:/)) {
          nextCwd = newPath;
        } else {
          // Relative path
          const sep =
            nextCwd.endsWith("/") || nextCwd.endsWith("\\") ? "" : "/";
          nextCwd = `${nextCwd}${sep}${newPath}`;
        }

        updateTerminalCwd(terminalId, nextCwd);

        // Silent update - just new prompt
        const msg = `$ `;
        appendToTerminal(terminalId, msg);
        terminalRefs.current[terminalId]?.write(msg);
        return;
      }
    }

    try {
      let finalCmd = mainCmd;
      let finalArgs = args;
      const cwd = terminal.cwd;

      if (terminal.venvActivated && terminal.venvPath) {
        if (
          mainCmd === "python" ||
          mainCmd === "python3" ||
          mainCmd === "pip"
        ) {
          const isWindows = navigator.platform.toLowerCase().includes("win");
          const pythonPath = isWindows
            ? `${terminal.venvPath}\\Scripts\\${mainCmd}.exe`
            : `${terminal.venvPath}/bin/${mainCmd}`;
          finalCmd = pythonPath;
        }
      }

      setTerminalRunning(terminalId, true);
      // No need to write newline here, XtermTerminal handles it on Enter

      invoke("run_command", {
        id: terminalId,
        command: finalCmd,
        args: finalArgs,
        cwd: cwd,
      }).catch((err) => {
        const msg = `\r\nError executing command: ${
          err instanceof Error ? err.message : String(err)
        }\r\n$ `;
        appendToTerminal(terminalId, msg);
        terminalRefs.current[terminalId]?.write(msg);
        setTerminalRunning(terminalId, false);
      });
    } catch (err) {
      // ...
    }
  };

  const handleNewTerminal = () => {
    addTerminal(projectPath || undefined);
  };

  const handleCloseTerminal = async (id: string) => {
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
      terminalRefs.current[activeTerminalId]?.clear();
      terminalRefs.current[activeTerminalId]?.write("$ ");
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

          {/* Terminal Output Area - Render ALL terminals but hide inactive ones */}
          <div className="flex-1 bg-[#1e1e1e] relative min-h-0">
            {terminals.map((terminal) => (
              <div
                key={terminal.id}
                className={`absolute inset-0 ${
                  terminal.id === activeTerminalId ? "z-10" : "z-0 invisible"
                }`}
              >
                <XtermTerminal
                  id={terminal.id}
                  ref={(el) => {
                    terminalRefs.current[terminal.id] = el;
                  }}
                  onCommand={(cmd) => executeCommand(terminal.id, cmd)}
                  initialContent={terminal.output.join("\r\n")}
                />
              </div>
            ))}
          </div>
        </>
      ) : (
        /* Empty State */
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

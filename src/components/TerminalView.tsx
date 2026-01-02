import { useEffect, useRef, useState } from "react";
import { useEditorStore } from "../lib/store";
import {
  X,
  Plus,
  Trash2,
  Copy,
  SplitSquareHorizontal,
  ChevronDown,
  Terminal as TerminalIcon,
  Play,
  Check,
  RefreshCw,
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
    activateVenvInTerminal,
    setTerminalRunning,
  } = useEditorStore();
  const [detectedVenvs, setDetectedVenvs] = useState<VirtualEnv[]>([]);
  const [showVenvMenu, setShowVenvMenu] = useState(false);
  const terminalRefs = useRef<{ [key: string]: XtermTerminalHandle | null }>(
    {}
  );
  const initializedRefs = useRef<Set<string>>(new Set());
  const activeTerminal = terminals.find((t) => t.id === activeTerminalId);
  useEffect(() => {
    if (projectPath && terminals.length > 0) {
      detectVirtualEnvironments();
    }
  }, [projectPath, terminals.length]);
  useEffect(() => {
    const manageTerminals = async () => {
      for (const terminal of terminals) {
        if (!initializedRefs.current.has(terminal.id)) {
          initializedRefs.current.add(terminal.id);
          try {
            // Note: If we reload the window, we might lose backend sessions if they aren't persisted.
            await invoke("spawn_pty", {
              id: terminal.id,
              rows: 24, // Initial guess, will be resized
              cols: 80,
              cwd: terminal.cwd || projectPath || undefined,
            });
            setTerminalRunning(terminal.id, true);
          } catch (err) {
            console.error("Failed to spawn PTY:", err);
            terminalRefs.current[terminal.id]?.writeln(`Failed to start terminal: ${err}`);
          }
        }
      }
    };
    manageTerminals();
  }, [terminals, projectPath]);
  const listenersRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    const unlisteners: (() => void)[] = [];
    const setupListeners = async () => {
      for (const terminal of terminals) {
        if (listenersRef.current.has(terminal.id)) continue;
        listenersRef.current.add(terminal.id);
        const unlistenData = await listen<string>(`term-data-${terminal.id}`, (event) => {
          terminalRefs.current[terminal.id]?.write(event.payload);
        });
        unlisteners.push(unlistenData);
        const unlistenExit = await listen<number | null>(`term-exit-${terminal.id}`, (event) => {
          terminalRefs.current[terminal.id]?.writeln(`\r\nProcess exited with code ${event.payload}`);
          setTerminalRunning(terminal.id, false);
        });
        unlisteners.push(unlistenExit);
      }
    };
    setupListeners();
    return () => {
      unlisteners.forEach(u => u());
      // Note: we don't clear listenersRef here to assume persistence.
    };
  }, [terminals]);
  const detectVirtualEnvironments = async () => {
    if (!projectPath) return;
    try {
      const venvs = await invoke<VirtualEnv[]>("detect_virtual_environments", {
        projectPath,
      });
      setDetectedVenvs(venvs);
    } catch (err) {
      console.error("Failed to detect virtual environments:", err);
    }
  };
  const activateVirtualEnvironment = async (venv: VirtualEnv) => {
    if (!activeTerminalId) return;
    let script = "";
    if (venv.type === "conda") {
      script = `conda activate ${venv.path}`;
    } else {
      const isWindows = navigator.platform.toLowerCase().includes("win");
      if (isWindows) {
        script = `${venv.path}\\Scripts\\activate.bat`;
      } else {
        script = `source "${venv.path}/bin/activate"`;
      }
    }
    try {
      await invoke("write_pty", { id: activeTerminalId, data: `${script}\r` });
      activateVenvInTerminal(activeTerminalId, venv.path);
      setShowVenvMenu(false);
    } catch (e) {
      console.error(e);
    }
  };
  const handleNewTerminal = () => {
    addTerminal(projectPath || undefined);
  };
  const handleCloseTerminal = async (id: string) => {
    removeTerminal(id);
    if (terminalRefs.current[id]) {
      delete terminalRefs.current[id];
    }
    if (initializedRefs.current.has(id)) {
      initializedRefs.current.delete(id);
    }
    if (listenersRef.current.has(id)) {
      listenersRef.current.delete(id);
    }
  };
  const handleClearTerminal = () => {
    if (activeTerminalId) {
      terminalRefs.current[activeTerminalId]?.clear();
    }
  };
  const handleSplitTerminal = () => {
    addTerminal(activeTerminal?.cwd || projectPath || undefined);
  };
  const handleResize = (id: string, rows: number, cols: number) => {
    invoke("resize_pty", { id, rows, cols }).catch(console.error);
  };
  const handleData = (id: string, data: string) => {
    invoke("write_pty", { id, data }).catch(console.error);
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
                onClick={() => {
                }}
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
            </div>
          </div>
          {/* Terminal Output Area */}
          <div className="flex-1 bg-[#1e1e1e] relative min-h-0">
            {activeTerminalId && (
              <XtermTerminal
                id={activeTerminalId}
                ref={(el) => {
                  if (activeTerminalId) {
                    terminalRefs.current[activeTerminalId] = el;
                  }
                }}
                onData={(data) => handleData(activeTerminalId, data)}
                onResize={(rows, cols) => handleResize(activeTerminalId, rows, cols)}
              />
            )}
          </div>
        </>
      ) : (
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
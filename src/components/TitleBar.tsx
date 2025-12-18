import { useState, useEffect, useRef } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import {
  Minus,
  Square,
  X,
  Menu,
  Play,
  Bug,
  ChevronDown,
  Plus,
} from "lucide-react";
import { useEditorStore } from "../lib/store";
import { Button } from "./ui/button";

export default function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const {
    openProjectDialog,
    runConfigurations,
    activeRunConfigId,
    setActiveRunConfigId,
    setRunConfigDialogOpen,
    setTerminalOpen,
    appendTerminalOutput,
    projectPath,
  } = useEditorStore();
  const appWindow = getCurrentWindow();

  useEffect(() => {
    const checkMaximized = async () => {
      setIsMaximized(await appWindow.isMaximized());
    };

    checkMaximized();
    const unlisten = appWindow.listen("tauri://resize", checkMaximized);
    return () => {
      unlisten.then((f) => f());
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleRun = async () => {
    const activeConfig = runConfigurations.find(
      (c) => c.id === activeRunConfigId
    );
    if (!activeConfig) return;

    // Expand variables in cwd
    let workingDir = activeConfig.cwd || projectPath;
    if (workingDir) {
      workingDir = workingDir.replace(
        /\$\{workspaceFolder\}/g,
        projectPath || ""
      );
    }

    setTerminalOpen(true);
    appendTerminalOutput(
      `> Working Directory: ${workingDir}\n> Executing: ${
        activeConfig.command
      } ${activeConfig.args?.join(" ") || ""}\n`
    );

    try {
      // Listen for output
      const unlistenData = await listen<string>(
        `term-data-${activeConfig.id}`,
        (event) => {
          appendTerminalOutput(event.payload + "\n");
        }
      );

      const unlistenExit = await listen<number>(
        `term-exit-${activeConfig.id}`,
        (event) => {
          appendTerminalOutput(
            `\n> Process exited with code ${event.payload}\n`
          );
          unlistenData();
          unlistenExit();
          unlistenError();
        }
      );

      const unlistenError = await listen<string>(
        `term-error-${activeConfig.id}`,
        (event) => {
          appendTerminalOutput(`\n> Error: ${event.payload}\n`);
        }
      );

      await invoke("run_command", {
        id: activeConfig.id,
        command: activeConfig.command,
        args: activeConfig.args || [],
        cwd: workingDir,
      });
    } catch (err) {
      appendTerminalOutput(`> Failed to start: ${err}\n`);
    }
  };

  const minimize = () => appWindow.minimize();
  const toggleMaximize = async () => {
    const max = await appWindow.isMaximized();
    if (max) {
      appWindow.unmaximize();
      setIsMaximized(false);
    } else {
      appWindow.maximize();
      setIsMaximized(true);
    }
  };
  const close = () => appWindow.close();

  const menuItems = [
    { label: "File", action: () => {} },
    { label: "Edit", action: () => {} },
    { label: "Selection", action: () => {} },
    { label: "View", action: () => {} },
    { label: "Go", action: () => {} },
    { label: "Run", action: () => {} },
    { label: "Terminal", action: () => {} },
    { label: "Help", action: () => {} },
  ];

  const activeConfig =
    runConfigurations.find((c) => c.id === activeRunConfigId) ||
    runConfigurations[0];

  return (
    <>
      <div
        data-tauri-drag-region
        className="h-10 bg-[#1e1e1e] flex items-center justify-between select-none text-[13px] text-[#cccccc] w-full border-b border-[#1e1e1e] flex-shrink-0 relative"
      >
        {/* Left Section: Icon + Menus */}
        <div
          className="flex items-center h-full shrink-0"
          data-tauri-drag-region
        >
          <div
            className="px-3 flex items-center justify-center h-full"
            data-tauri-drag-region
          >
            <div className="w-4 h-4 bg-blue-500 rounded-sm" />
          </div>

          {/* Desktop Menu */}
          <div
            className="hidden md:flex items-center h-full"
            data-tauri-drag-region
          >
            {menuItems.map((item) => (
              <Button
                key={item.label}
                variant="ghost"
                size="sm"
                onClick={item.label === "File" ? openProjectDialog : undefined}
                className="px-2 h-full flex items-center hover:bg-[#3c3c3c] cursor-pointer rounded-sm mx-0.5 transition-colors text-[13px] font-normal text-[#cccccc] hover:text-white"
              >
                {item.label}
              </Button>
            ))}
          </div>

          {/* Mobile Menu Icon */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden flex items-center h-full px-2 hover:bg-[#3c3c3c] cursor-pointer rounded-none"
          >
            <Menu size={16} />
          </Button>

          {/* Mobile Menu Dropdown */}
          {isMenuOpen && (
            <div
              ref={mobileMenuRef}
              className="md:hidden absolute top-10 left-0 w-48 bg-[#252526] border border-[#454545] rounded shadow-xl z-50 py-1"
            >
              {menuItems.map((item) => (
                <Button
                  key={item.label}
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (item.label === "File") openProjectDialog();
                    setIsMenuOpen(false);
                  }}
                  className="w-full justify-start px-3 py-2 hover:bg-[#094771] cursor-pointer rounded-none text-[13px] font-normal text-[#cccccc] hover:text-white"
                >
                  {item.label}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Center: Run Toolbar (JetBrains Style) */}
        <div
          className="flex justify-center items-center gap-3 px-2 shrink min-w-0"
          data-tauri-drag-region
        >
          <div className="flex items-center bg-[#2d2d2d] rounded border border-[#3e3e3e] h-6 px-2 gap-2 cursor-pointer hover:bg-[#363636] transition-colors relative group w-[180px] justify-between">
            <span className="text-xs text-gray-300 truncate flex-1 min-w-0">
              {activeConfig?.name || "Add Configuration..."}
            </span>
            <ChevronDown size={12} className="text-gray-500 shrink-0" />

            {/* Dropdown Menu */}
            <div className="absolute top-full left-0 mt-1 w-56 bg-[#252526] border border-[#454545] rounded shadow-xl hidden group-hover:block z-50 py-1">
              {runConfigurations.map((config) => (
                <div
                  key={config.id}
                  className="px-3 py-1.5 hover:bg-[#094771] text-xs text-gray-300 cursor-pointer flex justify-between items-center"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveRunConfigId(config.id);
                  }}
                >
                  <span>{config.name}</span>
                  {config.id === activeRunConfigId && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </div>
              ))}
              <div className="border-t border-[#3e3e3e] my-1"></div>
              <div
                className="px-3 py-1.5 hover:bg-[#094771] text-xs text-gray-300 cursor-pointer flex items-center gap-2"
                onClick={(e) => {
                  e.stopPropagation();
                  setRunConfigDialogOpen(true);
                }}
              >
                <Plus size={12} /> Edit Configurations...
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon-sm"
              className="h-7 w-7 hover:bg-[#3c3c3c] text-green-500"
              title="Run"
              onClick={handleRun}
            >
              <Play size={16} fill="currentColor" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              className="h-7 w-7 hover:bg-[#3c3c3c] text-red-400"
              title="Debug"
            >
              <Bug size={16} />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              className="h-7 w-7 hover:bg-[#3c3c3c] text-gray-500"
              title="Stop"
            >
              <Square size={16} fill="currentColor" />
            </Button>
          </div>
        </div>

        {/* Right Section: Window Controls */}
        <div className="flex items-center h-full shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={minimize}
            className="h-full w-11 flex items-center justify-center hover:bg-[#3c3c3c] cursor-pointer transition-colors rounded-none"
          >
            <Minus size={16} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMaximize}
            className="h-full w-11 flex items-center justify-center hover:bg-[#3c3c3c] cursor-pointer transition-colors rounded-none"
          >
            <Square size={14} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={close}
            className="h-full w-11 flex items-center justify-center hover:bg-[#c42b1c] hover:text-white cursor-pointer transition-colors rounded-none"
          >
            <X size={16} />
          </Button>
        </div>
      </div>
    </>
  );
}

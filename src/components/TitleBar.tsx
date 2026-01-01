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
import { cn } from "../lib/utils";
import AdbWidget from "./AdbWidget";

export default function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeMenuDropdown, setActiveMenuDropdown] = useState<string | null>(
    null
  );
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const menuDropdownRef = useRef<HTMLDivElement>(null);
  const {
    openProjectDialog,
    runConfigurations,
    activeRunConfigId,
    setActiveRunConfigId,
    setRunConfigDialogOpen,
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
      if (
        menuDropdownRef.current &&
        !menuDropdownRef.current.contains(event.target as Node)
      ) {
        setActiveMenuDropdown(null);
      }
    };

    if (isMenuOpen || activeMenuDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen, activeMenuDropdown]);

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

    // Note: Run commands now output to the professional terminal view
    // You can access it from the Activity Bar (Terminal icon)
    console.log(
      `Running: ${activeConfig.command} ${activeConfig.args?.join(" ") || ""}`
    );
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
    {
      label: "File",
      items: [
        {
          label: "New Text File",
          shortcut: "Ctrl+N",
          action: () => console.log("New file"),
        },
        {
          label: "New File...",
          shortcut: "",
          action: () => console.log("New file..."),
        },
        {
          label: "New Window",
          shortcut: "Ctrl+Shift+N",
          action: () => console.log("New window"),
        },
        { type: "separator" },
        {
          label: "Open File...",
          shortcut: "Ctrl+O",
          action: () => console.log("Open file"),
        },
        {
          label: "Open Folder...",
          shortcut: "Ctrl+K Ctrl+O",
          action: openProjectDialog,
        },
        {
          label: "Open Recent",
          shortcut: "",
          action: () => console.log("Open recent"),
        },
        { type: "separator" },
        {
          label: "Save",
          shortcut: "Ctrl+S",
          action: () => console.log("Save"),
        },
        {
          label: "Save As...",
          shortcut: "Ctrl+Shift+S",
          action: () => console.log("Save as"),
        },
        {
          label: "Save All",
          shortcut: "",
          action: () => console.log("Save all"),
        },
        { type: "separator" },
        {
          label: "Auto Save",
          shortcut: "",
          action: () => console.log("Auto save"),
        },
        { type: "separator" },
        {
          label: "Preferences",
          shortcut: "",
          action: () => console.log("Preferences"),
        },
        { type: "separator" },
        {
          label: "Close Editor",
          shortcut: "Ctrl+W",
          action: () => console.log("Close editor"),
        },
        {
          label: "Close Folder",
          shortcut: "Ctrl+K F",
          action: () => console.log("Close folder"),
        },
        { label: "Close Window", shortcut: "", action: close },
        { type: "separator" },
        { label: "Exit", shortcut: "", action: close },
      ],
    },
    { label: "Edit", items: [] },
    { label: "Selection", items: [] },
    { label: "View", items: [] },
    { label: "Go", items: [] },
    { label: "Run", items: [] },
    { label: "Terminal", items: [] },
    { label: "Help", items: [] },
  ];

  const activeConfig =
    runConfigurations.find((c) => c.id === activeRunConfigId) ||
    runConfigurations[0];

  return (
    <>
      <div
        data-tauri-drag-region
        className="h-10 bg-[#1e1e1e] flex items-center select-none text-[13px] text-[#cccccc] w-full border-b border-[#1e1e1e] flex-shrink-0 relative"
      >
        {/* Left Section: Icon + Menus */}
        <div
          className="flex items-center h-full flex-shrink-0"
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
            {menuItems.map((menu) => (
              <div key={menu.label} className="relative h-full">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setActiveMenuDropdown(
                      activeMenuDropdown === menu.label ? null : menu.label
                    )
                  }
                  className={cn(
                    "px-2 h-full flex items-center hover:bg-[#3c3c3c] cursor-pointer rounded-sm mx-0.5 transition-colors text-[13px] font-normal text-[#cccccc] hover:text-white",
                    activeMenuDropdown === menu.label && "bg-[#3c3c3c]"
                  )}
                >
                  {menu.label}
                </Button>

                {/* Dropdown Menu */}
                {activeMenuDropdown === menu.label && menu.items.length > 0 && (
                  <div
                    ref={menuDropdownRef}
                    className="absolute top-full left-0 mt-0 w-64 bg-[#252526] border border-[#454545] rounded shadow-xl z-50 py-1"
                  >
                    {menu.items.map((item: any, index: number) => {
                      if (item.type === "separator") {
                        return (
                          <div
                            key={`sep-${index}`}
                            className="border-t border-[#3e3e3e] my-1"
                          />
                        );
                      }
                      return (
                        <div
                          key={item.label}
                          className="px-3 py-1.5 hover:bg-[#094771] text-xs text-gray-300 cursor-pointer flex justify-between items-center"
                          onClick={() => {
                            item.action();
                            setActiveMenuDropdown(null);
                          }}
                        >
                          <span>{item.label}</span>
                          {item.shortcut && (
                            <span className="text-[10px] text-gray-500 ml-6">
                              {item.shortcut}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
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
          className="flex items-center gap-3 px-2 flex-1 min-w-0 overflow-hidden"
          data-tauri-drag-region
        >
          <div className="flex items-center bg-[#2d2d2d] rounded border border-[#3e3e3e] h-6 px-2 gap-2 cursor-pointer hover:bg-[#363636] transition-colors relative group w-[180px] max-w-full justify-between">
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

        {/* ADB Widget */}
        <div
          className="flex items-center px-2 flex-shrink-0"
          data-tauri-drag-region
        >
          <AdbWidget />
        </div>

        {/* Right Section: Window Controls */}
        <div className="flex items-center h-full flex-shrink-0">
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

import { useState, useEffect } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
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

export default function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const {
    openProjectDialog,
    runConfigurations,
    activeRunConfigId,
    setActiveRunConfigId,
    setRunConfigDialogOpen,
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
        className="h-10 bg-[#1e1e1e] flex items-center justify-between select-none text-[13px] text-[#cccccc] w-full border-b border-[#1e1e1e] flex-shrink-0"
      >
        {/* Left Section: Icon + Menus */}
        <div className="flex items-center h-full" data-tauri-drag-region>
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
              <div
                key={item.label}
                onClick={item.label === "File" ? openProjectDialog : undefined}
                className="px-2 h-full flex items-center hover:bg-[#3c3c3c] cursor-pointer rounded-sm mx-0.5 transition-colors"
              >
                {item.label}
              </div>
            ))}
          </div>

          {/* Mobile Menu Icon */}
          <div
            onClick={() => setIsMenuOpen(true)}
            className="md:hidden flex items-center h-full px-2 hover:bg-[#3c3c3c] cursor-pointer"
          >
            <Menu size={16} />
          </div>
        </div>

        {/* Center: Run Toolbar (JetBrains Style) */}
        <div
          className="flex-1 flex justify-center items-center gap-3"
          data-tauri-drag-region
        >
          <div className="flex items-center bg-[#2d2d2d] rounded border border-[#3e3e3e] h-6 px-2 gap-2 cursor-pointer hover:bg-[#363636] transition-colors relative group min-w-[140px] justify-between">
            <span className="text-xs text-gray-300 truncate max-w-[120px]">
              {activeConfig?.name || "Add Configuration..."}
            </span>
            <ChevronDown size={12} className="text-gray-500" />

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

          <div className="flex items-center gap-1">
            <button
              className="p-1 hover:bg-[#3c3c3c] rounded text-green-500 transition-colors"
              title="Run"
            >
              <Play size={18} fill="currentColor" />
            </button>
            <button
              className="p-1 hover:bg-[#3c3c3c] rounded text-red-400 transition-colors"
              title="Debug"
            >
              <Bug size={18} />
            </button>
            <button
              className="p-1 hover:bg-[#3c3c3c] rounded text-gray-500 transition-colors"
              title="Stop"
            >
              <Square size={18} fill="currentColor" />
            </button>
          </div>
        </div>

        {/* Right Section: Window Controls */}
        <div className="flex items-center h-full">
          <div
            onClick={minimize}
            className="h-full w-11 flex items-center justify-center hover:bg-[#3c3c3c] cursor-pointer transition-colors"
          >
            <Minus size={16} />
          </div>
          <div
            onClick={toggleMaximize}
            className="h-full w-11 flex items-center justify-center hover:bg-[#3c3c3c] cursor-pointer transition-colors"
          >
            <Square size={14} />
          </div>
          <div
            onClick={close}
            className="h-full w-11 flex items-center justify-center hover:bg-[#c42b1c] hover:text-white cursor-pointer transition-colors"
          >
            <X size={16} />
          </div>
        </div>
      </div>
    </>
  );
}

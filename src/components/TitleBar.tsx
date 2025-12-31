import { useState, useEffect } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Minus, Square, X, Copy, Menu, FolderOpen } from "lucide-react";
import { useEditorStore } from "../lib/store";

export default function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { openProjectDialog } = useEditorStore();
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

  return (
    <>
      <div
        data-tauri-drag-region
        className="h-8 bg-[#1e1e1e] flex items-center justify-between select-none text-[13px] text-[#cccccc] w-full border-b border-[#1e1e1e] flex-shrink-0"
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

        {/* Center: Title */}
        <div
          className="flex-1 text-center text-xs text-[#999999] pointer-events-none truncate px-2"
          data-tauri-drag-region
        >
          VS Code Clone
        </div>

        {/* Right Section: Window Controls */}
        <div className="flex items-center h-full">
          <div
            onClick={minimize}
            className="h-full w-11 flex items-center justify-center hover:bg-[#3c3c3c] cursor-pointer transition-colors"
          >
            <Minus size={14} />
          </div>
          <div
            onClick={toggleMaximize}
            className="h-full w-11 flex items-center justify-center hover:bg-[#3c3c3c] cursor-pointer transition-colors"
          >
            {isMaximized ? (
              <Copy size={12} className="rotate-180" />
            ) : (
              <Square size={12} />
            )}
          </div>
          <div
            onClick={close}
            className="h-full w-11 flex items-center justify-center hover:bg-[#e81123] hover:text-white cursor-pointer transition-colors"
          >
            <X size={14} />
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 bg-[#1e1e1e] text-[#cccccc] flex flex-col md:hidden animate-in fade-in duration-200">
          <div className="h-8 flex items-center justify-between px-3 border-b border-[#2d2d2d]">
            <span className="font-medium">Menu</span>
            <div
              onClick={() => setIsMenuOpen(false)}
              className="p-1 hover:bg-[#3c3c3c] rounded cursor-pointer"
            >
              <X size={16} />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            <div className="mb-4">
              <div className="text-xs font-bold text-[#666666] uppercase px-2 mb-2">
                File
              </div>
              <button
                onClick={() => {
                  openProjectDialog();
                  setIsMenuOpen(false);
                }}
                className="w-full text-left px-2 py-2 hover:bg-[#2a2d2e] rounded flex items-center gap-2"
              >
                <FolderOpen size={16} />
                <span>Open Folder</span>
              </button>
            </div>

            <div className="border-t border-[#2d2d2d] my-2"></div>

            {menuItems.map((item) => (
              <button
                key={item.label}
                className="w-full text-left px-2 py-2 hover:bg-[#2a2d2e] rounded"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

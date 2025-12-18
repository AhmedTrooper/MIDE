import { useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useEditorStore } from "../lib/store";
import { getLanguageFromPath } from "../lib/utils";
import { ArrowLeftRight, ArrowUpDown } from "lucide-react";
import ActivityBar from "./ActivityBar";
import Sidebar from "./Sidebar";
import SearchView from "./SearchView";
import SettingsView from "./SettingsView";
import StatusBar from "./StatusBar";
import RunConfigDialog from "./RunConfigDialog";
import CommandPalette from "./CommandPalette";
import Terminal from "./Terminal";
import GitView from "./GitView";
import SplitEditorLayout from "./SplitEditorLayout";
import { Button } from "./ui/button";

export default function EditorLayout() {
  const {
    fileTree,
    openFiles,
    activeFile,
    activeView,
    openFile,
    setActiveFile,
    setActiveView,
    markFileDirty,
    isTerminalOpen,
    splitEditorHorizontal,
    splitEditorVertical,
    splitDirection,
  } = useEditorStore();

  const activeFileObj = openFiles.find((f) => f.path === activeFile);

  const handleFileSelect = async (path: string) => {
    // Check if already open
    const existing = openFiles.find((f) => f.path === path);
    if (existing) {
      setActiveFile(path);
      return;
    }

    try {
      const content = await invoke<string>("read_file_content", { path });
      const name = path.split(/[/\\]/).pop() || path;
      openFile({
        path,
        name,
        content,
        language: getLanguageFromPath(path),
        isDirty: false,
      });
    } catch (err) {
      console.error("Error reading file:", err);
    }
  };

  const handleSave = async () => {
    if (!activeFileObj) return;
    try {
      await invoke("save_file_content", {
        path: activeFileObj.path,
        content: activeFileObj.content,
      });
      markFileDirty(activeFileObj.path, false);
    } catch (err) {
      console.error("Failed to save:", err);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Save: Ctrl+S
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
      // Split Vertical: Ctrl+\
      if ((e.ctrlKey || e.metaKey) && e.key === "\\") {
        e.preventDefault();
        if (splitDirection === "none") {
          splitEditorVertical();
        }
      }
      // Split Horizontal: Ctrl+Shift+\
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "|") {
        e.preventDefault();
        if (splitDirection === "none") {
          splitEditorHorizontal();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    activeFileObj,
    splitDirection,
    splitEditorHorizontal,
    splitEditorVertical,
  ]);

  return (
    <div className="flex flex-col h-full w-full bg-[#1e1e1e] text-white overflow-hidden">
      <CommandPalette />
      <RunConfigDialog />

      <div className="flex-1 flex min-h-0">
        {/* Activity Bar */}
        <ActivityBar activeView={activeView} onViewChange={setActiveView} />

        {/* Sidebar Area */}
        {activeView === "explorer" && (
          <Sidebar
            title="EXPLORER"
            fileTree={fileTree}
            onFileSelect={handleFileSelect}
            isVisible={true}
          />
        )}
        {activeView === "search" && <SearchView />}
        {activeView === "git" && <GitView />}

        {/* Main Editor Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#1e1e1e]">
          {activeView === "settings" ? (
            <SettingsView />
          ) : (
            <>
              {/* Split Editor Controls Bar */}
              {splitDirection === "none" && openFiles.length > 0 && (
                <div className="h-9 bg-[#252526] border-b border-[#1e1e1e] flex items-center justify-end px-2 gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={splitEditorVertical}
                    className="h-7 w-7 hover:bg-[#3c3c3c] text-gray-400 hover:text-white"
                    title="Split Editor Right (Ctrl+\)"
                  >
                    <ArrowLeftRight size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={splitEditorHorizontal}
                    className="h-7 w-7 hover:bg-[#3c3c3c] text-gray-400 hover:text-white"
                    title="Split Editor Down"
                  >
                    <ArrowUpDown size={16} />
                  </Button>
                </div>
              )}

              {/* Split Editor */}
              <SplitEditorLayout />
            </>
          )}

          {/* Terminal Panel */}
          {isTerminalOpen && activeView !== "settings" && <Terminal />}
        </div>
      </div>

      {/* Status Bar */}
      <StatusBar language={activeFileObj?.language || "Plain Text"} />
    </div>
  );
}

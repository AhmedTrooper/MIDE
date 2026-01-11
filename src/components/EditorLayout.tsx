import { useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useEditorStore } from "../lib/store";
import { getLanguageFromPath } from "../lib/utils";
import { ArrowLeftRight, ArrowUpDown } from "lucide-react";
import ActivityBar from "./ActivityBar";
import Sidebar from "./Sidebar";
import SearchView from "./SearchView";
import SettingsView from "./SettingsView";
import TodoView from "./TodoView";
import TerminalView from "./TerminalView";
import StatusBar from "./StatusBar";
import RunConfigDialog from "./RunConfigDialog";
import CommandPalette from "./CommandPalette";
import GitView from "./GitView";
import SplitEditorLayout from "./SplitEditorLayout";
import PluginManagerView from "./PluginManagerView";
import ResizablePanel from "./ResizablePanel";
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
    isSidebarCollapsed,
    toggleSidebar,
    splitEditorHorizontal,
    splitEditorVertical,
    splitDirection,
    updateFileContent,
    isBottomPanelVisible,
    toggleBottomPanel,
  } = useEditorStore();
  const activeFileObj = openFiles.find((f) => f.path === activeFile);
  const handleFileSelect = async (path: string) => {
    const existing = openFiles.find((f) => f.path === path);
    if (existing) {
      setActiveFile(path);
      return;
    }
    const name = path.split(/[/\\]/).pop() || path;
    openFile({
      path,
      name,
      content: "// Loading...",
      language: getLanguageFromPath(path),
      isDirty: false,
    });
    try {
      const content = await invoke<string>("read_file_content", { path });
      updateFileContent(path, content, false);
    } catch (err) {
      console.error("Error reading file:", err);
      updateFileContent(path, `// Error loading file: ${err}`, false);
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
  const handleFormatDocument = async () => {
    if (!activeFileObj) return;
    try {
      const formatted = await invoke<string>("format_code", {
        code: activeFileObj.content,
        language: activeFileObj.language,
      });
      updateFileContent(activeFileObj.path, formatted);
    } catch (err) {
      console.error("Format failed:", err);
    }
  };
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
      if (e.shiftKey && e.altKey && e.key === "F") {
        e.preventDefault();
        handleFormatDocument();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "b") {
        e.preventDefault();
        toggleSidebar();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "\\") {
        e.preventDefault();
        if (splitDirection === "none") {
          splitEditorVertical();
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "`") {
        e.preventDefault();
        toggleBottomPanel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    activeFileObj,
    handleSave,
    handleFormatDocument,
    toggleSidebar,
    splitDirection,
    splitEditorVertical,
  ]);
  return (
    <div className="flex flex-col h-full w-full bg-[#1e1e1e] text-white overflow-hidden">
      <CommandPalette />
      <RunConfigDialog />
      <div className="flex-1 flex min-h-0">
        <ActivityBar activeView={activeView} onViewChange={setActiveView} />
        {!isSidebarCollapsed && (
          <ResizablePanel
            direction="horizontal"
            defaultSize={300}
            minSize={200}
            maxSize={600}
          >
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
            {activeView === "todos" && <TodoView />}
            {activeView === "extensions" && <PluginManagerView />}
          </ResizablePanel>
        )}
        <div className="flex-1 flex flex-col min-w-0 bg-[#1e1e1e]">
          {activeView === "settings" ? (
            <SettingsView />
          ) : activeView === "extensions" ? (
            <div className="h-full" />
          ) : (
            <>
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
              <div className="flex-1 min-h-0 relative">
                <SplitEditorLayout />
              </div>
              {isBottomPanelVisible && (
                <ResizablePanel
                  direction="vertical"
                  defaultSize={300}
                  minSize={100}
                  maxSize={800}
                  className="border-t border-[#3e3e3e]"
                >
                  <TerminalView />
                </ResizablePanel>
              )}
            </>
          )}
        </div>
      </div>
      <StatusBar language={activeFileObj?.language || "Plain Text"} />
    </div>
  );
}
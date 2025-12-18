import { useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useEditorStore } from "../lib/store";
import { getLanguageFromPath } from "../lib/utils";
import CodeEditor from "./ui/CodeEditor";
import { X } from "lucide-react";
import ActivityBar from "./ActivityBar";
import Sidebar from "./Sidebar";
import SearchView from "./SearchView";
import SettingsView from "./SettingsView";
import StatusBar from "./StatusBar";
import RunConfigDialog from "./RunConfigDialog";
import CommandPalette from "./CommandPalette";
import Terminal from "./Terminal";
import GitView from "./GitView";
import { Button } from "./ui/button";

export default function EditorLayout() {
  const {
    fileTree,
    openFiles,
    activeFile,
    activeView,
    openFile,
    closeFile,
    setActiveFile,
    setActiveView,
    updateFileContent,
    markFileDirty,
    isTerminalOpen,
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

  // Keyboard shortcut for save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeFileObj]);

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
              {/* Tabs */}
              <div className="flex bg-[#252526] overflow-x-auto scrollbar-hide h-9 border-b border-[#1e1e1e]">
                {openFiles.map((file) => (
                  <div
                    key={file.path}
                    onClick={() => setActiveFile(file.path)}
                    className={`
                  group flex items-center gap-2 px-3 text-sm cursor-pointer border-r border-[#1e1e1e] min-w-[120px] max-w-[200px] select-none
                  ${
                    activeFile === file.path
                      ? "bg-[#1e1e1e] text-white border-t-2 border-t-blue-500"
                      : "bg-[#2d2d2d] text-gray-400 hover:bg-[#2a2d2e]"
                  }
                `}
                  >
                    <span className="truncate flex-1">{file.name}</span>
                    <div className="flex items-center justify-center w-5 h-5">
                      {file.isDirty ? (
                        <div className="w-2 h-2 rounded-full bg-white group-hover:hidden" />
                      ) : null}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          closeFile(file.path);
                        }}
                        className={`h-5 w-5 opacity-0 group-hover:opacity-100 hover:bg-[#444] rounded p-0.5 ${
                          file.isDirty ? "hidden group-hover:block" : ""
                        }`}
                      >
                        <X size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Editor */}
              <div className="flex-1 relative">
                {activeFileObj ? (
                  <CodeEditor
                    code={activeFileObj.content}
                    language={activeFileObj.language}
                    onChange={(value) => {
                      if (value !== undefined) {
                        updateFileContent(activeFileObj.path, value);
                        markFileDirty(activeFileObj.path, true);
                      }
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500 bg-[#1e1e1e]">
                    <div className="text-center">
                      <div className="text-4xl font-bold mb-4 text-[#333]">
                        MIDE
                      </div>
                      <p className="text-sm text-gray-500">
                        Show All Commands{" "}
                        <span className="bg-[#333] px-1 rounded text-xs">
                          Ctrl+Shift+P
                        </span>
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        Go to File{" "}
                        <span className="bg-[#333] px-1 rounded text-xs">
                          Ctrl+P
                        </span>
                      </p>
                    </div>
                  </div>
                )}
              </div>
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

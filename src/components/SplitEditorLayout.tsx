import { useEditorStore } from "../lib/store";
import CodeEditor, { type CodeEditorHandle } from "./ui/CodeEditor";
import FindReplaceWidget, { type FindOptions } from "./FindReplaceWidget";
import { Button } from "./ui/button";
import { X, ArrowLeftRight, ArrowUpDown, XCircle } from "lucide-react";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "./ui/resizable";
import { motion } from "motion/react";
import { useRef, useState } from "react";

interface EditorPaneProps {
  groupId: string;
}

function EditorPane({ groupId }: EditorPaneProps) {
  const {
    openFiles,
    editorGroups,
    activeGroupId,
    setActiveGroup,
    setGroupActiveFile,
    closeFile,
    updateFileContent,
    markFileDirty,
    splitDirection,
    isFindWidgetOpen,
    isFindReplaceMode,
    setFindWidgetOpen,
  } = useEditorStore();

  const editorRef = useRef<CodeEditorHandle>(null);
  const [matchCount, setMatchCount] = useState<{
    current: number;
    total: number;
  }>();

  const group = editorGroups.find((g) => g.id === groupId);
  const activeFileObj = openFiles.find((f) => f.path === group?.activeFile);
  const isActive = activeGroupId === groupId;

  const handleFind = (query: string, options: FindOptions) => {
    const editor = editorRef.current?.getEditor();
    if (!editor) return;

    editor.trigger("find", "actions.find", {
      searchString: query,
      matchCase: options.caseSensitive,
      wholeWord: options.wholeWord,
      isRegex: options.regex,
    });
  };

  const handleFindNext = () => {
    const editor = editorRef.current?.getEditor();
    if (editor) {
      editor.trigger("find", "editor.action.nextMatchFindAction", null);
    }
  };

  const handleFindPrevious = () => {
    const editor = editorRef.current?.getEditor();
    if (editor) {
      editor.trigger("find", "editor.action.previousMatchFindAction", null);
    }
  };

  const handleReplace = (replacement: string) => {
    const editor = editorRef.current?.getEditor();
    if (editor) {
      editor.trigger("replace", "editor.action.replaceOne", {
        replaceString: replacement,
      });
    }
  };

  const handleReplaceAll = (replacement: string) => {
    const editor = editorRef.current?.getEditor();
    if (editor) {
      editor.trigger("replace", "editor.action.replaceAll", {
        replaceString: replacement,
      });
    }
  };

  return (
    <div
      className={`flex flex-col h-full bg-[#1e1e1e] border-2 transition-colors ${
        isActive ? "border-blue-500/50" : "border-transparent"
      }`}
      onClick={() => setActiveGroup(groupId)}
    >
      {/* Tabs */}
      <div className="flex bg-[#252526] overflow-x-auto scrollbar-hide h-9 border-b border-[#1e1e1e]">
        {openFiles.map((file) => (
          <motion.div
            key={file.path}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onClick={(e) => {
              e.stopPropagation();
              setGroupActiveFile(groupId, file.path);
              setActiveGroup(groupId);
            }}
            className={`
              group flex items-center gap-2 px-3 text-sm cursor-pointer border-r border-[#1e1e1e] min-w-[120px] max-w-[200px] select-none
              ${
                group?.activeFile === file.path
                  ? "bg-[#1e1e1e] text-white border-t-2 border-t-blue-500"
                  : "bg-[#2d2d2d] text-gray-400 hover:bg-[#2a2d2e]"
              }
            `}
          >
            <span className="truncate flex-1">{file.name}</span>
            <div className="flex items-center justify-center w-5 h-5 relative">
              {file.isDirty && (
                <div className="w-2 h-2 rounded-full bg-white absolute group-hover:opacity-0" />
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  closeFile(file.path);
                }}
                className="h-5 w-5 hover:bg-[#444] rounded p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={14} />
              </Button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Editor */}
      <div className="flex-1 relative">
        {isActive && isFindWidgetOpen && (
          <FindReplaceWidget
            isOpen={isFindWidgetOpen}
            isReplaceMode={isFindReplaceMode}
            onClose={() => setFindWidgetOpen(false)}
            onFind={handleFind}
            onFindNext={handleFindNext}
            onFindPrevious={handleFindPrevious}
            onReplace={handleReplace}
            onReplaceAll={handleReplaceAll}
            matchCount={matchCount}
          />
        )}
        {activeFileObj ? (
          <CodeEditor
            ref={editorRef}
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
                {splitDirection !== "none"
                  ? `Group ${groupId.split("-")[1]}`
                  : "MIDE"}
              </div>
              <p className="text-sm text-gray-500">
                {splitDirection !== "none"
                  ? "Click a file to open it in this pane"
                  : "Show All Commands"}{" "}
                {splitDirection === "none" && (
                  <span className="bg-[#333] px-1 rounded text-xs">
                    Ctrl+Shift+P
                  </span>
                )}
              </p>
              {splitDirection === "none" && (
                <p className="text-sm text-gray-500 mt-2">
                  Go to File{" "}
                  <span className="bg-[#333] px-1 rounded text-xs">Ctrl+P</span>
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SplitEditorLayout() {
  const {
    splitDirection,
    splitEditorHorizontal,
    splitEditorVertical,
    closeSplit,
  } = useEditorStore();

  if (splitDirection === "none") {
    return <EditorPane groupId="group-1" />;
  }

  return (
    <div className="flex-1 relative">
      <ResizablePanelGroup
        orientation={
          splitDirection === "horizontal" ? "vertical" : "horizontal"
        }
        className="h-full"
      >
        <ResizablePanel defaultSize={50} minSize={20}>
          <EditorPane groupId="group-1" />
        </ResizablePanel>

        <ResizableHandle
          withHandle
          className="bg-[#1e1e1e] hover:bg-blue-500/30 transition-colors"
        />

        <ResizablePanel defaultSize={50} minSize={20}>
          <EditorPane groupId="group-2" />
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Split Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-2 right-2 flex gap-1 bg-[#252526] border border-[#3e3e3e] rounded shadow-lg p-1"
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={closeSplit}
          className="h-7 w-7 hover:bg-[#3c3c3c] text-gray-400 hover:text-white"
          title="Close Split"
        >
          <XCircle size={16} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={splitEditorHorizontal}
          disabled={true}
          className="h-7 w-7 hover:bg-[#3c3c3c] text-gray-400 hover:text-white disabled:opacity-30"
          title="Already Split (Close to Re-split)"
        >
          <ArrowUpDown size={16} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={splitEditorVertical}
          disabled={true}
          className="h-7 w-7 hover:bg-[#3c3c3c] text-gray-400 hover:text-white disabled:opacity-30"
          title="Already Split (Close to Re-split)"
        >
          <ArrowLeftRight size={16} />
        </Button>
      </motion.div>
    </div>
  );
}

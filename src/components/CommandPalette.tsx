import { useEffect, useState, useRef } from "react";
import { useEditorStore } from "../lib/store";
import { Input } from "./ui/input";
import {
  Search,
  File,
  Save,
  FolderOpen,
  X,
  Terminal,
  Settings,
  FilePlus,
  FolderPlus,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Command {
  id: string;
  label: string;
  shortcut?: string;
  icon: React.ReactNode;
  action: () => void;
}

export default function CommandPalette() {
  const {
    isCommandPaletteOpen,
    setCommandPaletteOpen,
    openProjectDialog,
    activeFile,
    openFiles,
    setActiveFile,
    closeFile,
    projectPath,
    selectedNode,
    setCreationState,
  } = useEditorStore();

  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleCreateTrigger = (type: "file" | "folder") => {
    if (!projectPath) return;

    let parentPath = projectPath;
    if (selectedNode) {
      if (selectedNode.isDir) {
        parentPath = selectedNode.path;
      } else {
        const separator = selectedNode.path.includes("\\") ? "\\" : "/";
        const lastIndex = selectedNode.path.lastIndexOf(separator);
        if (lastIndex !== -1) {
          parentPath = selectedNode.path.substring(0, lastIndex);
        }
      }
    }

    setCreationState({ type, parentPath });
  };

  const commands: Command[] = [
    {
      id: "new-file",
      label: "File: New File",
      shortcut: "Ctrl+N",
      icon: <FilePlus size={16} />,
      action: () => handleCreateTrigger("file"),
    },
    {
      id: "new-folder",
      label: "File: New Folder",
      icon: <FolderPlus size={16} />,
      action: () => handleCreateTrigger("folder"),
    },
    {
      id: "open-project",
      label: "File: Open Folder...",
      shortcut: "Ctrl+O",
      icon: <FolderOpen size={16} />,
      action: () => openProjectDialog(),
    },
    {
      id: "save-file",
      label: "File: Save",
      shortcut: "Ctrl+S",
      icon: <Save size={16} />,
      action: () => {
        window.dispatchEvent(
          new KeyboardEvent("keydown", { key: "s", ctrlKey: true })
        );
      },
    },
    {
      id: "close-file",
      label: "File: Close Editor",
      shortcut: "Ctrl+W",
      icon: <X size={16} />,
      action: () => {
        if (activeFile) closeFile(activeFile);
      },
    },
    {
      id: "settings",
      label: "Preferences: Settings",
      shortcut: "Ctrl+,",
      icon: <Settings size={16} />,
      action: () => {
        // Open settings
      },
    },
    ...openFiles.map((file) => ({
      id: `open-${file.path}`,
      label: `Go to File: ${file.name}`,
      icon: <File size={16} />,
      action: () => setActiveFile(file.path),
    })),
  ];

  const filteredCommands = commands.filter((cmd) =>
    cmd.label.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "P") {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
      if (e.key === "Escape") {
        setCommandPaletteOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setCommandPaletteOpen]);

  useEffect(() => {
    if (isCommandPaletteOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isCommandPaletteOpen]);

  useEffect(() => {
    const handleNavigation = (e: KeyboardEvent) => {
      if (!isCommandPaletteOpen) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredCommands.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
          setCommandPaletteOpen(false);
        }
      }
    };

    window.addEventListener("keydown", handleNavigation);
    return () => window.removeEventListener("keydown", handleNavigation);
  }, [
    isCommandPaletteOpen,
    filteredCommands,
    selectedIndex,
    setCommandPaletteOpen,
  ]);

  if (!isCommandPaletteOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] bg-black/50 backdrop-blur-sm"
        onClick={() => setCommandPaletteOpen(false)}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ duration: 0.1 }}
          className="w-[600px] max-w-[90vw] bg-[#252526] rounded-lg shadow-2xl border border-[#454545] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center px-3 py-3 border-b border-[#333]">
            <Search className="text-gray-400 mr-2" size={18} />
            <Input
              ref={inputRef}
              className="flex-1 bg-transparent border-none text-white placeholder-gray-500 text-sm focus-visible:ring-0 h-auto p-0"
              placeholder="Type a command or search for files..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
            />
            <div className="flex gap-1">
              <span className="text-xs bg-[#333] text-gray-400 px-1.5 py-0.5 rounded border border-[#444]">
                Esc
              </span>
            </div>
          </div>

          <div className="max-h-[400px] overflow-y-auto py-1 custom-scrollbar">
            {filteredCommands.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500 text-sm">
                No commands found
              </div>
            ) : (
              filteredCommands.map((cmd, index) => (
                <div
                  key={cmd.id}
                  className={`
                    flex items-center justify-between px-3 py-2 mx-1 rounded-md cursor-pointer text-sm
                    ${
                      index === selectedIndex
                        ? "bg-[#094771] text-white"
                        : "text-gray-300 hover:bg-[#2a2d2e]"
                    }
                  `}
                  onClick={() => {
                    cmd.action();
                    setCommandPaletteOpen(false);
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`${
                        index === selectedIndex ? "text-white" : "text-gray-400"
                      }`}
                    >
                      {cmd.icon}
                    </span>
                    <span>{cmd.label}</span>
                  </div>
                  {cmd.shortcut && (
                    <span
                      className={`text-xs ${
                        index === selectedIndex
                          ? "text-gray-200"
                          : "text-gray-500"
                      }`}
                    >
                      {cmd.shortcut}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

import { useState } from "react";
import { MoreHorizontal, FilePlus, FolderPlus, RefreshCw } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { useEditorStore } from "../lib/store";
import FileTreeNode, { type FileNode } from "./ui/FileTree";

interface SidebarProps {
  title: string;
  fileTree: FileNode | null;
  onFileSelect: (path: string) => void;
  isVisible: boolean;
}

export default function Sidebar({
  title,
  fileTree,
  onFileSelect,
  isVisible,
}: SidebarProps) {
  const { projectPath, refreshTree } = useEditorStore();
  const [isCreating, setIsCreating] = useState<"file" | "folder" | null>(null);
  const [newItemName, setNewItemName] = useState("");

  if (!isVisible) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName || !projectPath) return;

    // Simple path join
    const separator = projectPath.includes("\\") ? "\\" : "/";
    const cleanPath = projectPath.replace(/[/\\]$/, "");
    const fullPath = `${cleanPath}${separator}${newItemName}`;

    try {
      if (isCreating === "file") {
        await invoke("create_file", { path: fullPath });
      } else {
        await invoke("create_directory", { path: fullPath });
      }
      await refreshTree();
      setIsCreating(null);
      setNewItemName("");
    } catch (err) {
      console.error("Failed to create item:", err);
      alert(`Error: ${err}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsCreating(null);
      setNewItemName("");
    }
  };

  return (
    <div className="w-64 bg-[#252526] flex flex-col border-r border-[#1e1e1e] select-none">
      <div className="h-9 px-4 flex items-center justify-between text-[11px] font-medium text-[#BBBBBB] tracking-wide uppercase group">
        <span>{title}</span>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setIsCreating("file")}
            className="hover:bg-[#3c3c3c] p-1 rounded"
            title="New File"
          >
            <FilePlus size={16} />
          </button>
          <button
            onClick={() => setIsCreating("folder")}
            className="hover:bg-[#3c3c3c] p-1 rounded"
            title="New Folder"
          >
            <FolderPlus size={16} />
          </button>
          <button
            onClick={() => refreshTree()}
            className="hover:bg-[#3c3c3c] p-1 rounded"
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#424242] scrollbar-track-transparent">
        {fileTree ? (
          <div className="py-1">
            <div
              className="px-4 py-1 text-xs font-bold text-blue-400 uppercase tracking-wider mb-1 truncate"
              title={fileTree.path}
            >
              {fileTree.name}
            </div>

            {isCreating && (
              <form onSubmit={handleCreate} className="px-4 py-1 mb-1">
                <input
                  autoFocus
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={() => {
                    // Small delay to allow form submit to happen if Enter was pressed
                    setTimeout(() => {
                      // Only close if we didn't just submit (which would clear isCreating)
                      // Actually, simpler to just let the user cancel explicitly with Esc or empty submit
                      // But for UX, clicking away usually cancels.
                      // We'll skip onBlur for now to avoid fighting with Submit
                    }, 100);
                  }}
                  placeholder={
                    isCreating === "file" ? "New File..." : "New Folder..."
                  }
                  className="w-full bg-[#3c3c3c] text-white text-xs px-2 py-1 border border-blue-500 outline-none rounded-sm"
                />
              </form>
            )}

            <FileTreeNode node={fileTree} onSelect={onFileSelect} />
          </div>
        ) : (
          <div className="p-4 text-sm text-gray-500 text-center">
            No folder opened.
          </div>
        )}
      </div>
    </div>
  );
}

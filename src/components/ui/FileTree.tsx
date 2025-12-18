import { useState, useEffect, useRef } from "react";
import {
  Folder,
  FolderOpen,
  FileCode,
  ChevronRight,
  ChevronDown,
  FilePlus,
  FolderPlus,
} from "lucide-react";
import { useEditorStore } from "../../lib/store";
import { invoke } from "@tauri-apps/api/core";

export interface FileNode {
  name: string;
  path: string;
  is_dir: boolean;
  children?: FileNode[];
}

interface FileTreeProps {
  node: FileNode;
  onSelect: (path: string) => void;
  level?: number;
}

const FileTreeNode = ({ node, onSelect, level = 0 }: FileTreeProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { selectedNode, setSelectedNode, creationState, setCreationState, refreshTree } = useEditorStore();
  const [newItemName, setNewItemName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const isSelected = selectedNode?.path === node.path;
  const isCreatingHere = creationState?.parentPath === node.path;

  // Auto-expand if creating inside this folder
  useEffect(() => {
    if (isCreatingHere && node.is_dir) {
      setIsOpen(true);
      // Focus input after render
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 50);
    }
  }, [isCreatingHere, node.is_dir]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedNode({ path: node.path, isDir: node.is_dir });

    if (node.is_dir) {
      setIsOpen(!isOpen);
    } else {
      onSelect(node.path);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName || !creationState) return;

    const separator = node.path.includes("\\") ? "\\" : "/";
    const fullPath = `${node.path}${separator}${newItemName}`;

    try {
      if (creationState.type === "file") {
        await invoke("create_file", { path: fullPath });
      } else {
        await invoke("create_directory", { path: fullPath });
      }
      await refreshTree();
      setCreationState(null);
      setNewItemName("");
    } catch (err) {
      console.error("Failed to create item:", err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setCreationState(null);
      setNewItemName("");
    }
  };

  return (
    <div className="select-none text-sm font-sans">
      <div
        className={`
            flex items-center gap-1.5 py-1 px-2 cursor-pointer transition-colors
            ${
              isSelected
                ? "bg-[#37373d] text-white"
                : "text-gray-400 hover:bg-[#2a2d2e] hover:text-white"
            }
        `}
        style={{ paddingLeft: `${level * 12 + 12}px` }}
        onClick={handleClick}
      >
        <span className="opacity-70 w-4 flex justify-center shrink-0">
          {node.is_dir ? (
            isOpen ? (
              <ChevronDown size={14} />
            ) : (
              <ChevronRight size={14} />
            )
          ) : (
            <span className="w-3.5" />
          )}
        </span>

        {node.is_dir ? (
          isOpen ? (
            <FolderOpen size={16} className="text-blue-500 shrink-0" />
          ) : (
            <Folder size={16} className="text-blue-500 shrink-0" />
          )
        ) : (
          <FileCode size={16} className="text-yellow-500 shrink-0" />
        )}

        <span className="truncate">{node.name}</span>
      </div>

      {/* Children & Creation Input */}
      {isOpen && (
        <div className="">
          {/* Inline Creation Input */}
          {isCreatingHere && (
             <div 
                className="flex items-center gap-1.5 py-1 px-2 bg-[#37373d]"
                style={{ paddingLeft: `${(level + 1) * 12 + 12}px` }}
             >
                <span className="opacity-70 w-4 flex justify-center shrink-0">
                    {creationState?.type === 'folder' ? <ChevronRight size={14} /> : <span className="w-3.5" />}
                </span>
                {creationState?.type === 'folder' ? (
                    <FolderPlus size={16} className="text-blue-400 shrink-0" />
                ) : (
                    <FilePlus size={16} className="text-gray-400 shrink-0" />
                )}
                <form onSubmit={handleCreateSubmit} className="flex-1 min-w-0">
                    <input
                        ref={inputRef}
                        type="text"
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onBlur={() => {
                            // Optional: Cancel on blur if empty, or keep it open?
                            // VS Code keeps it open if you click inside, closes if outside.
                            // For simplicity, let's keep it open until Esc or Enter.
                        }}
                        className="w-full bg-[#3c3c3c] border border-[#007fd4] text-white text-xs px-1 py-0.5 outline-none"
                    />
                </form>
             </div>
          )}

          {node.children?.map((child) => (
            <FileTreeNode
              key={child.path}
              node={child}
              onSelect={onSelect}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FileTreeNode;

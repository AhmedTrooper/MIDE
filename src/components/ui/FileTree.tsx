import { useState, useEffect, useRef } from "react";
import {
  Folder,
  FolderOpen,
  FileCode,
  ChevronRight,
  ChevronDown,
  FilePlus,
  FolderPlus,
  Pencil,
  Trash2,
} from "lucide-react";
import { useEditorStore } from "../../lib/store";
import { invoke } from "@tauri-apps/api/core";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "./context-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./dialog";
import { Input } from "./input";
import { Button } from "./button";

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
  const {
    selectedNode,
    setSelectedNode,
    creationState,
    setCreationState,
    refreshTree,
  } = useEditorStore();
  const [newItemName, setNewItemName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Dialog states
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [renameValue, setRenameValue] = useState(node.name);

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

  const handleRename = async () => {
    if (!renameValue || renameValue === node.name) {
      setIsRenameOpen(false);
      return;
    }
    try {
      const separator = node.path.includes("\\") ? "\\" : "/";
      const lastIndex = node.path.lastIndexOf(separator);
      const parentPath =
        lastIndex !== -1 ? node.path.substring(0, lastIndex) : "";
      const newPath = `${parentPath}${separator}${renameValue}`;

      await invoke("rename_item", { oldPath: node.path, newPath });
      await refreshTree();
      setIsRenameOpen(false);
    } catch (err) {
      console.error("Rename failed:", err);
    }
  };

  const handleDelete = async () => {
    try {
      await invoke("delete_item", { path: node.path });
      await refreshTree();
      setIsDeleteOpen(false);
    } catch (err) {
      console.error("Delete failed:", err);
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
      <ContextMenu>
        <ContextMenuTrigger>
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
            onContextMenu={(e) => {
              // Ensure selection updates on right click
              setSelectedNode({ path: node.path, isDir: node.is_dir });
            }}
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
        </ContextMenuTrigger>
        <ContextMenuContent className="w-48 bg-[#252526] border-[#454545] text-gray-300">
          <ContextMenuItem
            onClick={() => setIsRenameOpen(true)}
            className="focus:bg-[#094771] focus:text-white cursor-pointer"
          >
            <Pencil className="mr-2 h-4 w-4" />
            Rename
          </ContextMenuItem>
          <ContextMenuItem
            onClick={() => setIsDeleteOpen(true)}
            className="text-red-400 focus:text-red-100 focus:bg-red-900 cursor-pointer"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </ContextMenuItem>
          {node.is_dir && (
            <>
              <ContextMenuSeparator className="bg-[#454545]" />
              <ContextMenuItem
                onClick={() => {
                  setCreationState({ type: "file", parentPath: node.path });
                  setIsOpen(true);
                }}
                className="focus:bg-[#094771] focus:text-white cursor-pointer"
              >
                <FilePlus className="mr-2 h-4 w-4" />
                New File
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() => {
                  setCreationState({ type: "folder", parentPath: node.path });
                  setIsOpen(true);
                }}
                className="focus:bg-[#094771] focus:text-white cursor-pointer"
              >
                <FolderPlus className="mr-2 h-4 w-4" />
                New Folder
              </ContextMenuItem>
            </>
          )}
        </ContextMenuContent>
      </ContextMenu>

      {/* Rename Dialog */}
      <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
        <DialogContent className="sm:max-w-[425px] bg-[#252526] text-white border-[#454545]">
          <DialogHeader>
            <DialogTitle>Rename</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              className="bg-[#3c3c3c] border-[#007fd4] text-white"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRename();
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setIsRenameOpen(false)}
              className="bg-[#3c3c3c] hover:bg-[#4c4c4c] text-white border-none"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRename}
              className="bg-[#007fd4] hover:bg-[#006bb3] text-white"
            >
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-[425px] bg-[#252526] text-white border-[#454545]">
          <DialogHeader>
            <DialogTitle>Delete {node.name}?</DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to delete this{" "}
              {node.is_dir ? "folder and its contents" : "file"}? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setIsDeleteOpen(false)}
              className="bg-[#3c3c3c] hover:bg-[#4c4c4c] text-white border-none"
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                {creationState?.type === "folder" ? (
                  <ChevronRight size={14} />
                ) : (
                  <span className="w-3.5" />
                )}
              </span>
              {creationState?.type === "folder" ? (
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

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
  Copy,
  ExternalLink,
  SplitSquareVertical,
  FileText,
} from "lucide-react";
import { useEditorStore } from "../../lib/store";
import { invoke } from "@tauri-apps/api/core";
import { Input } from "./input";
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
  const [children, setChildren] = useState<FileNode[]>(node.children || []);
  const [isLoading, setIsLoading] = useState(false);
  const {
    selectedNode,
    setSelectedNode,
    creationState,
    setCreationState,
    refreshTree,
    projectPath,
    splitEditorVertical,
    splitDirection,
  } = useEditorStore();
  const [newItemName, setNewItemName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Update children when node prop changes (e.g. after refresh)
  useEffect(() => {
    if (node.children) {
      setChildren(node.children);
    }
  }, [node.children]);

  // Dialog states
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [renameValue, setRenameValue] = useState(node.name);

  const isSelected = selectedNode?.path === node.path;
  const isCreatingHere = creationState?.parentPath === node.path;

  // Auto-expand if creating inside this folder
  useEffect(() => {
    if (isCreatingHere && node.is_dir) {
      if (!isOpen) {
        handleToggle();
      }
      // Focus input after render
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 50);
    }
  }, [isCreatingHere, node.is_dir]);

  const handleToggle = async () => {
    if (!node.is_dir) return;

    if (!isOpen) {
      // Opening
      if (children.length === 0 && !isLoading) {
        setIsLoading(true);
        try {
          const loadedChildren = await invoke<FileNode[]>("read_dir", {
            path: node.path,
          });
          setChildren(loadedChildren);
        } catch (err) {
          console.error("Failed to load directory:", err);
        } finally {
          setIsLoading(false);
        }
      }
      setIsOpen(true);
    } else {
      // Closing
      setIsOpen(false);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedNode({ path: node.path, isDir: node.is_dir });

    if (node.is_dir) {
      handleToggle();
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

      // Update open files in store if this file is open
      const { renameFile } = useEditorStore.getState();
      renameFile(node.path, newPath);

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

  const handleCopyPath = async () => {
    try {
      await navigator.clipboard.writeText(node.path);
    } catch (err) {
      console.error("Failed to copy path:", err);
    }
  };

  const handleCopyRelativePath = async () => {
    try {
      if (!projectPath) return;
      const relativePath = node.path
        .replace(projectPath, "")
        .replace(/^[/\\]/, "");
      await navigator.clipboard.writeText(relativePath);
    } catch (err) {
      console.error("Failed to copy relative path:", err);
    }
  };

  const handleOpenToSide = () => {
    if (!node.is_dir) {
      if (splitDirection === "none") {
        splitEditorVertical();
      }
      // Small delay to let split happen, then open file
      setTimeout(() => {
        onSelect(node.path);
      }, 100);
    }
  };

  const handleRevealInExplorer = async () => {
    try {
      // Use Tauri shell plugin to open file explorer
      const { Command } = await import("@tauri-apps/plugin-shell");

      // Determine the appropriate command based on OS
      const platform = navigator.platform.toLowerCase();

      if (platform.includes("win")) {
        // Windows: open explorer and select the file
        await Command.create("explorer", ["/select,", node.path]).execute();
      } else if (platform.includes("mac")) {
        // macOS: use 'open' with reveal flag
        await Command.create("open", ["-R", node.path]).execute();
      } else {
        // Linux: open the parent directory
        const separator = node.path.includes("\\") ? "\\" : "/";
        const lastIndex = node.path.lastIndexOf(separator);
        const parentPath =
          lastIndex !== -1 ? node.path.substring(0, lastIndex) : node.path;
        await Command.create("xdg-open", [parentPath]).execute();
      }
    } catch (err) {
      console.error("Failed to reveal in explorer:", err);
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
        <ContextMenuContent className="w-56 bg-[#252526] border-[#454545] text-gray-300">
          {/* File-specific options */}
          {!node.is_dir && (
            <>
              <ContextMenuItem
                onClick={() => onSelect(node.path)}
                className="focus:bg-[#094771] focus:text-white cursor-pointer"
              >
                <FileText className="mr-2 h-4 w-4" />
                Open
              </ContextMenuItem>
              <ContextMenuItem
                onClick={handleOpenToSide}
                className="focus:bg-[#094771] focus:text-white cursor-pointer"
              >
                <SplitSquareVertical className="mr-2 h-4 w-4" />
                Open to the Side
              </ContextMenuItem>
              <ContextMenuSeparator className="bg-[#454545]" />
            </>
          )}

          {/* Common options */}
          <ContextMenuItem
            onClick={handleRevealInExplorer}
            className="focus:bg-[#094771] focus:text-white cursor-pointer"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Reveal in File Explorer
          </ContextMenuItem>
          <ContextMenuSeparator className="bg-[#454545]" />

          <ContextMenuItem
            onClick={handleCopyPath}
            className="focus:bg-[#094771] focus:text-white cursor-pointer"
          >
            <Copy className="mr-2 h-4 w-4" />
            Copy Path
          </ContextMenuItem>
          <ContextMenuItem
            onClick={handleCopyRelativePath}
            className="focus:bg-[#094771] focus:text-white cursor-pointer"
          >
            <Copy className="mr-2 h-4 w-4" />
            Copy Relative Path
          </ContextMenuItem>

          <ContextMenuSeparator className="bg-[#454545]" />
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
                <Input
                  ref={inputRef}
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full bg-[#3c3c3c] border-[#007fd4] text-white h-5 text-xs px-1 py-0.5"
                />
              </form>
            </div>
          )}

          {children.map((child) => (
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

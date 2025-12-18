import { FilePlus, FolderPlus, RefreshCw } from "lucide-react";
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
  const { projectPath, refreshTree, selectedNode, setSelectedNode, setCreationState } = useEditorStore();

  if (!isVisible) return null;

  const handleCreateTrigger = (type: 'file' | 'folder') => {
    if (!projectPath) return;
    
    let parentPath = projectPath;
    if (selectedNode) {
        if (selectedNode.isDir) {
            parentPath = selectedNode.path;
        } else {
            // If file is selected, create in parent dir
            // We need to handle both slash types just in case, though usually it's consistent
            const separator = selectedNode.path.includes("\\") ? "\\" : "/";
            const lastIndex = selectedNode.path.lastIndexOf(separator);
            if (lastIndex !== -1) {
                parentPath = selectedNode.path.substring(0, lastIndex);
            }
        }
    }
    
    setCreationState({ type, parentPath });
  };

  return (
    <div className="w-64 bg-[#252526] flex flex-col border-r border-[#1e1e1e] select-none" onClick={() => setSelectedNode(null)}>
      <div className="h-9 px-4 flex items-center justify-between text-[11px] font-medium text-[#BBBBBB] tracking-wide uppercase group">
        <span>{title}</span>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); handleCreateTrigger("file"); }}
            className="hover:bg-[#3c3c3c] p-1 rounded cursor-pointer"
            title="New File"
          >
            <FilePlus size={16} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleCreateTrigger("folder"); }}
            className="hover:bg-[#3c3c3c] p-1 rounded cursor-pointer"
            title="New Folder"
          >
            <FolderPlus size={16} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); refreshTree(); }}
            className="hover:bg-[#3c3c3c] p-1 rounded cursor-pointer"
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#424242] scrollbar-track-transparent">
        {fileTree ? (
          <div className="py-1">
            <FileTreeNode node={fileTree} onSelect={onFileSelect} />
          </div>
        ) : (
          <div className="p-4 text-xs text-gray-500 text-center">
            No folder opened
          </div>
        )}
      </div>
    </div>
  );
}

import { useState } from "react";
import {
  Folder,
  FolderOpen,
  FileCode,
  ChevronRight,
  ChevronDown,
} from "lucide-react";

export interface FileNode {
  name: string;
  path: string;
  is_dir: boolean;
  children?: FileNode[];
}

interface FileTreeProps {
  node: FileNode;
  onSelect: (path: string) => void;
}

const FileTreeNode = ({ node, onSelect }: FileTreeProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (node.is_dir) {
      setIsOpen(!isOpen);
    } else {
      onSelect(node.path);
    }
  };

  return (
    <div className="pl-3 select-none text-sm font-sans">
      <div
        className="flex items-center gap-1.5 py-1 px-2 cursor-pointer hover:bg-[#2a2d2e] text-gray-400 hover:text-white rounded-sm transition-colors"
        onClick={handleClick}
      >
        <span className="opacity-70 w-4 flex justify-center">
          {node.is_dir ? (
            isOpen ? (
              <ChevronDown size={14} />
            ) : (
              <ChevronRight size={14} />
            )
          ) : null}
        </span>

        {node.is_dir ? (
          isOpen ? (
            <FolderOpen size={16} className="text-blue-500" />
          ) : (
            <Folder size={16} className="text-blue-500" />
          )
        ) : (
          <FileCode size={16} className="text-yellow-500" />
        )}

        <span className="truncate">{node.name}</span>
      </div>

      {isOpen && node.children && (
        <div className="border-l border-gray-700 ml-2.5">
          {node.children.map((child) => (
            <FileTreeNode key={child.path} node={child} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  );
};

export default FileTreeNode;

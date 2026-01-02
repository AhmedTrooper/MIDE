import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useEditorStore } from "../lib/store";
import { ScrollArea } from "./ui/scroll-area";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  RefreshCw,
  CheckCircle,
  AlertCircle,
  FileText,
  ChevronRight,
} from "lucide-react";
interface TodoItem {
  file: string;
  line: number;
  type: "TODO" | "FIXME" | "HACK" | "NOTE" | "BUG";
  text: string;
}
export default function TodoView() {
  const { projectPath, setActiveFile, openFile } = useEditorStore();
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<string | null>(null);
  const fetchTodos = async () => {
    if (!projectPath) return;
    setIsLoading(true);
    try {
      const result = await invoke<string>("search_todos", {
        path: projectPath,
      });
      const parsed = JSON.parse(result);
      setTodos(parsed);
    } catch (err) {
      console.error("Failed to fetch TODOs:", err);
      setTodos([]);
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    fetchTodos();
  }, [projectPath]);
  const handleTodoClick = async (todo: TodoItem) => {
    try {
      const content = await invoke<string>("read_file_content", {
        path: todo.file,
      });
      const name = todo.file.split(/[/\\]/).pop() || todo.file;
      const language = getLanguage(todo.file);
      openFile({
        path: todo.file,
        name,
        content,
        language,
        isDirty: false,
      });
      // TODO: Navigate to line number
      setActiveFile(todo.file);
    } catch (err) {
      console.error("Failed to open file:", err);
    }
  };
  const getLanguage = (path: string): string => {
    const ext = path.split(".").pop()?.toLowerCase();
    const langMap: Record<string, string> = {
      ts: "typescript",
      tsx: "typescript",
      js: "javascript",
      jsx: "javascript",
      py: "python",
      rs: "rust",
      json: "json",
      md: "markdown",
      html: "html",
      css: "css",
      go: "go",
      java: "java",
      cpp: "cpp",
      c: "c",
    };
    return langMap[ext || ""] || "plaintext";
  };
  const getTypeColor = (type: string) => {
    switch (type) {
      case "TODO":
        return "bg-blue-500/20 text-blue-400";
      case "FIXME":
        return "bg-red-500/20 text-red-400";
      case "HACK":
        return "bg-yellow-500/20 text-yellow-400";
      case "BUG":
        return "bg-red-500/20 text-red-400";
      case "NOTE":
        return "bg-green-500/20 text-green-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "TODO":
        return <CheckCircle size={14} />;
      case "FIXME":
      case "BUG":
        return <AlertCircle size={14} />;
      default:
        return <FileText size={14} />;
    }
  };
  const filteredTodos = filter ? todos.filter((t) => t.type === filter) : todos;
  const typeCounts = todos.reduce((acc, todo) => {
    acc[todo.type] = (acc[todo.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  if (!projectPath) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-gray-400 text-sm text-center">
        <FileText size={48} className="mb-4 opacity-50" />
        <p>Open a folder to view TODOs</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] border-r border-[#333]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#333]">
        <span className="text-xs font-bold text-gray-400 uppercase">
          TODO / Tasks
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={fetchTodos}
          className="h-6 w-6 text-gray-400 hover:text-white"
          title="Refresh"
        >
          <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
        </Button>
      </div>
      {/* Filter Badges */}
      <div className="flex gap-2 p-2 border-b border-[#333] flex-wrap">
        <Badge
          onClick={() => setFilter(null)}
          className={`cursor-pointer text-xs ${
            filter === null
              ? "bg-blue-600 text-white"
              : "bg-[#333] text-gray-400 hover:bg-[#444]"
          }`}
        >
          All ({todos.length})
        </Badge>
        {["TODO", "FIXME", "HACK", "BUG", "NOTE"].map((type) => {
          const count = typeCounts[type] || 0;
          if (count === 0) return null;
          return (
            <Badge
              key={type}
              onClick={() => setFilter(type)}
              className={`cursor-pointer text-xs ${
                filter === type
                  ? getTypeColor(type)
                  : "bg-[#333] text-gray-400 hover:bg-[#444]"
              }`}
            >
              {type} ({count})
            </Badge>
          );
        })}
      </div>
      {/* Content */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-400 text-sm">Loading...</div>
          </div>
        ) : filteredTodos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-4 text-gray-400 text-sm text-center">
            <CheckCircle size={48} className="mb-4 opacity-50" />
            <p>No {filter || ""} tasks found</p>
            <p className="text-xs mt-2">
              Add comments like // TODO: or // FIXME: in your code
            </p>
          </div>
        ) : (
          <div className="py-2">
            {filteredTodos.map((todo, index) => (
              <div
                key={`${todo.file}-${todo.line}-${index}`}
                onClick={() => handleTodoClick(todo)}
                className="px-4 py-2 hover:bg-[#2a2d2e] cursor-pointer border-b border-[#1e1e1e] group"
              >
                <div className="flex items-start gap-2">
                  <div className={`mt-0.5 ${getTypeColor(todo.type)}`}>
                    {getTypeIcon(todo.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        className={`text-[10px] h-4 px-1 ${getTypeColor(
                          todo.type
                        )}`}
                      >
                        {todo.type}
                      </Badge>
                      <span className="text-xs text-gray-500 truncate">
                        {todo.file.replace(projectPath, "")}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300">{todo.text}</p>
                    <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                      <span>Line {todo.line}</span>
                      <ChevronRight
                        size={12}
                        className="opacity-0 group-hover:opacity-100"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
      {/* Stats Footer */}
      {!isLoading && filteredTodos.length > 0 && (
        <div className="px-4 py-2 border-t border-[#333] bg-[#252526]">
          <div className="text-xs text-gray-400">
            {filteredTodos.length} {filter || ""} task
            {filteredTodos.length !== 1 ? "s" : ""} found
          </div>
        </div>
      )}
    </div>
  );
}
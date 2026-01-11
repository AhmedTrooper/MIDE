import {
  Files,
  Search,
  GitGraph,
  Box,
  Settings,
  User,
  CheckSquare,
  Terminal as TerminalIcon,
} from "lucide-react";
import { Button } from "./ui/button";
import { useEditorStore } from "../lib/store";
interface ActivityBarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}
export default function ActivityBar({
  activeView,
  onViewChange,
}: ActivityBarProps) {
  const { isSidebarCollapsed, toggleSidebar, setSidebarCollapsed, toggleBottomPanel, isBottomPanelVisible } =
    useEditorStore();
  const handleViewClick = (viewId: string) => {
    if (viewId === "terminal") {
      toggleBottomPanel();
      return;
    }
    if (activeView === viewId && !isSidebarCollapsed) {
      toggleSidebar();
    } else {
      if (isSidebarCollapsed) {
        setSidebarCollapsed(false);
      }
      onViewChange(viewId);
    }
  };
  const topItems = [
    { id: "explorer", icon: Files, label: "Explorer" },
    { id: "search", icon: Search, label: "Search" },
    { id: "git", icon: GitGraph, label: "Source Control" },
    { id: "todos", icon: CheckSquare, label: "TODO / Tasks" },
    { id: "terminal", icon: TerminalIcon, label: "Terminal" },
    { id: "extensions", icon: Box, label: "Extensions" },
  ];
  const bottomItems = [
    { id: "account", icon: User, label: "Accounts" },
    { id: "settings", icon: Settings, label: "Settings" },
  ];
  return (
    <div className="w-12 flex flex-col bg-[#333333] text-[#858585] py-2 select-none z-20 h-full overflow-hidden">
      <div className="flex-1 flex flex-col gap-2 items-center overflow-y-auto no-scrollbar w-full min-h-0">
        {topItems.map((item) => (
          <Button
            key={item.id}
            variant="ghost"
            size="icon"
            onClick={() => handleViewClick(item.id)}
            className={`
              relative h-12 w-12 rounded-none hover:bg-transparent hover:text-white transition-colors
              ${(activeView === item.id && item.id !== "terminal") || (item.id === "terminal" && isBottomPanelVisible) ? "text-white" : ""}
            `}
            title={item.label}
          >
            {((activeView === item.id && item.id !== "terminal") || (item.id === "terminal" && isBottomPanelVisible)) && (
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-white" />
            )}
            <item.icon size={24} strokeWidth={1.5} />
          </Button>
        ))}
      </div>
      <div className="flex flex-col gap-2 items-center mt-auto pt-2 bg-[#333333] shrink-0">
        {bottomItems.map((item) => (
          <Button
            key={item.id}
            variant="ghost"
            size="icon"
            onClick={() => handleViewClick(item.id)}
            className={`
              relative h-12 w-12 rounded-none hover:bg-transparent hover:text-white transition-colors
              ${activeView === item.id ? "text-white" : ""}
            `}
            title={item.label}
          >
            {activeView === item.id && (
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-white" />
            )}
            <item.icon size={24} strokeWidth={1.5} />
          </Button>
        ))}
      </div>
    </div>
  );
}
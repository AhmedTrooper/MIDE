import { Files, Search, GitGraph, Box, Settings, User } from "lucide-react";
import { Button } from "./ui/button";

interface ActivityBarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export default function ActivityBar({
  activeView,
  onViewChange,
}: ActivityBarProps) {
  const topItems = [
    { id: "explorer", icon: Files, label: "Explorer" },
    { id: "search", icon: Search, label: "Search" },
    { id: "git", icon: GitGraph, label: "Source Control" },
    { id: "extensions", icon: Box, label: "Extensions" },
  ];

  const bottomItems = [
    { id: "account", icon: User, label: "Accounts" },
    { id: "settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div className="w-12 flex flex-col justify-between bg-[#333333] text-[#858585] py-2 select-none z-20">
      <div className="flex flex-col gap-2 items-center">
        {topItems.map((item) => (
          <Button
            key={item.id}
            variant="ghost"
            size="icon"
            onClick={() => onViewChange(item.id)}
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

      <div className="flex flex-col gap-2 items-center">
        {bottomItems.map((item) => (
          <Button
            key={item.id}
            variant="ghost"
            size="icon"
            onClick={() => onViewChange(item.id)}
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

import { GitBranch, RefreshCw, AlertCircle, Bell } from "lucide-react";
import { Button } from "./ui/button";
interface StatusBarProps {
  language: string;
  cursorPosition?: { line: number; col: number };
}
export default function StatusBar({
  language,
  cursorPosition = { line: 1, col: 1 },
}: StatusBarProps) {
  return (
    <div className="h-6 bg-[#007acc] text-white flex items-center justify-between px-2 text-[12px] select-none z-30">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="h-5 px-1.5 text-[12px] hover:bg-white/20 text-white font-normal rounded gap-1"
        >
          <GitBranch size={12} />
          <span>main*</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-5 px-1.5 text-[12px] hover:bg-white/20 text-white font-normal rounded gap-1"
        >
          <RefreshCw size={12} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-5 px-1.5 text-[12px] hover:bg-white/20 text-white font-normal rounded gap-1"
        >
          <AlertCircle size={12} />
          <span>0</span>
          <div className="w-[1px] h-3 bg-white/30 mx-1" />
          <AlertCircle size={12} />
          <span>0</span>
        </Button>
      </div>
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          className="h-5 px-1.5 text-[12px] hover:bg-white/20 text-white font-normal rounded"
        >
          Ln {cursorPosition.line}, Col {cursorPosition.col}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-5 px-1.5 text-[12px] hover:bg-white/20 text-white font-normal rounded"
        >
          UTF-8
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-5 px-1.5 text-[12px] hover:bg-white/20 text-white font-normal rounded"
        >
          {language}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-5 px-1.5 text-[12px] hover:bg-white/20 text-white font-normal rounded"
        >
          <Bell size={12} />
        </Button>
      </div>
    </div>
  );
}
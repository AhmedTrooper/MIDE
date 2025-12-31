import { GitBranch, RefreshCw, AlertCircle, Check, Bell } from "lucide-react";

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
        <div className="flex items-center gap-1 hover:bg-white/20 px-1.5 py-0.5 rounded cursor-pointer transition-colors">
          <GitBranch size={12} />
          <span>main*</span>
        </div>
        <div className="flex items-center gap-1 hover:bg-white/20 px-1.5 py-0.5 rounded cursor-pointer transition-colors">
          <RefreshCw size={12} />
        </div>
        <div className="flex items-center gap-1 hover:bg-white/20 px-1.5 py-0.5 rounded cursor-pointer transition-colors">
          <AlertCircle size={12} />
          <span>0</span>
          <div className="w-[1px] h-3 bg-white/30 mx-1" />
          <AlertCircle size={12} />
          <span>0</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hover:bg-white/20 px-1.5 py-0.5 rounded cursor-pointer transition-colors">
          Ln {cursorPosition.line}, Col {cursorPosition.col}
        </div>
        <div className="hover:bg-white/20 px-1.5 py-0.5 rounded cursor-pointer transition-colors">
          UTF-8
        </div>
        <div className="hover:bg-white/20 px-1.5 py-0.5 rounded cursor-pointer transition-colors">
          {language}
        </div>
        <div className="hover:bg-white/20 px-1.5 py-0.5 rounded cursor-pointer transition-colors">
          <Bell size={12} />
        </div>
      </div>
    </div>
  );
}

import { useEffect, useRef } from "react";
import { useEditorStore } from "../lib/store";
import { X, Trash2 } from "lucide-react";

export default function Terminal() {
  const { terminalOutput, clearTerminalOutput, setTerminalOpen } =
    useEditorStore();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [terminalOutput]);

  return (
    <div className="h-48 bg-[#1e1e1e] border-t border-[#333] flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 bg-[#252526] border-b border-[#333]">
        <span className="text-xs font-bold text-gray-300 uppercase">
          Terminal
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={clearTerminalOutput}
            className="p-1 hover:bg-[#333] rounded text-gray-400 hover:text-white"
            title="Clear"
          >
            <Trash2 size={14} />
          </button>
          <button
            onClick={() => setTerminalOpen(false)}
            className="p-1 hover:bg-[#333] rounded text-gray-400 hover:text-white"
            title="Close"
          >
            <X size={14} />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2 font-mono text-sm text-gray-300">
        {terminalOutput.map((line, i) => (
          <div key={i} className="whitespace-pre-wrap break-all">
            {line}
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
}

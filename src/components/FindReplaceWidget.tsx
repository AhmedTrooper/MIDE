import { useState, useEffect, useRef } from "react";
import {
  X,
  ChevronDown,
  ChevronUp,
  Replace,
  ReplaceAll,
  CaseSensitive,
  WholeWord,
  Regex,
} from "lucide-react";
import { Button } from "./ui/button";
import { motion, AnimatePresence } from "motion/react";

interface FindReplaceWidgetProps {
  isOpen: boolean;
  isReplaceMode: boolean;
  onClose: () => void;
  onFind: (query: string, options: FindOptions) => void;
  onFindNext: () => void;
  onFindPrevious: () => void;
  onReplace: (replacement: string) => void;
  onReplaceAll: (replacement: string) => void;
  matchCount?: { current: number; total: number };
}

export interface FindOptions {
  caseSensitive: boolean;
  wholeWord: boolean;
  regex: boolean;
}

export default function FindReplaceWidget({
  isOpen,
  isReplaceMode,
  onClose,
  onFind,
  onFindNext,
  onFindPrevious,
  onReplace,
  onReplaceAll,
  matchCount,
}: FindReplaceWidgetProps) {
  const [findValue, setFindValue] = useState("");
  const [replaceValue, setReplaceValue] = useState("");
  const [options, setOptions] = useState<FindOptions>({
    caseSensitive: false,
    wholeWord: false,
    regex: false,
  });

  const findInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => findInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    if (findValue) {
      onFind(findValue, options);
    }
  }, [findValue, options]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "Enter") {
      if (e.shiftKey) {
        onFindPrevious();
      } else {
        onFindNext();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.15 }}
        className="absolute top-0 right-6 z-40 bg-[#252526] border border-[#454545] rounded shadow-xl"
        style={{ minWidth: "400px" }}
      >
        {/* Find Row */}
        <div className="flex items-center gap-1 p-2 border-b border-[#333]">
          <div className="flex-1 flex items-center bg-[#3c3c3c] border border-[#3c3c3c] focus-within:border-[#007fd4] rounded">
            <input
              ref={findInputRef}
              type="text"
              value={findValue}
              onChange={(e) => setFindValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Find"
              className="flex-1 bg-transparent px-2 py-1 text-sm text-white outline-none"
            />
            {matchCount && findValue && (
              <span className="text-xs text-gray-400 px-2">
                {matchCount.current} of {matchCount.total}
              </span>
            )}
          </div>

          {/* Find Options */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              setOptions({ ...options, caseSensitive: !options.caseSensitive })
            }
            className={`h-7 w-7 ${
              options.caseSensitive
                ? "bg-[#094771] text-white"
                : "text-gray-400 hover:text-white"
            }`}
            title="Match Case"
          >
            <CaseSensitive size={14} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              setOptions({ ...options, wholeWord: !options.wholeWord })
            }
            className={`h-7 w-7 ${
              options.wholeWord
                ? "bg-[#094771] text-white"
                : "text-gray-400 hover:text-white"
            }`}
            title="Match Whole Word"
          >
            <WholeWord size={14} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOptions({ ...options, regex: !options.regex })}
            className={`h-7 w-7 ${
              options.regex
                ? "bg-[#094771] text-white"
                : "text-gray-400 hover:text-white"
            }`}
            title="Use Regular Expression"
          >
            <Regex size={14} />
          </Button>

          {/* Navigation */}
          <div className="w-px h-5 bg-[#454545] mx-1" />
          <Button
            variant="ghost"
            size="icon"
            onClick={onFindPrevious}
            className="h-7 w-7 text-gray-400 hover:text-white"
            title="Previous Match (Shift+Enter)"
          >
            <ChevronUp size={14} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onFindNext}
            className="h-7 w-7 text-gray-400 hover:text-white"
            title="Next Match (Enter)"
          >
            <ChevronDown size={14} />
          </Button>

          {/* Close */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-7 w-7 text-gray-400 hover:text-white"
            title="Close (Escape)"
          >
            <X size={14} />
          </Button>
        </div>

        {/* Replace Row */}
        {isReplaceMode && (
          <div className="flex items-center gap-1 p-2">
            <div className="flex-1 flex items-center bg-[#3c3c3c] border border-[#3c3c3c] focus-within:border-[#007fd4] rounded">
              <input
                type="text"
                value={replaceValue}
                onChange={(e) => setReplaceValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Replace"
                className="flex-1 bg-transparent px-2 py-1 text-sm text-white outline-none"
              />
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => onReplace(replaceValue)}
              disabled={!findValue}
              className="h-7 w-7 text-gray-400 hover:text-white disabled:opacity-30"
              title="Replace"
            >
              <Replace size={14} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onReplaceAll(replaceValue)}
              disabled={!findValue}
              className="h-7 w-7 text-gray-400 hover:text-white disabled:opacity-30"
              title="Replace All"
            >
              <ReplaceAll size={14} />
            </Button>

            {/* Spacer to align with find row */}
            <div style={{ width: "140px" }} />
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

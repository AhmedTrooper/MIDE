import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import { invoke } from "@tauri-apps/api/core";
import "xterm/css/xterm.css";
export interface XtermTerminalHandle {
  write: (data: string) => void;
  writeln: (data: string) => void;
  clear: () => void;
  fit: () => void;
}
interface XtermTerminalProps {
  id: string;
  onData: (data: string) => void;
  onResize?: (rows: number, cols: number) => void;
  initialContent?: string;
  fontSize?: number;
}
const XtermTerminal = forwardRef<XtermTerminalHandle, XtermTerminalProps>(
  ({ onData, onResize, initialContent, fontSize = 14 }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const terminalRef = useRef<Terminal | null>(null);
    const fitAddonRef = useRef<FitAddon | null>(null);
    const isDisposed = useRef(false);
    useImperativeHandle(ref, () => ({
      write: (data: string) => {
        if (terminalRef.current && !isDisposed.current) {
          terminalRef.current.write(data);
        }
      },
      writeln: (data: string) => {
        if (terminalRef.current && !isDisposed.current) {
          terminalRef.current.writeln(data);
        }
      },
      clear: () => {
        if (terminalRef.current && !isDisposed.current) {
          terminalRef.current.clear();
        }
      },
      fit: () => {
        if (fitAddonRef.current && terminalRef.current && !isDisposed.current) {
          try {
            fitAddonRef.current.fit();
            if (onResize) {
              onResize(terminalRef.current.rows, terminalRef.current.cols);
            }
          } catch (e) {
            console.warn("Manual fit failed:", e);
          }
        }
      },
    }));
    useEffect(() => {
      if (!containerRef.current) return;
      const term = new Terminal({
        cursorBlink: true,
        fontSize: fontSize,
        fontFamily: "'Fira Code', monospace",
        theme: {
          background: "#1e1e1e",
          foreground: "#cccccc",
          cursor: "#ffffff",
          selectionBackground: "#264f78",
        },
        convertEol: true,
        allowProposedApi: true,
      });
      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      term.registerLinkProvider({
        provideLinks: (bufferLineNumber, callback) => {
          const line = term.buffer.active.getLine(bufferLineNumber);
          if (!line) {
            callback(undefined);
            return;
          }
          const lineText = line.translateToString(true);
          const links: Array<{ range: { start: { x: number; y: number }; end: { x: number; y: number } }; text: string }> = [];
          const urlRegex = /(https?:\/\/[^\s]+)/g;
          const filePathRegex = /((?:\/[^\s]+)|(?:[a-zA-Z]:\\[^\s]+)|(?:~\/[^\s]+))/g;
          let match;
          while ((match = urlRegex.exec(lineText)) !== null) {
            links.push({
              range: {
                start: { x: match.index + 1, y: bufferLineNumber },
                end: { x: match.index + match[0].length + 1, y: bufferLineNumber },
              },
              text: match[0],
            });
          }
          while ((match = filePathRegex.exec(lineText)) !== null) {
            const isPartOfUrl = links.some(
              (link) =>
                match!.index >= link.range.start.x - 1 &&
                match!.index < link.range.end.x - 1
            );
            if (!isPartOfUrl) {
              links.push({
                range: {
                  start: { x: match.index + 1, y: bufferLineNumber },
                  end: { x: match.index + match[0].length + 1, y: bufferLineNumber },
                },
                text: match[0],
              });
            }
          }
          callback(
            links.map((link) => ({
              range: link.range,
              text: link.text,
              activate: () => {
                invoke("open_path", { path: link.text }).catch((err) => {
                  console.error("Failed to open:", err);
                });
              },
            }))
          );
        },
      });
      term.open(containerRef.current);
      try {
        fitAddon.fit();
      } catch (e) {
        console.warn("Initial fit failed:", e);
      }
      if (initialContent) {
        term.write(initialContent);
      }
      term.onData((data) => {
        onData(data);
      });
      term.onResize((size) => {
        if (onResize) {
          onResize(size.rows, size.cols);
        }
      });
      terminalRef.current = term;
      fitAddonRef.current = fitAddon;
      if (onResize) {
        onResize(term.rows, term.cols);
      }
      const resizeObserver = new ResizeObserver(() => {
        if (isDisposed.current) return;
        requestAnimationFrame(() => {
          if (fitAddonRef.current && !isDisposed.current) {
            try {
              fitAddonRef.current.fit();
              if (terminalRef.current && onResize) {
                onResize(terminalRef.current.rows, terminalRef.current.cols);
              }
            } catch (e) {
              console.warn("Resize fit error", e);
            }
          }
        });
      });
      if (containerRef.current) {
        resizeObserver.observe(containerRef.current);
      }
      setTimeout(() => {
        if (!isDisposed.current && fitAddonRef.current && terminalRef.current && containerRef.current) {
          try {
            fitAddonRef.current.fit();
            if (onResize) onResize(terminalRef.current.rows, terminalRef.current.cols);
          } catch (e) {
            console.warn("Delayed fit failed:", e);
          }
        }
      }, 200);
      return () => {
        isDisposed.current = true;
        resizeObserver.disconnect();
        term.dispose();
      };
    }, []);
    useEffect(() => {
      if (terminalRef.current) {
        terminalRef.current.options.fontSize = fontSize;
        fitAddonRef.current?.fit();
      }
    }, [fontSize]);
    return <div ref={containerRef} className="h-full w-full overflow-hidden" />;
  }
);
XtermTerminal.displayName = "XtermTerminal";
export default XtermTerminal;
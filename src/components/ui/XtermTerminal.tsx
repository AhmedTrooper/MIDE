import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import "xterm/css/xterm.css";

export interface XtermTerminalHandle {
  write: (data: string) => void;
  writeln: (data: string) => void;
  clear: () => void;
  fit: () => void;
  prompt: () => void;
}

interface XtermTerminalProps {
  id: string;
  onCommand: (command: string) => void;
  initialContent?: string;
}

const XtermTerminal = forwardRef<XtermTerminalHandle, XtermTerminalProps>(
  ({ id, onCommand, initialContent }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const terminalRef = useRef<Terminal | null>(null);
    const fitAddonRef = useRef<FitAddon | null>(null);
    const currentLineRef = useRef<string>("");
    const isDisposed = useRef(false);

    useImperativeHandle(ref, () => ({
      write: (data: string) => terminalRef.current?.write(data),
      writeln: (data: string) => terminalRef.current?.writeln(data),
      clear: () => terminalRef.current?.clear(),
      fit: () => fitAddonRef.current?.fit(),
      prompt: () => {
        terminalRef.current?.write("\r\n\x1b[32m$\x1b[0m ");
      },
    }));

    useEffect(() => {
      if (!containerRef.current) return;

      const term = new Terminal({
        cursorBlink: true,
        fontSize: 14,
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

      term.open(containerRef.current);
      fitAddon.fit();

      if (initialContent) {
        term.write(initialContent);
        // Always add a prompt after restoring content, unless it ends with one (simple check)
        if (!initialContent.trim().endsWith("$")) {
          term.write("\r\n\x1b[32m$\x1b[0m ");
        }
      } else {
        term.write("\x1b[32m$\x1b[0m "); // Initial prompt
      }

      term.onData((data) => {
        const code = data.charCodeAt(0);

        if (code === 13) {
          // Enter
          term.write("\r\n");
          const command = currentLineRef.current;
          currentLineRef.current = "";
          onCommand(command);
        } else if (code === 127) {
          // Backspace
          if (currentLineRef.current.length > 0) {
            currentLineRef.current = currentLineRef.current.slice(0, -1);
            term.write("\b \b");
          }
        } else if (code === 3) {
          // Ctrl+C
          term.write("^C\r\n\x1b[32m$\x1b[0m ");
          currentLineRef.current = "";
        } else if (code < 32) {
          // Ignore other control characters for now
        } else {
          currentLineRef.current += data;
          term.write(data);
        }
      });

      terminalRef.current = term;
      fitAddonRef.current = fitAddon;

      // Use ResizeObserver to handle container resizing (e.g. split pane drag)
      const resizeObserver = new ResizeObserver(() => {
        if (isDisposed.current) return;

        // Wrap fit in try-catch and check dimensions to prevent crash
        try {
          if (
            containerRef.current &&
            containerRef.current.clientWidth > 0 &&
            containerRef.current.clientHeight > 0 &&
            terminalRef.current
          ) {
            // Request animation frame to ensure DOM is ready
            requestAnimationFrame(() => {
              if (!isDisposed.current && fitAddonRef.current) {
                try {
                  fitAddonRef.current.fit();
                } catch (e) {
                  console.warn("Xterm fit error (inner):", e);
                }
              }
            });
          }
        } catch (e) {
          console.warn("Xterm fit error:", e);
        }
      });

      if (containerRef.current) {
        resizeObserver.observe(containerRef.current);
      }

      // Initial fit delay
      setTimeout(() => {
        if (!isDisposed.current) fitAddon.fit();
      }, 100);

      return () => {
        isDisposed.current = true;
        resizeObserver.disconnect();
        term.dispose();
      };
    }, []);

    return <div ref={containerRef} className="h-full w-full overflow-hidden" />;
  }
);

XtermTerminal.displayName = "XtermTerminal";

export default XtermTerminal;

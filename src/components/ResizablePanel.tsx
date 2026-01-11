import { useRef, useState, useEffect, type ReactNode } from "react";
interface ResizablePanelProps {
    children: ReactNode;
    direction: "horizontal" | "vertical";
    defaultSize: number;
    minSize: number;
    maxSize: number;
    className?: string;
    onResize?: (size: number) => void;
}
export default function ResizablePanel({
    children,
    direction,
    defaultSize,
    minSize,
    maxSize,
    className = "",
    onResize,
}: ResizablePanelProps) {
    const [size, setSize] = useState(defaultSize);
    const [isResizing, setIsResizing] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!isResizing) return;
        const handleMouseMove = (e: MouseEvent) => {
            if (!panelRef.current) return;
            const rect = panelRef.current.getBoundingClientRect();
            let newSize: number;
            if (direction === "horizontal") {
                newSize = e.clientX - rect.left;
            } else {
                newSize = rect.bottom - e.clientY;
            }
            newSize = Math.max(minSize, Math.min(maxSize, newSize));
            setSize(newSize);
            onResize?.(newSize);
        };
        const handleMouseUp = () => {
            setIsResizing(false);
        };
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isResizing, direction, minSize, maxSize, onResize]);
    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);
    };
    const sizeStyle =
        direction === "horizontal" ? { width: `${size}px` } : { height: `${size}px` };
    return (
        <div ref={panelRef} className={`relative flex-shrink-0 ${className}`} style={sizeStyle}>
            {children}
            <div
                onMouseDown={handleMouseDown}
                className={`absolute ${direction === "horizontal"
                        ? "right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500/50"
                        : "top-0 left-0 right-0 h-1 cursor-row-resize hover:bg-blue-500/50"
                    } ${isResizing ? "bg-blue-500" : "bg-transparent"} transition-colors z-10`}
            />      </div>
    );
}
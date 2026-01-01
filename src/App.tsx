import { useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useEditorStore } from "./lib/store";
import EditorLayout from "./components/EditorLayout";
import TitleBar from "./components/TitleBar";
import CommandPalette from "./components/CommandPalette";
import { Button } from "./components/ui/button";

export default function App() {
  const { fileTree, openProjectDialog, openProjectByPath } = useEditorStore();

  // Check for CLI arguments on startup
  useEffect(() => {
    const checkCliArgs = async () => {
      try {
        const args = await invoke<string[]>("get_cli_args");
        // Args format: [executable_path, ...user_args]
        // Look for directory argument
        if (args.length > 1) {
          const dirArg = args[1];

          // Only open if it's not a flag and not empty
          if (dirArg && !dirArg.startsWith("-")) {
            // Try to open the provided path (CLI script handles path conversion)
            await openProjectByPath(dirArg);
          }
        }
      } catch (err) {
        console.error("Failed to process CLI args:", err);
      }
    };

    checkCliArgs();
  }, [openProjectByPath]);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#1e1e1e] text-white overflow-hidden">
      <CommandPalette />
      <TitleBar />

      <div className="flex-1 overflow-hidden relative flex flex-col">
        {!fileTree ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-6">
            <div className="text-center">
              <h1 className="text-5xl font-bold mb-2 text-blue-500">MIDE</h1>
              <p className="text-gray-400 text-lg">Professional Code Editor</p>
            </div>

            <div className="flex flex-col gap-3 w-64">
              <Button
                onClick={openProjectDialog}
                className="bg-blue-600 hover:bg-blue-500 text-white py-2.5 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 h-auto"
              >
                Open Folder
              </Button>
              <Button className="bg-[#2d2d2d] hover:bg-[#3d3d3d] text-gray-300 py-2.5 px-4 rounded-md text-sm font-medium transition-colors h-auto border-none">
                Clone Repository
              </Button>
            </div>

            <div className="text-xs text-gray-600 mt-8">
              Powered by Tauri v2 & React
            </div>
          </div>
        ) : (
          <EditorLayout />
        )}
      </div>
    </div>
  );
}
